const { exec, spawn } = require('child_process');
const path = require('path');

// Check if mtkclient is installed
function checkMtkAvailable(callback) {
  exec('mtk --version 2>&1', (err, stdout) => {
    if (!err && stdout) return callback(true, stdout.trim());
    exec('python -m mtkclient --version 2>&1', (err2, stdout2) => {
      if (!err2 && stdout2) return callback(true, stdout2.trim());
      callback(false, 'mtk not found. Install with: pip install mtkclient');
    });
  });
}

function detectMtkDevice(callback) {
  const proc = spawn('mtk', ['printgpt'], { shell: true });
  let raw = '';
  proc.stdout.on('data', d => { raw += d.toString(); });
  proc.stderr.on('data', d => { raw += d.toString(); });
  proc.on('close', (code) => {
    const connected = code === 0 || raw.toLowerCase().includes('partition') || raw.toLowerCase().includes('brom');
    callback(connected, raw.trim());
  });
  proc.on('error', () => callback(false, 'mtk command not found in PATH'));
}

function readMtkDeviceInfo(onLine, onDone) {
  const proc = spawn('mtk', ['printgpt'], { shell: true });
  proc.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(l => onLine('info', l.trim())));
  proc.stderr.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      const isErr = line.toLowerCase().includes('error') || line.toLowerCase().includes('fail');
      onLine(isErr ? 'error' : 'info', line.trim());
    });
  });
  proc.on('close', code => onDone(code === 0, code));
  proc.on('error', err => { onLine('error', `[MTK] ${err.message}`); onDone(false, -1); });
}

function flashMtkPartition(partition, filePath, daPath, scatterPath, onLine, onProgress, onDone) {
  const args = ['w', partition, filePath];
  if (daPath) args.push('--da', daPath);
  if (scatterPath) args.push('--preloader', scatterPath); // Often scatter or preloader is needed

  onLine('info', `[MTK] Starting flash: mtk ${args.join(' ')}`);

  const proc = spawn('mtk', args, { shell: true });

  const parseProgress = (line) => {
    onLine('info', line.trim());
    const pctMatch = line.match(/(\d+)%/i) || line.match(/progress.*?(\d+(?:\.\d+)?)%/i);
    if (pctMatch) onProgress(Math.floor(parseFloat(pctMatch[1])));
  };

  proc.stdout.on('data', d => d.toString().split('\n').filter(Boolean).forEach(parseProgress));
  proc.stderr.on('data', d => d.toString().split('\n').filter(Boolean).forEach(parseProgress));

  proc.on('close', code => onDone(code === 0, code));
  proc.on('error', err => { onLine('error', `[MTK] ${err.message}`); onDone(false, -1); });
}

module.exports = {
  checkMtkAvailable,
  detectMtkDevice,
  readMtkDeviceInfo,
  flashMtkPartition
};
