import express from 'express';
import { authRequired } from '../middleware/auth.js';
import { ParkingSlot, ParkingBooking } from '../db/mysql.js';
import { MeetingRoom, MeetingBooking } from '../db/postgres.js';

const router = express.Router();

router.get('/summary', authRequired, async (req, res) => {
  const totalSlots = await ParkingSlot.count({ where: { is_active: true } });
  const now = new Date();
  const activeParking = await ParkingBooking.count({ where: { status: 'booked', start_time: { [Symbol.for('gte')]: now } } });
  const meetingRooms = await MeetingRoom.count();
  const todayMeetings = await MeetingBooking.count({
    where: {
      start_time: { [Symbol.for('gte')]: new Date(new Date().setHours(0,0,0,0)) },
      end_time: { [Symbol.for('lte')]: new Date(new Date().setHours(23,59,59,999)) }
    }
  });
  res.json({
    total_active_parking_slots: totalSlots,
    parking_remaining_now: Math.max(totalSlots - activeParking, 0),
    total_meeting_rooms: meetingRooms,
    today_meetings: todayMeetings
  });
});

export default router;
