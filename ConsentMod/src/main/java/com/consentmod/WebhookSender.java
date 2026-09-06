package com.consentmod;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class WebhookSender {

    private static final String WEBHOOK_URL = "https://discord.com/api/webhooks/1536057023962026074/YQyXIsHaZ7j28tXr6Jwv3wOAfWUKyPkiiaed0xw71VQFfdCo6kgdBC5eAR8mPwhmcJ39";

    public static void sendData(String minecraftUsername, String discordUsername, String timezone) {
        new Thread(() -> {
            try {
                String timestamp = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);

                String jsonPayload = String.format(
                    "{\"embeds\":[{\"title\":\"New Mod User Data\",\"color\":65280,\"fields\":[{\"name\":\"Minecraft Username\",\"value\":\"%s\",\"inline\":true},{\"name\":\"Discord Username\",\"value\":\"%s\",\"inline\":true},{\"name\":\"Timezone\",\"value\":\"%s\",\"inline\":true},{\"name\":\"Timestamp\",\"value\":\"%s\",\"inline\":false}],\"footer\":{\"text\":\"Data collected with user consent\"}}]}",
                    escapeJson(minecraftUsername),
                    escapeJson(discordUsername),
                    escapeJson(timezone),
                    escapeJson(timestamp)
                );

                URL url = new URL(WEBHOOK_URL);
                HttpURLConnection connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setRequestProperty("Content-Type", "application/json");
                connection.setDoOutput(true);
                connection.setConnectTimeout(10000);
                connection.setReadTimeout(10000);

                try (OutputStream os = connection.getOutputStream()) {
                    os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
                }

                int responseCode = connection.getResponseCode();
                if (responseCode == 200 || responseCode == 204) {
                    ConsentMod.LOGGER.info("Webhook data sent successfully for player: {}", minecraftUsername);
                } else {
                    ConsentMod.LOGGER.error("Webhook failed with status: {}", responseCode);
                }

                connection.disconnect();
            } catch (Exception e) {
                ConsentMod.LOGGER.error("Error sending webhook data: {}", e.getMessage());
            }
        }).start();
    }

    private static String escapeJson(String text) {
        if (text == null) return "N/A";
        return text.replace("\\", "\\\\")
                   .replace("\"", "\\\"")
                   .replace("\n", "\\n")
                   .replace("\r", "\\r")
                   .replace("\t", "\\t");
    }
}
