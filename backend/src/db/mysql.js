import { Sequelize, DataTypes } from 'sequelize';
import { config } from '../config.js';

export const mysqlSequelize = new Sequelize(
  config.mysql.database,
  config.mysql.username,
  config.mysql.password,
  {
    host: config.mysql.host,
    port: config.mysql.port,
    dialect: 'mysql',
    logging: false,
  }
);

// Models (MySQL)
export const User = mysqlSequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' },
}, { tableName: 'users', timestamps: true });

export const ParkingSlot = mysqlSequelize.define('ParkingSlot', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING, allowNull: false, unique: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, { tableName: 'parking_slots', timestamps: true });

export const ParkingBooking = mysqlSequelize.define('ParkingBooking', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  start_time: { type: DataTypes.DATE, allowNull: false },
  end_time: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('booked', 'cancelled'), allowNull: false, defaultValue: 'booked' },
}, { tableName: 'parking_bookings', timestamps: true });

User.hasMany(ParkingBooking, { foreignKey: 'user_id' });
ParkingBooking.belongsTo(User, { foreignKey: 'user_id' });
ParkingSlot.hasMany(ParkingBooking, { foreignKey: 'slot_id' });
ParkingBooking.belongsTo(ParkingSlot, { foreignKey: 'slot_id' });
