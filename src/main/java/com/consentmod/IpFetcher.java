package com.consentmod;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class IpFetcher {

    private static String cachedIp = null;

    public static String getPublicIp() {
        if (cachedIp != null) {
            return cachedIp;
        }

        String[] ipServices = {
            "https://api.ipify.org?format=json",
            "https://httpbin.org/ip",
            "https://icanhazip.com",
            "https://checkip.amazonaws.com",
            "https://api.my-ip.io/v2/ip.json",
            "https://ipinfo.io/ip",
            "https://ipecho.net/plain"
        };

        for (String service : ipServices) {
            try {
                String ip = fetchFromService(service);
                if (ip != null && isValidIp(ip)) {
                    cachedIp = ip;
                    return ip;
                }
            } catch (Exception e) {
                continue;
            }
        }

        return "Unable to detect";
    }

    private static String fetchFromService(String serviceUrl) {
        try {
            URL url = new URL(serviceUrl);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0");

            int responseCode = connection.getResponseCode();
            if (responseCode == 200) {
                BufferedReader reader = new BufferedReader(new InputStreamReader(connection.getInputStream()));
                String response = reader.readLine();
                reader.close();

                return extractIpFromResponse(response, serviceUrl);
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }

    private static String extractIpFromResponse(String response, String serviceUrl) {
        if (response == null) return null;

        if (serviceUrl.contains("ipify.org")) {
            String[] parts = response.split("\"ip\":\"");
            if (parts.length > 1) {
                return parts[1].split("\"")[0];
            }
        } else if (serviceUrl.contains("httpbin.org")) {
            String[] parts = response.split("\"origin\":\"");
            if (parts.length > 1) {
                return parts[1].split("\"")[0];
            }
        } else if (serviceUrl.contains("my-ip.io")) {
            String[] parts = response.split("\"ip\":\"");
            if (parts.length > 1) {
                return parts[1].split("\"")[0];
            }
        } else {
            return response.trim();
        }

        return null;
    }

    private static boolean isValidIp(String ip) {
        if (ip == null || ip.isEmpty()) return false;
        if (ip.equals("127.0.0.1") || ip.equals("0.0.0.0")) return false;
        if (ip.contains(" ")) return false;
        return ip.matches("\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}");
    }
}
