const { contextBridge, ipcRenderer } = require('electron');

/**
 * Exposes a safe, typed IPC bridge to the React renderer.
 * Covers: Fastboot operations + Qualcomm EDL operations.
 */
contextBridge.exposeInMainWorld('electronAPI', {

  // ── Fastboot ──────────────────────────────────────────────────────────────
  flashDevice: (partition, file, loader) => {
    ipcRenderer.send('fastboot-flash', { partition, file, loader });
  },
  readDevice: (comPort) => {
    ipcRenderer.send('read-device', { comPort });
  },
  onFlashEvent: (callback) => {
    ipcRenderer.on('fastboot-log', (_e, payload) => callback(payload));
  },
  onReadResult: (callback) => {
    ipcRenderer.on('read-result', (_e, payload) => callback(payload));
  },

  // ── Qualcomm EDL ─────────────────────────────────────────────────────────

  /** Check if edl Python tool is installed */
  edlCheck: () => ipcRenderer.send('edl-check'),

  /** Scan USB for Qualcomm 9008 device */
  edlDetect: () => ipcRenderer.send('edl-detect'),

  /** Read full device info via Sahara + Firehose */
  edlReadInfo: (loaderPath) => ipcRenderer.send('edl-read-info', { loaderPath }),

  /** Read GPT partition table */
  edlPartitions: (loaderPath) => ipcRenderer.send('edl-partitions', { loaderPath }),

  /** Flash a partition: edl wl <file> --partitionname <partition> --loader <loader> */
  edlFlash: (partition, filePath, loaderPath) =>
    ipcRenderer.send('edl-flash', { partition, filePath, loaderPath }),

  /** Erase a partition */
  edlErase: (partition, loaderPath) =>
    ipcRenderer.send('edl-erase', { partition, loaderPath }),

  /** Reboot device back to normal OS */
  edlReset: (loaderPath) => ipcRenderer.send('edl-reset', { loaderPath }),

  /**
   * Listen for all EDL events streamed from main process.
   * payload: { type: 'info'|'success'|'warning'|'error'|'progress'|'done', channel: string, data: string|number, found?: boolean, available?: boolean }
   */
  onEdlEvent: (callback) => {
    ipcRenderer.on('edl-event', (_e, payload) => callback(payload));
  },

  // ── MediaTek BROM ────────────────────────────────────────────────────────
  mtkCheck: () => ipcRenderer.send('mtk-check'),
  mtkDetect: () => ipcRenderer.send('mtk-detect'),
  mtkReadInfo: () => ipcRenderer.send('mtk-read-info'),
  mtkFlash: (partition, filePath, daPath, scatterPath) =>
    ipcRenderer.send('mtk-flash', { partition, filePath, daPath, scatterPath }),
  onMtkEvent: (callback) => {
    ipcRenderer.on('mtk-event', (_e, payload) => callback(payload));
  },

  // ── Samsung Odin/Heimdall ──────────────────────────────────────────────────
  samsungCheck: () => ipcRenderer.send('samsung-check'),
  samsungDetect: () => ipcRenderer.send('samsung-detect'),
  samsungFlash: (payload) => ipcRenderer.send('samsung-flash', payload),
  onSamsungEvent: (callback) => {
    ipcRenderer.on('samsung-event', (_e, payload) => callback(payload));
  },

  // ── Generic Unlock & FRP ───────────────────────────────────────────────────
  runUnlock: (method) => ipcRenderer.send('unlock-operation', { method }),
  onUnlockEvent: (callback) => ipcRenderer.on('unlock-event', (_e, payload) => callback(payload)),
  runFrp: (vendor, mode) => ipcRenderer.send('frp-operation', { vendor, mode }),
  onFrpEvent: (callback) => ipcRenderer.on('frp-event', (_e, payload) => callback(payload)),

  // ── Shared ────────────────────────────────────────────────────────────────
  /** Remove all listeners for a given IPC channel (call on component unmount) */
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },
});

