const db = require('../utils/db');

const TBL_CATEGORIES = 'categories';
const TBL_SUBCATEGORIES = 'subcategories';
const TBL_CATEGORYMANAGER = 'categorymanager';
module.exports = {
  allforuser: function () {
    return db.load(`select * from ${TBL_CATEGORIES} where Xoa = 0`);
  },
  all: function () {
    return db.load(`select * from ${TBL_CATEGORIES}`);
  },
  single: function (id) {
    return db.load(`select * from ${TBL_CATEGORIES} where CID = ${id}`);
  },
  add: function (entity) {
    return db.add(TBL_CATEGORIES, entity);
  },
  delL: function (id) {
    const condition = {
      CID: id
    };
    const d = {
      Xoa: 1
    };
    return db.patch(TBL_CATEGORIES, d ,condition);
  },
  restoreL: function (id) {
    const condition = {
      CID: id
    };
    const d = {
      Xoa: 0
    };
    return db.patch(TBL_CATEGORIES, d ,condition);
  },
  patch: function (entity) {
    const condition = {
      CID: entity.CID
    }
    delete entity.CID;
    return db.patch(TBL_CATEGORIES, entity, condition);
  },
  singleByCID: async function (id) {
    return  db.load(`select * from ${TBL_CATEGORIES} where CID = '${id}'`);

  },
  all2: function (userID) {
    return db.load(`SELECT * 
      FROM ${TBL_CATEGORIES} 
      WHERE Xoa = 0 
        AND cid NOT IN (
          SELECT cid 
          FROM ${TBL_CATEGORYMANAGER} 
          WHERE userid = ${userID}
        )
    `);
  },
  del: function (id) {
    const condition = {
      CID: id
    }
    return db.del(TBL_CATEGORIES, condition);
  }
};