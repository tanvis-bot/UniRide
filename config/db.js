import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  ssl:
    process.env.DB_SSL === "true"
      ? {
          minVersion: "TLSv1.2",
          rejectUnauthorized: true,
        }
      : undefined,
});

export async function testDatabaseConnection() {
  const connection = await pool.getConnection();

  try {
    await connection.query("SELECT 1");
    console.log("MySQL database connected successfully");
  } finally {
    connection.release();
  }
}

export default pool;