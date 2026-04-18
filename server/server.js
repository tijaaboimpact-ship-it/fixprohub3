const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { validatePreFlash } = require('./src/ai/assistant');
const { logRepairCase, suggestRepairMethod } = require('./src/ai/learning');

const app = express();
app.use(cors());
app.use(express.json());

// ── Helper: read/write JSON DB ──────────────────────────────────────────────
const dbPath  = (file) => path.join(__dirname, 'data', file);
const readDB  = (file) => { try { return JSON.parse(fs.readFileSync(dbPath(file), 'utf8')); } catch { return []; } };
const writeDB = (file, data) => fs.writeFileSync(dbPath(file), JSON.stringify(data, null, 2), 'utf8');

// ── Public API ───────────────────────────────────────────────────────────────
app.get('/api/devices', (req, res) => res.json(readDB('devices.json')));
app.get('/api/firmware', (req, res) => res.json(readDB('firmware.json')));

// ── Qualcomm EDL (demo stub + stdout streaming) ─────────────────────────────
// This endpoint streams line-delimited output from `server/edl.py`.
// Format: LEVEL|message
app.post('/api/qualcomm/edl/run', (req, res) => {
    const { action, loader, deviceSerial } = req.body || {};

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const pyBin = process.env.PYTHON_BIN || 'python';
    const pyScript = path.join(__dirname, 'edl.py');

    const args = [
        pyScript,
        '--action', action || 'hello',
        '--loader', loader || '',
        '--device-serial', deviceSerial || '',
    ];

    const child = spawn(pyBin, args, { env: process.env });

    const cleanup = () => {
        try { child.kill('SIGTERM'); } catch { /* ignore */ }
    };
    res.on('close', cleanup);

    child.stdout.on('data', (chunk) => {
        res.write(chunk);
    });

    child.stderr.on('data', (chunk) => {
        res.write(`ERROR|${chunk.toString('utf8')}`);
    });

    child.on('error', (err) => {
        res.write(`ERROR|Failed to start EDL tool: ${err.message || String(err)}\n`);
        res.end();
    });

    child.on('close', () => {
        res.end();
    });
});

// AI endpoints
app.post('/api/ai/validate', (req, res) => {
    const { deviceInfo, firmwareInfo } = req.body;
    res.json(validatePreFlash(deviceInfo, firmwareInfo));
});

app.post('/api/ai/cases', (req, res) => {
    const { deviceModel, errorType } = req.body;
    res.json({ suggestions: suggestRepairMethod(deviceModel, errorType) });
});

