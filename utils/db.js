const mysql = require("mysql2");
require("dotenv").config(); // Đảm bảo biến môi trường được load trước

// Cấu hình kết nối từ biến môi trường
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Hàm query với Promise
const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.query(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

module.exports = {
  load: function (sql) {
    return new Promise(function (resolve, reject) {
      pool.query(sql, function (error, results, fields) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  query: query,
  add: function (table, entity) {
    return new Promise(function (resolve, reject) {
      const sql = `insert into ${table} set ?`;
      pool.query(sql, entity, function (error, results) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  patch: function (table, entity, condition) {
    return new Promise(function (resolve, reject) {
      const sql = `update ${table} set ? where ?`;
      pool.query(sql, [entity, condition], function (error, results) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  del: function (table, condition) {
    return new Promise(function (resolve, reject) {
      const sql = `delete from ${table} where ?`;
      pool.query(sql, condition, function (error, results) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
  execute: function (sql, params) {
    return new Promise(function (resolve, reject) {
      pool.execute(sql, params, function (error, results) {
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    });
  },
};

// Kiểm tra kết nối
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database connection failed:", err.message);
  } else {
    console.log("Connected to MySQL on AWS RDS!");
    connection.release(); // Trả lại kết nối vào pool
  }
});
