const db = require("../utils/db");

const TBL_CategoryManager = "categorymanager";
const TBL_CATEGORIES = "categories";

module.exports = {
  showCategoryManagerByUID: function (id) {
    return db.load(`select * from ${TBL_CategoryManager} where UserID = ${id}`);
  },
  showCIDCategoryManagerByUID: function (id) {
    return db.load(
      `select CID from ${TBL_CategoryManager} where UserID = ${id}`
    );
  },
  setCategoryManager: function (entity) {
    return db.add(TBL_CategoryManager, entity);
  },
  allAssigned: function (userID) {
    return db.load(`
            SELECT c.* 
            FROM ${TBL_CATEGORIES} c
            JOIN ${TBL_CategoryManager} cm ON c.cid = cm.cid
            WHERE cm.userid = ${userID} AND c.Xoa = 0
        `);
  },
  delCategoryManagerByUserID: function (id) {
    const condition = {
      UserID: id,
    };
    return db.del(TBL_CategoryManager, condition);
  },
  delCategoryManagerByCID: function (id) {
    const condition = {
      CID: id,
    };
    return db.del(TBL_CategoryManager, condition);
  },
};