app.post('/api/ai/log', (req, res) => {
    const { deviceModel, errorType, repairMethod, success } = req.body;
    try {
        logRepairCase(deviceModel, errorType, repairMethod, success);
        res.json({ status: 'Learned successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── Auth ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    const users = readDB('users.json');
    const user  = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } else {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
});

app.post('/api/auth/signup', (req, res) => {
    const { name, email, password } = req.body;
    const users = readDB('users.json');
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ success: false, error: 'Email already exists' });
    }
    const newUser = { id: Date.now(), name, email, password, role: 'user' };
    users.push(newUser);
    writeDB('users.json', users);
    res.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// ── Admin CRUD ────────────────────────────────────────────────────────────────

// Devices
app.get('/api/admin/devices', (req, res) => res.json(readDB('devices.json')));

app.post('/api/admin/devices', (req, res) => {
    const devices = readDB('devices.json');
    const device = req.body;
    if (!device.device_name || !device.brand) {
        return res.status(400).json({ error: 'device_name and brand are required' });
    }
    if (devices.find(d => d.device_name === device.device_name)) {
        return res.status(409).json({ error: 'Device already exists' });
    }
    devices.push(device);
    writeDB('devices.json', devices);
    res.json({ success: true, device });
});

app.delete('/api/admin/devices', (req, res) => {
    const { device_name } = req.body;
    let devices = readDB('devices.json');
    const before = devices.length;
    devices = devices.filter(d => d.device_name !== device_name);
    if (devices.length === before) return res.status(404).json({ error: 'Device not found' });
    writeDB('devices.json', devices);
    res.json({ success: true });
});

// Users
app.get('/api/admin/users', (req, res) => {
    // Don't expose passwords
    const users = readDB('users.json').map(({ password, ...u }) => u);
    res.json(users);
});

app.delete('/api/admin/users/:id', (req, res) => {
    let users = readDB('users.json');
    const id = parseInt(req.params.id, 10);
    const before = users.length;
    users = users.filter(u => u.id !== id);
    if (users.length === before) return res.status(404).json({ error: 'User not found' });
    writeDB('users.json', users);
    res.json({ success: true });
});

// Licenses
app.get('/api/admin/licenses', (req, res) => res.json(readDB('licenses.json')));

app.post('/api/admin/licenses', (req, res) => {
    const licenses = readDB('licenses.json');
    const license = { hwid: null, hwid_resets_available: 3, status: 'active', ...req.body };
    licenses.push(license);
    writeDB('licenses.json', licenses);
    res.json({ success: true, license });
});

app.patch('/api/admin/licenses', (req, res) => {
    const { user_id, status } = req.body;
    const licenses = readDB('licenses.json');
    const lic = licenses.find(l => l.user_id === user_id);
    if (!lic) return res.status(404).json({ error: 'License not found' });
    lic.status = status;
    writeDB('licenses.json', licenses);
    res.json({ success: true, license: lic });
});

// AI Cases
app.get('/api/admin/ai-cases', (req, res) => {
    const cases = readDB('ai_cases.json');
    res.json(cases);
});

app.delete('/api/admin/ai-cases', (req, res) => {
    const { device_model, error_type } = req.body;
    let cases = readDB('ai_cases.json');
    const before = cases.length;
    cases = cases.filter(c => !(c.device_model === device_model && c.error_type === error_type));
    if (cases.length === before) return res.status(404).json({ error: 'Case not found' });
    writeDB('ai_cases.json', cases);
    res.json({ success: true });
});

// ── Security & Anti-Piracy ────────────────────────────────────────────────────
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'FIXPRO_SUPER_SECRET_KEY';

const verifyDesktopSignature = (req, res, next) => {
    const signature = req.headers['x-app-signature'];
    const timestamp = req.headers['x-timestamp'];
    if (!signature || !timestamp) return res.status(403).json({ error: 'Missing security headers' });

    const timeDiff = Math.abs(Date.now() - parseInt(timestamp));
    if (timeDiff > 300000) return res.status(403).json({ error: 'Request expired' });

    const sharedSecret = 'FIXPRO_DESKTOP_SECRET_2026';
    const expectedSig = crypto.createHmac('sha256', sharedSecret)
                               .update(timestamp + req.originalUrl)
                               .digest('hex');

    if (signature !== expectedSig) return res.status(403).json({ error: 'Invalid app signature. MITM detected.' });
    next();
};

app.post('/api/desktop/validate-license', verifyDesktopSignature, (req, res) => {
    const { email, password, hwid } = req.body;
    const users = readDB('users.json');
    const user  = users.find(u => u.email === email && u.password === password);
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });

    const licenses = readDB('licenses.json');
    const userLicense = licenses.find(l => l.user_id === user.id);

    if (!userLicense || userLicense.status !== 'active') {
        return res.status(403).json({ success: false, error: 'No active license found.' });
    }

    if (!userLicense.hwid) {
        userLicense.hwid = hwid;
        writeDB('licenses.json', licenses);
    } else if (userLicense.hwid !== hwid) {
        return res.status(403).json({ success: false, error: 'HWID Mismatch! You cannot use this license on another PC.' });
    }

    const token = jwt.sign({ userId: user.id, hwid, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
        success: true,
        token,
        plan: userLicense.plan_type,
        message: 'HWID authenticated and license active.'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ FixPro Hub API running on http://localhost:${PORT}`);
    console.log(`   → Devices DB : ${readDB('devices.json').length} entries`);
    console.log(`   → Users DB   : ${readDB('users.json').length} entries`);
    console.log(`   → AI Cases   : ${readDB('ai_cases.json').length} entries`);
});
