const db = require("../utils/db");

const TBL_USERS = "users";

module.exports = {
  all: function () {
    return db.load(`select * from ${TBL_USERS}`);
  },

  add: function (entity) {
    return db.add(TBL_USERS, entity);
  },

  singleByUserName: async function (username) {
    const rows = await db.load(
      `select * from ${TBL_USERS} where username = '${username}'`
    );
    if (rows.length === 0) return null;

    return rows[0];
  },

  singleByEmail: async function (email) {
    const rows = await db.load(
      `select * from ${TBL_USERS} where Email = '${email}'`
    );
    if (rows.length === 0) return null;

    return rows[0];
  },

  singleByPhone: async function (phone) {
    const rows = await db.load(
      `select * from ${TBL_USERS} where Phone = '${phone}'`
    );
    if (rows.length === 0) return null;

    return rows[0];
  },

  singleByUserID: async function (id) {
    const rows = await db.load(
      `select * from ${TBL_USERS} where UserID = '${id}'`
    );
    if (rows.length === 0) return null;

    return rows[0];
  },

  single: async function (username) {
    return db.load(`select * from ${TBL_USERS} where username = ${username}`);
  },

  patch: async function (entity) {
    try {
      const condition = {
        UserID: entity.UserID,
      };

      // Xóa `UserID` khỏi đối tượng để tránh sửa đổi khóa chính
      delete entity.UserID;

      // Thực hiện cập nhật
      return await db.patch(TBL_USERS, entity, condition);
    } catch (error) {
      throw new Error(
        `Lỗi khi chỉnh sửa thông tin người dùng: ${error.message}`
      );
    }
  },

  del: function (id) {
    const condition = {
      UserID: id,
    };
    const d = {
      Del: 1,
    };
    return db.patch(TBL_USERS, d, condition);
  },

  restore: function (id) {
    const condition = {
      UserID: id,
    };
    const d = {
      Del: 0,
    };
    return db.patch(TBL_USERS, d, condition);
  },

  del2: async function (id) {
    try {
      // Xóa tất cả các mục liên quan từ các bảng phụ thuộc trước khi xóa người dùng
      await db.load(`DELETE FROM comment WHERE UID = ${id}`); // Xóa bình luận
      await db.load(`DELETE FROM posts WHERE UID = ${id}`); // Xóa bài viết
      await db.load(`DELETE FROM categorymanager WHERE UserID = ${id}`); // Xóa phân quyền chuyên mục

      // Xóa vĩnh viễn người dùng khỏi bảng users
      return await db.load(`DELETE FROM ${TBL_USERS} WHERE UserID = ${id}`);
    } catch (error) {
      throw new Error(`Lỗi khi xóa vĩnh viễn người dùng: ${error.message}`);
    }
  },
};
