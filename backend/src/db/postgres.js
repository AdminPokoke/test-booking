import { Sequelize, DataTypes } from 'sequelize';
import { config } from '../config.js';

export const pgSequelize = new Sequelize(
  config.pg.database,
  config.pg.username,
  config.pg.password,
  {
    host: config.pg.host,
    port: config.pg.port,
    dialect: 'postgres',
    logging: false,
  }
);

// Models (Postgres)
export const MeetingRoom = pgSequelize.define('MeetingRoom', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 4 },
}, { tableName: 'meeting_rooms', timestamps: true });

export const MeetingBooking = pgSequelize.define('MeetingBooking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  google_event_id: { type: DataTypes.STRING, allowNull: true },
  google_email: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'meeting_bookings', timestamps: true });

export const AuditLog = pgSequelize.define('AuditLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: true },
  action: { type: DataTypes.STRING, allowNull: false },
  detail: { type: DataTypes.TEXT, allowNull: true },
}, { tableName: 'audit_logs', timestamps: true });

export const AdminSetting = pgSequelize.define('AdminSetting', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  slack_webhook_url: { type: DataTypes.STRING, allowNull: true },
  google_client_id: { type: DataTypes.STRING, allowNull: true },
}, { tableName: 'admin_settings', timestamps: true });
