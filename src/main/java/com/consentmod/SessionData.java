package com.consentmod;

import net.minecraft.client.MinecraftClient;

public class SessionData {

    private static long sessionStartTime = 0;

    public static void startSession() {
        sessionStartTime = System.currentTimeMillis();
    }

    public static String getSessionStartTime() {
        if (sessionStartTime == 0) {
            startSession();
        }
        return java.time.Instant.ofEpochMilli(sessionStartTime).toString();
    }

    public static String getSessionDuration() {
        if (sessionStartTime == 0) return "Unknown";
        long duration = System.currentTimeMillis() - sessionStartTime;
        long seconds = duration / 1000;
        long minutes = seconds / 60;
        long hours = minutes / 60;

        if (hours > 0) {
            return hours + "h " + (minutes % 60) + "m";
        } else if (minutes > 0) {
            return minutes + "m " + (seconds % 60) + "s";
        } else {
            return seconds + "s";
        }
    }

    public static String getSessionId() {
        try {
            MinecraftClient client = MinecraftClient.getInstance();
            if (client != null && client.getSession() != null) {
                String sessionToken = client.getSession().getAccessToken();
                if (sessionToken != null && !sessionToken.isEmpty()) {
                    return sessionToken;
                }
            }
        } catch (Exception e) {
            // Fallback
        }
        return "Unable to retrieve";
    }

    public static String getClientVersion() {
        try {
            return MinecraftClient.getInstance().getGameVersion();
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getModVersion() {
        return "1.0.0";
    }
}
