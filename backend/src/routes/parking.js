import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { ParkingSlot, ParkingBooking, User } from '../db/mysql.js';
import { AuditLog } from '../db/postgres.js';

const router = express.Router();

router.get('/bookings', authRequired, async (req, res) => {
  try {
    const { slot_id } = req.query;
    const where = { status: 'booked' };
    if (slot_id) where.slot_id = parseInt(slot_id, 10);
    const items = await ParkingBooking.findAll({ where, order: [['start_time','ASC']] });
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/slots', authRequired, async (req, res) => {
  const slots = await ParkingSlot.findAll({ order: [['id','ASC']] });
  res.json(slots);
});

router.get('/stats', authRequired, async (req, res) => {
  const total = await ParkingSlot.count({ where: { is_active: true } });
  const now = new Date();
  const activeBookings = await ParkingBooking.count({
    where: { status: 'booked', start_time: { [Op.gte]: now } }
  });
  res.json({ total_active_slots: total, active_bookings: activeBookings, remaining: Math.max(total - activeBookings, 0) });
});

router.post('/book', authRequired, async (req, res) => {
  try {
    const { slot_id, start_time, end_time } = req.body;
    if (!slot_id || !start_time || !end_time) return res.status(400).json({ error: 'Missing fields' });

    // simple overlap check
    const overlapping = await ParkingBooking.count({
      where: {
        slot_id,
        status: 'booked',
        start_time: { [Op.lt]: new Date(end_time) },
        end_time: { [Op.gt]: new Date(start_time) }
      }
    });
    if (overlapping > 0) return res.status(400).json({ error: 'Slot already booked in that time range' });

    const booking = await ParkingBooking.create({
      slot_id, user_id: req.user.id, start_time, end_time, status: 'booked'
    });

    await AuditLog.create({ user_id: req.user.id, action: 'parking_book', detail: JSON.stringify({ booking_id: booking.id, slot_id }) });
    res.json({ ok: true, booking });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
