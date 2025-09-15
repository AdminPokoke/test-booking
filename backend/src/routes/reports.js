import express from 'express';
import { Op } from 'sequelize';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { ParkingBooking, ParkingSlot, User } from '../db/mysql.js';
import { MeetingBooking, MeetingRoom } from '../db/postgres.js';
import { stringify } from 'csv-stringify';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = express.Router();

function parseMonth(monthStr){
  // monthStr: "YYYY-MM"
  const [y, m] = monthStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m-1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0));
  return { start, end };
}

router.get('/monthly', authRequired, adminOnly, async (req, res) => {
  try {
    const { month = '', type = 'all', format = 'csv' } = req.query;
    if (!/^[0-9]{4}-[0-9]{2}$/.test(month)) return res.status(400).json({ error: 'month must be YYYY-MM' });
    const { start, end } = parseMonth(month);

    // Fetch data
    const parking = (type === 'parking' || type === 'all') ? await ParkingBooking.findAll({
      where: { start_time: { [Op.gte]: start }, end_time: { [Op.lt]: end } }, include: [ParkingSlot, User], order: [['start_time','ASC']]
    }) : [];
    const meeting = (type === 'meeting' || type === 'all') ? await MeetingBooking.findAll({
      where: { start_time: { [Op.gte]: start }, end_time: { [Op.lt]: end } }, include: [MeetingRoom], order: [['start_time','ASC']]
    }) : [];

    // CSV
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report-${type}-${month}.csv"`);
      const stringifier = stringify({ header: true });
      stringifier.pipe(res);
      if (parking.length) {
        stringifier.write({ section: 'PARKING' });
        stringifier.write({ id:'ID', user:'User', slot:'Slot', start:'Start', end:'End', status:'Status' });
        for (const b of parking) {
          stringifier.write({ id: b.id, user: b.User?.email, slot: b.ParkingSlot?.code, start: b.start_time, end: b.end_time, status: b.status });
        }
      }
      if (meeting.length) {
        stringifier.write({ section: 'MEETING' });
        stringifier.write({ id:'ID', room:'Room', title:'Title', start:'Start', end:'End', google_id:'GoogleEventID' });
        for (const m of meeting) {
          stringifier.write({ id: m.id, room: m.MeetingRoom?.name, title: m.title, start: m.start_time, end: m.end_time, google_id: m.google_event_id });
        }
      }
      stringifier.end();
      return;
    }

    // XLSX
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      if (parking.length) {
        const ws = wb.addWorksheet('Parking');
        ws.addRow(['ID','User','Slot','Start','End','Status']);
        parking.forEach(b => ws.addRow([b.id, b.User?.email, b.ParkingSlot?.code, b.start_time, b.end_time, b.status]));
      }
      if (meeting.length) {
        const ws = wb.addWorksheet('Meeting');
        ws.addRow(['ID','Room','Title','Start','End','GoogleEventID']);
        meeting.forEach(m => ws.addRow([m.id, m.MeetingRoom?.name, m.title, m.start_time, m.end_time, m.google_event_id]));
      }
      res.setHeader('Content-Type','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="report-${type}-${month}.xlsx"`);
      await wb.xlsx.write(res);
      res.end(); return;
    }

    // PDF
    if (format === 'pdf') {
      res.setHeader('Content-Type','application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report-${type}-${month}.pdf"`);
      const doc = new PDFDocument({ margin: 36 });
      doc.pipe(res);
      doc.fontSize(16).text(`Monthly Report (${type}) - ${month}`);
      doc.moveDown();
      if (parking.length) {
        doc.fontSize(14).text('Parking');
        doc.fontSize(10);
        parking.forEach(b => {
          doc.text(`${b.id} | ${b.User?.email} | ${b.ParkingSlot?.code} | ${new Date(b.start_time).toISOString()} - ${new Date(b.end_time).toISOString()} | ${b.status}`);
        });
        doc.moveDown();
      }
      if (meeting.length) {
        doc.fontSize(14).text('Meeting');
        doc.fontSize(10);
        meeting.forEach(m => {
          doc.text(`${m.id} | ${m.MeetingRoom?.name} | ${m.title} | ${new Date(m.start_time).toISOString()} - ${new Date(m.end_time).toISOString()} | ${m.google_event_id || ''}`);
        });
        doc.moveDown();
      }
      doc.end(); return;
    }

    res.status(400).json({ error: 'Unsupported format' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
