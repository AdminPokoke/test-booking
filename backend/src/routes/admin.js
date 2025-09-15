import express from 'express';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { ParkingSlot } from '../db/mysql.js';
import { MeetingRoom, AdminSetting } from '../db/postgres.js';

const router = express.Router();

// Parking slots
router.get('/parking-slots', authRequired, adminOnly, async (req, res) => {
  const slots = await ParkingSlot.findAll({ order: [['id','ASC']] });
  res.json(slots);
});
router.post('/parking-slots', authRequired, adminOnly, async (req, res) => {
  const { code, is_active } = req.body;
  if (!code) return res.status(400).json({ error: 'Missing code' });
  const slot = await ParkingSlot.create({ code, is_active: is_active ?? true });
  res.json(slot);
});

// Meeting rooms
router.get('/rooms', authRequired, adminOnly, async (req, res) => {
  const rooms = await MeetingRoom.findAll({ order: [['id','ASC']] });
  res.json(rooms);
});
router.post('/rooms', authRequired, adminOnly, async (req, res) => {
  const { name, capacity } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const room = await MeetingRoom.create({ name, capacity: capacity ?? 4 });
  res.json(room);
});

// Settings (Slack webhook, Google client ID)
router.get('/settings', authRequired, adminOnly, async (req, res) => {
  const setting = await AdminSetting.findOne({ order: [['id','ASC']] }) || {};
  res.json(setting);
});
router.post('/settings', authRequired, adminOnly, async (req, res) => {
  const { slack_webhook_url, google_client_id } = req.body;
  let setting = await AdminSetting.findOne({ order: [['id','ASC']] });
  if (!setting) {
    setting = await AdminSetting.create({ slack_webhook_url, google_client_id });
  } else {
    setting.slack_webhook_url = slack_webhook_url ?? setting.slack_webhook_url;
    setting.google_client_id = google_client_id ?? setting.google_client_id;
    await setting.save();
  }
  res.json(setting);
});

export default router;
