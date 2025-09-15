import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { mysqlSequelize, User, ParkingSlot, ParkingBooking } from './db/mysql.js';
import { pgSequelize, MeetingRoom, MeetingBooking, AuditLog, AdminSetting } from './db/postgres.js';
import authRoutes from './routes/auth.js';
import parkingRoutes from './routes/parking.js';
import meetingRoutes from './routes/meeting.js';
import adminRoutes from './routes/admin.js';
import logsRoutes from './routes/logs.js';
import dashboardRoutes from './routes/dashboard.js';
import { authRequired, currentUser } from './middleware/auth.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// API routes
app.use('/api/auth', authRoutes);
app.get('/api/me', authRequired, currentUser);
app.use('/api/parking', parkingRoutes);
app.use('/api/meeting', meetingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Fallback to index.html for simple SPA-like navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// DB init & seed
async function init() {
  await mysqlSequelize.authenticate();
  await pgSequelize.authenticate();

  await mysqlSequelize.sync();
  await pgSequelize.sync();

  // Seed admin
  const adminEmail = config.defaults.adminEmail;
  const adminPassword = config.defaults.adminPassword;
  const exists = await User.findOne({ where: { email: adminEmail } });
  if (!exists) {
    const password_hash = await bcrypt.hash(adminPassword, 10);
    await User.create({ name: 'Admin', email: adminEmail, password_hash, role: 'admin' });
    console.log('Seeded default admin');
  }

  // Seed some parking slots
  const slotCount = await ParkingSlot.count();
  if (slotCount === 0) {
    for (let i = 1; i <= 10; i++) {
      await ParkingSlot.create({ code: `P-${i.toString().padStart(2,'0')}` });
    }
    console.log('Seeded parking slots');
  }

  // Seed meeting rooms
  const roomCount = await MeetingRoom.count();
  if (roomCount === 0) {
    await MeetingRoom.bulkCreate([
      { name: 'R-Alpha', capacity: 6 },
      { name: 'R-Beta', capacity: 8 },
      { name: 'R-Gamma', capacity: 12 }
    ]);
    console.log('Seeded meeting rooms');
  }

  // Ensure settings row
  const setting = await AdminSetting.findOne();
  if (!setting) await AdminSetting.create({ slack_webhook_url: null, google_client_id: null });

  app.listen(config.port, () => {
    console.log(`Server running on ${config.port}`);
  });
}

init().catch(err => {
  console.error('Init error:', err);
  process.exit(1);
});
