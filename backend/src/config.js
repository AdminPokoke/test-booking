import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 8080,
  jwtSecret: process.env.JWT_SECRET || 'devsecret_change_me',
  baseUrl: process.env.BASE_URL || 'http://localhost:8080',
  mysql: {
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    database: process.env.MYSQL_DB || 'booking_users_parking',
    username: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || 'rootpass',
  },
  pg: {
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DB || 'booking_meeting_logs',
    username: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'pgpass',
  },
  defaults: {
    adminEmail: process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com',
    adminPassword: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  }
};
