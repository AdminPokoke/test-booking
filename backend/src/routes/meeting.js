import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { MeetingRoom, MeetingBooking, AdminSetting, AuditLog } from '../db/postgres.js';
import { postToSlack } from '../utils/slack.js';

const router = express.Router();

router.get('/rooms', authRequired, async (req, res) => {
  const rooms = await MeetingRoom.findAll({ order: [['id','ASC']] });
  res.json(rooms);
});

router.get('/bookings', authRequired, async (req, res) => {
  const bookings = await MeetingBooking.findAll({ order: [['start_time','ASC']] });
  res.json(bookings);
});

router.get('/google-client-id', async (req, res) => {
  const setting = await AdminSetting.findOne({ order: [['id','ASC']] });
  res.json({ google_client_id: setting?.google_client_id || null });
});

router.post('/book', authRequired, async (req, res) => {
  try {
    const { room_id, title, start_time, end_time, google_event_id, google_email } = req.body;
    if (!room_id || !title || !start_time || !end_time) return res.status(400).json({ error: 'Missing fields' });

    // overlap check
    const overlapping = await MeetingBooking.count({
      where: {
        room_id,
        start_time: { [Symbol.for('lt')]: new Date(end_time) },
        end_time: { [Symbol.for('gt')]: new Date(start_time) }
      }
    });
    if (overlapping > 0) return res.status(400).json({ error: 'Room already booked in that time range' });

    const booking = await MeetingBooking.create({
      room_id, title, start_time, end_time, google_event_id: google_event_id || null, google_email: google_email || null, user_id: req.user.id
    });

    await AuditLog.create({ user_id: req.user.id, action: 'meeting_book', detail: JSON.stringify({ booking_id: booking.id, room_id }) });

    const setting = await AdminSetting.findOne({ order: [['id','ASC']] });
    if (setting?.slack_webhook_url) {
      await postToSlack(setting.slack_webhook_url, `📅 New meeting booked: ${title} (${start_time} - ${end_time}) by user ${req.user.email}`);
    }

    res.json({ ok: true, booking });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
