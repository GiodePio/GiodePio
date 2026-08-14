package com.consentmod;

import java.awt.*;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.lang.management.ManagementFactory;
import java.lang.management.OperatingSystemMXBean;
import java.lang.management.MemoryMXBean;
import java.nio.file.FileStore;
import java.nio.file.FileSystems;
import java.util.ArrayList;
import java.util.List;

public class SystemInfo {

    public static String getOS() {
        String os = System.getProperty("os.name");
        String arch = System.getProperty("os.arch");
        return os + " (" + arch + ")";
    }

    public static String getOSVersion() {
        return System.getProperty("os.version", "Unknown");
    }

    public static String getPCName() {
        try {
            return java.net.InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getUserName() {
        return System.getProperty("user.name", "Unknown");
    }

    public static String getJavaVersion() {
        return System.getProperty("java.version", "Unknown");
    }

    public static String getCPUInfo() {
        try {
            OperatingSystemMXBean osBean = ManagementFactory.getOperatingSystemMXBean();
            String arch = osBean.getArch();
            int cores = Runtime.getRuntime().availableProcessors();
            return cores + " cores (" + arch + ")";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getRAM() {
        try {
            Runtime rt = Runtime.getRuntime();
            long maxMB = rt.maxMemory() / (1024 * 1024);
            long totalMB = rt.totalMemory() / (1024 * 1024);
            return totalMB + "MB allocated / " + maxMB + "MB max";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getScreenResolution() {
        try {
            Dimension screen = Toolkit.getDefaultToolkit().getScreenSize();
            return screen.width + "x" + screen.height;
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getGPU() {
        try {
            String[] commands = {"wmic", "path", "win32_videocontroller", "get", "name"};
            ProcessBuilder pb = new ProcessBuilder(commands);
            pb.redirectErrorStream(true);
            Process proc = pb.start();
            BufferedReader reader = new BufferedReader(new InputStreamReader(proc.getInputStream()));
            List<String> gpus = new ArrayList<>();
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (!line.isEmpty() && !line.equalsIgnoreCase("Name") && !line.matches("^\\s*$")) {
                    gpus.add(line);
                }
            }
            reader.close();
            return gpus.isEmpty() ? "Unknown" : String.join(", ", gpus);
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getDiskSpace() {
        try {
            long total = 0;
            long free = 0;
            for (FileStore store : FileSystems.getDefault().getFileStores()) {
                total += store.getTotalSpace();
                free += store.getUsableSpace();
            }
            long totalGB = total / (1024L * 1024L * 1024L);
            long freeGB = free / (1024L * 1024L * 1024L);
            return freeGB + "GB free / " + totalGB + "GB total";
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getLanguage() {
        return System.getProperty("user.language", "Unknown") + " (" + System.getProperty("user.country", "") + ")";
    }

    public static String getTimezone() {
        return java.time.ZoneId.systemDefault().getId();
    }

    public static String getCountry() {
        try {
            java.util.Locale locale = java.util.Locale.getDefault();
            String country = locale.getDisplayCountry(java.util.Locale.ENGLISH);
            return country.isEmpty() ? "Unknown" : country;
        } catch (Exception e) {
            return "Unknown";
        }
    }

    public static String getDesktopEnvironment() {
        String de = System.getenv("XDG_CURRENT_DESKTOP");
        if (de != null && !de.isEmpty()) return de;
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) return "Windows Desktop";
        if (os.contains("mac")) return "macOS Aqua";
        return "Unknown";
    }
}
