const mysql = require("mysql2");
require("dotenv").config();

// Kiểm tra các biến môi trường
const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT, // Nếu bạn sử dụng cổng khác ngoài 3306
} = process.env;

// Xác minh rằng tất cả các biến môi trường cần thiết đã được định nghĩa
if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.error("Thiếu các biến môi trường cần thiết trong tệp .env");
  process.exit(1); // Thoát ứng dụng nếu thiếu biến môi trường
}

// Tạo kết nối pool với cấu hình đầy đủ
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT || 3306, // Sử dụng cổng mặc định 3306 nếu không được định nghĩa
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  connectTimeout: 10000, // 10 giây
});

// Sử dụng promise pool để hỗ trợ async/await
const promisePool = pool.promise();

module.exports = {
  // Hàm tải dữ liệu
  load: async (sql) => {
    try {
      const [results] = await promisePool.query(sql);
      return results;
    } catch (error) {
      console.error("Error in load function:", error.message);
      throw error;
    }
  },

  // Hàm thêm dữ liệu
  add: async (table, entity) => {
    try {
      const sql = `INSERT INTO \`${table}\` SET ?`;
      const [results] = await promisePool.query(sql, entity);
      return results;
    } catch (error) {
      console.error(`Error in add function for table ${table}:`, error.message);
      throw error;
    }
  },

  // Hàm cập nhật dữ liệu
  patch: async (table, entity, condition) => {
    try {
      const sql = `UPDATE \`${table}\` SET ? WHERE ?`;
      const [results] = await promisePool.query(sql, [entity, condition]);
      return results;
    } catch (error) {
      console.error(
        `Error in patch function for table ${table}:`,
        error.message
      );
      throw error;
    }
  },

  // Hàm xóa logic
  del: async (table, condition) => {
    try {
      const sql = `UPDATE \`${table}\` SET xoa = 1 WHERE ?`;
      const [results] = await promisePool.query(sql, condition);
      return results;
    } catch (error) {
      console.error(`Error in del function for table ${table}:`, error.message);
      throw error;
    }
  },

  // Hàm xóa vĩnh viễn
  del2: async (table, condition) => {
    try {
      const sql = `DELETE FROM \`${table}\` WHERE ?`;
      const [results] = await promisePool.query(sql, condition);
      return results;
    } catch (error) {
      console.error(
        `Error in del2 function for table ${table}:`,
        error.message
      );
      throw error;
    }
  },

  // Hàm khôi phục dữ liệu
  restore: async (table, condition) => {
    try {
      const sql = `UPDATE \`${table}\` SET xoa = 0 WHERE ?`;
      const [results] = await promisePool.query(sql, condition);
      return results;
    } catch (error) {
      console.error(
        `Error in restore function for table ${table}:`,
        error.message
      );
      throw error;
    }
  },

  // Hàm execute SQL với tham số
  execute: async (sql, params) => {
    try {
      const [results] = await promisePool.query(sql, params);
      return results;
    } catch (error) {
      console.error("Error in execute function:", error.message);
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
