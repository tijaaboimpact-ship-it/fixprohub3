/**
 * FixPro Hub — Qualcomm EDL Service
 * 
 * Wraps the `edl` (bkerler/edl) Python tool as a subprocess.
 * All functions stream output back via IPC reply events.
 * 
 * Tool: https://github.com/bkerler/edl
 * Install: pip install edlclient
 * 
 * Qualcomm EDL USB IDs:
 *   VID: 0x05C6  PID: 0x9008  → Emergency Download Mode (EDL / Sahara)
 *   VID: 0x05C6  PID: 0x9025  → Qualcomm HS-USB QDLoader 9025
 */

const { exec, spawn } = require('child_process');
const path = require('path');

// Qualcomm USB identifiers
const QUALCOMM_VID = 0x05c6;
const EDL_PIDS = [0x9008, 0x9025, 0x900e];

// ─────────────────────────────────────────────────────────────────────────────
// Check if edl (Python CLI) is available on the system
// ─────────────────────────────────────────────────────────────────────────────
function checkEdlAvailable(callback) {
  exec('edl --version 2>&1', (err, stdout) => {
    if (!err && stdout) return callback(true, stdout.trim());
    // Try as Python module
    exec('python -m edlclient --version 2>&1', (err2, stdout2) => {
      if (!err2 && stdout2) return callback(true, stdout2.trim());
      callback(false, 'edl not found. Install with: pip install edlclient');
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Detect a Qualcomm device via WebUSB VID/PID (send to renderer for display)
// ─────────────────────────────────────────────────────────────────────────────
function detectEdlDevice(callback) {
  // Use edl to probe: 'edl printgpt' — if it succeeds a device is there
  const proc = spawn('edl', ['printgpt', '--loader', 'None'], { shell: true });
  let raw = '';

  proc.stdout.on('data', d => { raw += d.toString(); });
  proc.stderr.on('data', d => { raw += d.toString(); });

  proc.on('close', (code) => {
    const connected = raw.toLowerCase().includes('partition') || raw.toLowerCase().includes('sahara') || code === 0;
    callback(connected, raw.trim());
  });

  proc.on('error', () => {
    callback(false, 'edl command not found in PATH');
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read device info: runs 'edl getdevinfo' and parses the output
// ─────────────────────────────────────────────────────────────────────────────
function readEdlDeviceInfo(loaderPath, onLine, onDone) {
  const args = ['getdevinfo'];
  if (loaderPath) args.push('--loader', loaderPath);

  const proc = spawn('edl', args, { shell: true });

  proc.stdout.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => onLine('info', line.trim()));
  });

  proc.stderr.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      const isErr = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
      onLine(isErr ? 'error' : 'info', line.trim());
    });
  });

  proc.on('close', (code) => {
    onDone(code === 0, code);
  });

  proc.on('error', (err) => {
    onLine('error', `[EDL] Cannot run edl: ${err.message}`);
    onLine('error', '[EDL] Install with: pip install edlclient');
    onDone(false, -1);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Read partition table: runs 'edl printgpt'
// ─────────────────────────────────────────────────────────────────────────────
function readPartitionTable(loaderPath, onLine, onDone) {
  const args = ['printgpt'];
  if (loaderPath) args.push('--loader', loaderPath);

  const proc = spawn('edl', args, { shell: true });

  proc.stdout.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => onLine('info', line.trim()));
  });

  proc.stderr.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      const isErr = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
      onLine(isErr ? 'error' : 'info', line.trim());
    });
  });

  proc.on('close', (code) => onDone(code === 0, code));
  proc.on('error', (err) => {
    onLine('error', `[EDL] ${err.message}`);
    onDone(false, -1);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Flash a firmware file to a partition via EDL firehose
// partition: e.g. 'boot', 'system', 'userdata'
// file: absolute path to .img file
// loaderPath: absolute path to firehose .mbn file
// ─────────────────────────────────────────────────────────────────────────────
function flashPartition(partition, filePath, loaderPath, onLine, onProgress, onDone) {
  const args = ['wl', filePath];
  if (partition) args.push('--partitionname', partition);
  if (loaderPath) args.push('--loader', loaderPath);

  onLine('warning', `[EDL] Starting: edl wl "${filePath}" --partitionname "${partition}"`);
  if (loaderPath) onLine('info', `[EDL] Using loader: ${path.basename(loaderPath)}`);

  const proc = spawn('edl', args, { shell: true });

  proc.stdout.on('data', d => {
    const lines = d.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      onLine('info', line.trim());

      // Parse progress — edl outputs like "Progress: 45.2%"
      const pct = line.match(/progress[:\s]+(\d+(?:\.\d+)?)%/i);
      if (pct) onProgress(Math.floor(parseFloat(pct[1])));

      // Also parse bytes written
      const bytes = line.match(/(\d+)\s*\/\s*(\d+)\s*bytes/i);
      if (bytes) {
        const pctCalc = Math.floor((parseInt(bytes[1]) / parseInt(bytes[2])) * 100);
        onProgress(pctCalc);
      }
    });
  });

  proc.stderr.on('data', d => {
    const lines = d.toString().split('\n').filter(Boolean);
    lines.forEach(line => {
      const isErr = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
      onLine(isErr ? 'error' : 'info', line.trim());

      const pct = line.match(/progress[:\s]+(\d+(?:\.\d+)?)%/i);
      if (pct) onProgress(Math.floor(parseFloat(pct[1])));
    });
  });

  proc.on('close', (code) => onDone(code === 0, code));
  proc.on('error', (err) => {
    onLine('error', `[EDL] ${err.message}`);
    onLine('error', '[EDL] Make sure: pip install edlclient && edl --version');
    onDone(false, -1);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Erase a partition
// ─────────────────────────────────────────────────────────────────────────────
function erasePartition(partition, loaderPath, onLine, onDone) {
  const args = ['e', partition];
  if (loaderPath) args.push('--loader', loaderPath);

  const proc = spawn('edl', args, { shell: true });
  proc.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => onLine('info', l.trim())));
  proc.stderr.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => onLine('warning', l.trim())));
  proc.on('close', code => onDone(code === 0, code));
  proc.on('error', err => { onLine('error', `[EDL] ${err.message}`); onDone(false, -1); });
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset / reboot device
// ─────────────────────────────────────────────────────────────────────────────
function resetDevice(mode, loaderPath, onLine, onDone) {
  // mode: 'reset' | 'edl' | 'bootloader'
  const args = ['reset'];
  if (loaderPath) args.push('--loader', loaderPath);

  const proc = spawn('edl', args, { shell: true });
  proc.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => onLine('info', l.trim())));
  proc.stderr.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => onLine('info', l.trim())));
  proc.on('close', code => onDone(code === 0, code));
  proc.on('error', err => { onLine('error', `[EDL] ${err.message}`); onDone(false, -1); });
}

function detectComPort(callback) {
  // Use PowerShell to list serial ports matching Qualcomm VID/PID
  const psCommand = `Get-WmiObject Win32_SerialPort | Where-Object { $_.PNPDeviceID -match "VID_05C6.*PID_9008" } | Select-Object -ExpandProperty DeviceID`;
  exec(`powershell -Command "${psCommand}"`, { shell: true }, (err, stdout, stderr) => {
    if (err) {
      callback('', `Error detecting COM port: ${err.message}`);
      return;
    }
    const port = stdout.trim();
    callback(port, port ? `Found COM port ${port}` : 'No Qualcomm COM port found');
  });
}

module.exports = {
  QUALCOMM_VID,
  EDL_PIDS,
  checkEdlAvailable,
  detectEdlDevice,
  readEdlDeviceInfo,
  readPartitionTable,
  flashPartition,
  erasePartition,
  resetDevice,
  detectComPort,
};
  QUALCOMM_VID,
  EDL_PIDS,
  checkEdlAvailable,
  detectEdlDevice,
  readEdlDeviceInfo,
  readPartitionTable,
  flashPartition,
  erasePartition,
  resetDevice,
};
