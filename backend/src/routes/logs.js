import express from 'express';
import { authRequired, adminOnly } from '../middleware/auth.js';
import { AuditLog } from '../db/postgres.js';
import { stringify } from 'csv-stringify';

const router = express.Router();

router.get('/', authRequired, adminOnly, async (req, res) => {
  const { type } = req.query;
  const where = {};
  if (type === 'login') where.action = 'login';
  if (type === 'booking') where.action = ['parking_book','meeting_book'];
  const logs = await AuditLog.findAll({ where, order: [['createdAt','DESC']] });
  res.json(logs);
});

router.get('/download.csv', authRequired, adminOnly, async (req, res) => {
  const logs = await AuditLog.findAll({ order: [['createdAt','DESC']] });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
  const stringifier = stringify({ header: true, columns: ['id','user_id','action','detail','createdAt','updatedAt'] });
  logs.forEach(l => stringifier.write(l.toJSON()));
  stringifier.pipe(res);
});

export default router;
