const mysql = require("mysql2");
require("dotenv").config();

// Tạo kết nối pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();

module.exports = {
  load: async (sql) => {
    try {
      const [results] = await promisePool.query(sql);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Hàm thêm dữ liệu
  add: async (table, entity) => {
    try {
      const sql = `INSERT INTO ${table} SET ?`;
      const [results] = await promisePool.query(sql, entity);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Hàm cập nhật dữ liệu
  patch: async (table, entity, condition) => {
    try {
      const sql = `UPDATE ${table} SET ? WHERE ?`;
      const [results] = await promisePool.query(sql, [entity, condition]);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Hàm xóa logic
  del: async (table, condition) => {
    try {
      const sql = `UPDATE ${table} SET xoa = 1 WHERE ?`;
      const [results] = await promisePool.query(sql, condition);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Hàm xóa vĩnh viễn
  del2: async (table, condition) => {
    try {
      const sql = `DELETE FROM ${table} WHERE ?`;
      const [results] = await promisePool.query(sql, condition);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Hàm khôi phục dữ liệu
  restore: async (table, condition) => {
    try {
      const sql = `UPDATE ${table} SET xoa = 0 WHERE ?`;
      const [results] = await promisePool.query(sql, condition);
      return results;
    } catch (error) {
      throw error;
    }
  },

  // Hàm execute SQL với tham số
  execute: async (sql, params) => {
    try {
      const [results] = await promisePool.query(sql, params);
      return results;
    } catch (error) {
      throw error;
    }
  },
};

// Kiểm tra kết nối
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to MySQL!");
    connection.release(); // Trả lại kết nối vào pool
  }
});
