const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// ── Optional AI modules (graceful fallback if missing) ──────────────────────
let validatePreFlash, logRepairCase, suggestRepairMethod;
try {
  ({ validatePreFlash } = require('./src/ai/assistant'));
  ({ logRepairCase, suggestRepairMethod } = require('./src/ai/learning'));
} catch {
  validatePreFlash = () => ({ valid: true, warnings: [] });
  logRepairCase = () => {};
  suggestRepairMethod = () => [];
}

// ── Socket.io (lazy-loaded — installed via npm) ─────────────────────────────
let Server;
try {
  Server = require('socket.io').Server;
} catch {
  console.warn('⚠️  socket.io not installed — real-time updates disabled. Run: npm i socket.io');
}

// ── Express + HTTP server ───────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// Attach Socket.io to the HTTP server (if available)
let io = null;
if (Server) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST', 'PATCH'] }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });

    // Technician can join their own room for targeted updates
    socket.on('join-technician', (techId) => {
      socket.join(`tech-${techId}`);
      console.log(`  → Socket ${socket.id} joined room tech-${techId}`);
    });
  });
}

app.use(cors());
app.use(express.json());

// ── Helper: read/write JSON DB ──────────────────────────────────────────────
const dbPath  = (file) => path.join(__dirname, 'data', file);
const readDB  = (file) => { try { return JSON.parse(fs.readFileSync(dbPath(file), 'utf8')); } catch { return []; } };
const writeDB = (file, data) => fs.writeFileSync(dbPath(file), JSON.stringify(data, null, 2), 'utf8');

// ── JWT Config ──────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'FIXPRO_SUPER_SECRET_KEY';
const JWT_EXPIRY = '8h';

/**
 * JWT Authentication Middleware
 * Extracts token from Authorization: Bearer <token> header
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Token expired or invalid' });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
//  AUTH ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/login
 * Technician login — returns JWT token
 * Body: { email, password }
 */
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required' });
  }

  const users = readDB('users.json');
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' });
  }

  // Sign JWT
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );

  res.json({
    success: true,
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
});

/**
 * POST /api/auth/login  (legacy alias)
 */
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const users = readDB('users.json');
  const user  = users.find(u => u.email === email && u.password === password);
  if (user) {
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRY }
    );
    res.json({ success: true, token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
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
  const token = jwt.sign(
    { userId: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
  res.json({ success: true, token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role } });
});

// ──────────────────────────────────────────────────────────────────────────────
//  REPAIR REQUESTS ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/requests
 * Returns all repair requests. Optionally filtered by ?status=pending|in_progress|done
 */
app.get('/api/requests', (req, res) => {
  let requests = readDB('repair_requests.json');
  const { status } = req.query;
  if (status) {
    requests = requests.filter(r => r.status === status);
  }
  // Sort newest first
  requests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(requests);
});

/**
 * GET /api/requests/:id
 * Returns a single repair request by ID
 */
app.get('/api/requests/:id', (req, res) => {
  const requests = readDB('repair_requests.json');
  const request = requests.find(r => r.id === parseInt(req.params.id, 10));
  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json(request);
});

/**
 * POST /api/requests
 * Create a new repair request
 * Body: { customerName, phoneNumber, deviceType, problemDescription }
 */
app.post('/api/requests', (req, res) => {
  const requests = readDB('repair_requests.json');
  const { customerName, phoneNumber, deviceType, problemDescription } = req.body;

  if (!customerName || !deviceType || !problemDescription) {
    return res.status(400).json({ error: 'customerName, deviceType, and problemDescription are required' });
  }

  const newRequest = {
    id: requests.length > 0 ? Math.max(...requests.map(r => r.id)) + 1 : 1,
    customerName,
    phoneNumber: phoneNumber || '',
    deviceType,
    problemDescription,
    status: 'pending',
    assignedTo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  requests.push(newRequest);
  writeDB('repair_requests.json', requests);

  // Broadcast new request to all connected clients via Socket.io
  if (io) {
    io.emit('new-request', newRequest);
  }

  res.status(201).json(newRequest);
});

/**
 * PATCH /api/requests/:id
 * Update a repair request (status, assignedTo, etc.)
 * Body: { status?, assignedTo?, problemDescription? }
 */
app.patch('/api/requests/:id', (req, res) => {
  const requests = readDB('repair_requests.json');
  const idx = requests.findIndex(r => r.id === parseInt(req.params.id, 10));
  if (idx === -1) return res.status(404).json({ error: 'Request not found' });

  const allowedFields = ['status', 'assignedTo', 'problemDescription', 'customerName', 'phoneNumber', 'deviceType'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      requests[idx][field] = req.body[field];
    }
  }
  requests[idx].updatedAt = new Date().toISOString();

  writeDB('repair_requests.json', requests);

  // Broadcast the update to all connected clients via Socket.io
  if (io) {
    io.emit('request-updated', requests[idx]);
  }

  res.json(requests[idx]);
});

/**
 * DELETE /api/requests/:id
 * Delete a repair request
 */
app.delete('/api/requests/:id', (req, res) => {
  let requests = readDB('repair_requests.json');
  const id = parseInt(req.params.id, 10);
  const before = requests.length;
  requests = requests.filter(r => r.id !== id);
  if (requests.length === before) return res.status(404).json({ error: 'Request not found' });
  writeDB('repair_requests.json', requests);

  if (io) {
    io.emit('request-deleted', { id });
  }

  res.json({ success: true });
});

// ──────────────────────────────────────────────────────────────────────────────
//  PUBLIC API (Devices / Firmware)
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/devices', (req, res) => res.json(readDB('devices.json')));
app.get('/api/firmware', (req, res) => res.json(readDB('firmware.json')));

// ──────────────────────────────────────────────────────────────────────────────
//  QUALCOMM EDL (demo stub + stdout streaming)
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
//  AI ENDPOINTS
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
//  ADMIN CRUD
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
//  SECURITY & ANTI-PIRACY (Desktop validation)
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
//  HEALTH CHECK
// ──────────────────────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    socketio: !!io,
    timestamp: new Date().toISOString()
  });
});

// ──────────────────────────────────────────────────────────────────────────────
//  START SERVER
// ──────────────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`✅ FixPro Hub API running on http://localhost:${PORT}`);
    console.log(`   → Devices DB     : ${readDB('devices.json').length} entries`);
    console.log(`   → Users DB       : ${readDB('users.json').length} entries`);
    console.log(`   → Repair Requests: ${readDB('repair_requests.json').length} entries`);
    console.log(`   → AI Cases       : ${readDB('ai_cases.json').length} entries`);
    console.log(`   → Socket.io      : ${io ? 'ENABLED ✓' : 'DISABLED (install socket.io)'}`);
});
