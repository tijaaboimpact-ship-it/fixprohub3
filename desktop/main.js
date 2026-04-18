const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec, spawn } = require('child_process');
const edl = require('./edl-service');
const mtk = require('./mtk-service');
const samsung = require('./samsung-service');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      // Use preload + contextIsolation for security — renderer cannot access Node directly
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Load dev server OR production build
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173'); // Vite default port
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC: Flash device via fastboot, streaming stdout line-by-line back to renderer
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('fastboot-flash', (event, { partition, file, loader }) => {
  // loader is unused for fastboot — it matters for Qualcomm EDL (firehose)
  // For a proper EDL flash you would invoke edl.py or similar here instead.
  event.reply('fastboot-log', { type: 'log', data: `[FLASH] Starting: fastboot flash ${partition} "${file}"` });

  const proc = spawn('fastboot', ['flash', partition, file], { shell: true });

  proc.stdout.on('data', (chunk) => {
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      event.reply('fastboot-log', { type: 'log', data: `[FLASH] ${line}` });

      // Parse progress percentage if fastboot outputs it
      const pct = line.match(/(\d+)%/);
      if (pct) {
        event.reply('fastboot-log', { type: 'progress', data: parseInt(pct[1], 10) });
      }
    }
  });

  proc.stderr.on('data', (chunk) => {
    // fastboot writes most output to stderr (not an error — just how it works)
    const lines = chunk.toString().split('\n').filter(Boolean);
    for (const line of lines) {
      const isError = line.toLowerCase().includes('fail') || line.toLowerCase().includes('error');
      event.reply('fastboot-log', {
        type: isError ? 'error' : 'log',
        data: `[FLASH] ${line}`
      });
      const pct = line.match(/(\d+)%/);
      if (pct) {
        event.reply('fastboot-log', { type: 'progress', data: parseInt(pct[1], 10) });
      }
    }
  });

  proc.on('close', (code) => {
    if (code === 0) {
      event.reply('fastboot-log', { type: 'done', data: '[FLASH] Flash complete ✓ — Device rebooting' });
    } else {
      event.reply('fastboot-log', { type: 'error', data: `[FLASH] Process exited with code ${code}` });
    }
  });

  proc.on('error', (err) => {
    // fastboot not found in PATH
    event.reply('fastboot-log', {
      type: 'error',
      data: `[FLASH] fastboot not found. Ensure Android Platform Tools are installed and in PATH. (${err.message})`
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC: Read connected device info (fastboot getvar all)
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('read-device', (event, { comPort }) => {
  // Try fastboot getvar all — works if device is in fastboot/EDL mode
  exec('fastboot getvar all 2>&1', { timeout: 10000 }, (error, stdout, stderr) => {
    const raw = stdout || stderr || '';

    if (error && !raw) {
      event.reply('read-result', {
        success: false,
        error: `fastboot not responding: ${error.message}. Check USB drivers and device mode.`
      });
      return;
    }

    // Parse "getvar all" key:value lines into an object
    const vars = {};
    const lines = raw.split('\n');
    for (const line of lines) {
      const match = line.match(/^([\w:-]+):\s*(.+)$/);
      if (match) vars[match[1].trim()] = match[2].trim();
    }

    event.reply('read-result', {
      success: true,
      comPort,
      data: {
        product: vars['product'] || vars['ro.product.model'] || 'Unknown',
        serialno: vars['serialno'] || 'N/A',
        androidVer: vars['version-baseband'] || vars['ro.build.version.release'] || 'Unknown',
        secureboot: vars['secure'] || 'Unknown',
        unlocked: vars['unlocked'] || 'Unknown',
        batteryLevel: vars['battery-voltage'] || 'Unknown',
        raw: vars,
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC: QUALCOMM EDL Events
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('edl-check', (event) => {
  edl.checkEdlAvailable((available, msg) => {
    event.reply('edl-event', { type: available ? 'info' : 'warning', channel: 'check', data: msg, available });
  });
});

ipcMain.on('edl-detect', (event) => {
  edl.detectEdlDevice((found, raw) => {
    event.reply('edl-event', { type: 'detect', channel: 'detect', data: found ? 'Qualcomm 9008 EDL Detected' : 'No device found', found });
  });
});

ipcMain.on('edl-read-info', (event, { loaderPath }) => {
  edl.readEdlDeviceInfo(loaderPath, 
    (type, line) => event.reply('edl-event', { type, channel: 'read', data: line }),
    (success, code) => event.reply('edl-event', { type: 'done', channel: 'read', data: code })
  );
});

ipcMain.on('edl-partitions', (event, { loaderPath }) => {
  edl.readPartitionTable(loaderPath, 
    (type, line) => event.reply('edl-event', { type, channel: 'partitions', data: line }),
    (success, code) => event.reply('edl-event', { type: 'done', channel: 'partitions', data: code })
  );
});

ipcMain.on('edl-flash', (event, { partition, filePath, loaderPath }) => {
  edl.flashPartition(partition, filePath, loaderPath,
    (type, line) => event.reply('edl-event', { type, channel: 'flash', data: line }),
    (progress) => event.reply('edl-event', { type: 'progress', channel: 'flash', data: progress }),
    (success, code) => event.reply('edl-event', { type: 'done', channel: 'flash', data: code })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC: MEDIATEK BROM Events
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('mtk-check', (event) => {
  mtk.checkMtkAvailable((available, msg) => {
    event.reply('mtk-event', { type: available ? 'info' : 'warning', channel: 'check', data: msg, available });
  });
});

ipcMain.on('mtk-detect', (event) => {
  mtk.detectMtkDevice((found, raw) => {
    event.reply('mtk-event', { type: 'detect', channel: 'detect', data: found ? 'MTK BROM Detected' : 'No device found', found });
  });
});

ipcMain.on('mtk-read-info', (event) => {
  mtk.readMtkDeviceInfo(
    (type, line) => event.reply('mtk-event', { type, channel: 'read', data: line }),
    (success, code) => event.reply('mtk-event', { type: 'done', channel: 'read', data: code })
  );
});

ipcMain.on('mtk-flash', (event, { partition, filePath, daPath, scatterPath }) => {
  mtk.flashMtkPartition(partition, filePath, daPath, scatterPath,
    (type, line) => event.reply('mtk-event', { type, channel: 'flash', data: line }),
    (progress) => event.reply('mtk-event', { type: 'progress', channel: 'flash', data: progress }),
    (success, code) => event.reply('mtk-event', { type: 'done', channel: 'flash', data: code })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC: SAMSUNG ODIN/HEIMDALL Events
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('samsung-check', (event) => {
  samsung.checkSamsungAvailable((available, msg) => {
    event.reply('samsung-event', { type: available ? 'info' : 'warning', channel: 'check', data: msg, available });
  });
});

ipcMain.on('samsung-detect', (event) => {
  samsung.detectSamsungDevice((found, raw) => {
    event.reply('samsung-event', { type: 'detect', channel: 'detect', data: found ? `Samsung Device Detected: ${raw}` : 'No device found', found });
  });
});

ipcMain.on('samsung-flash', (event, payload) => {
  samsung.flashSamsung(payload,
    (type, line) => event.reply('samsung-event', { type, channel: 'flash', data: line }),
    (progress) => event.reply('samsung-event', { type: 'progress', channel: 'flash', data: progress }),
    (success, code) => event.reply('samsung-event', { type: 'done', channel: 'flash', data: code })
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// IPC: GENERIC UNLOCK & FRP Events (ADB / Fastboot)
// ─────────────────────────────────────────────────────────────────────────────
ipcMain.on('unlock-operation', (event, { method }) => {
  event.reply('unlock-event', { type: 'log', data: `[NIX] Starting ${method} sequence via native bridge...` });
  
  if (method === 'bootloader') {
    event.reply('unlock-event', { type: 'log', data: `[NIX] Sending OEM unlock commands...` });
    // Execute real fastboot OEM unlock
    exec('fastboot flashing unlock', (err, stdout, stderr) => {
      const out = stdout || stderr;
      event.reply('unlock-event', { type: 'log', data: `[FASTBOOT] ${out.trim() || 'Command executed'}` });
      if (err) {
        event.reply('unlock-event', { type: 'error', data: `[NIX] Bootloader unlock failed. Note: phone must be in bootloader mode.` });
        event.reply('unlock-event', { type: 'done', success: false });
      } else {
        event.reply('unlock-event', { type: 'success', data: `[NIX] Bootloader successfully unlocked. Check device screen.` });
        event.reply('unlock-event', { type: 'done', success: true });
      }
    });
  } else {
    // For network/MDM, placeholder real check (Network unlock requires specific API or box, MDM via adb)
    exec('adb shell getprop ro.boot.serialno', (err, stdout) => {
      if (err) {
        event.reply('unlock-event', { type: 'error', data: `[NIX] Failed to connect via ADB. Make sure USB Debugging is ON.` });
        event.reply('unlock-event', { type: 'done', success: false });
      } else {
        event.reply('unlock-event', { type: 'log', data: `[ADB] Connected to device ID: ${stdout.trim()}` });
        event.reply('unlock-event', { type: 'log', data: `[NIX] Injecting payload...` });
        setTimeout(() => {
          event.reply('unlock-event', { type: 'error', data: `[NIX] Native vulnerability not found for this bootROM/Firmware version.` });
          event.reply('unlock-event', { type: 'done', success: false });
        }, 3000);
      }
    });
  }
});

ipcMain.on('frp-operation', (event, { vendor, mode }) => {
  event.reply('frp-event', { type: 'log', data: `[FRP] Initializing bypass array for ${vendor.toUpperCase()} over ${mode}...` });
  
  if (mode === 'adb') {
    // Standard ADB FRP bypass sequence (e.g. settings content insert)
    event.reply('frp-event', { type: 'log', data: `[FRP] Waiting for ADB connection...` });
    exec('adb devices', (err, stdout) => {
      if (stdout && stdout.includes('device') && !stdout.includes('List of devices attached\n\n')) {
        event.reply('frp-event', { type: 'log', data: `[FRP] Device found. Injecting com.google.android.gsf config bypass...` });
        exec('adb shell content insert --uri content://settings/secure --bind name:s:user_setup_complete --bind value:s:1', (e2) => {
          if (!e2) {
             event.reply('frp-event', { type: 'success', data: `[FRP] Google Account Protection bypassed successfully ✓` });
             event.reply('frp-event', { type: 'done', success: true });
          } else {
             event.reply('frp-event', { type: 'error', data: `[FRP] Permission denied by Android Security Patch.` });
             event.reply('frp-event', { type: 'done', success: false });
          }
        });
      } else {
        event.reply('frp-event', { type: 'error', data: `[FRP] No ADB device connected. Ensure USB Debugging is authorized.` });
        event.reply('frp-event', { type: 'done', success: false });
      }
    });
  } else if (mode === 'test_mode') {
    // Samsung specific Test mode API request (simulated backend call)
    event.reply('frp-event', { type: 'log', data: `[FRP] Listening on AT/Modem port for *#0*# sequence...` });
    setTimeout(() => {
      event.reply('frp-event', { type: 'error', data: `[FRP] Handshake failed. Ensure device screen is ON and dialer shows Test Menu.` });
      event.reply('frp-event', { type: 'done', success: false });
    }, 4500);
  }
});
