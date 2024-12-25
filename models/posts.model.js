const db = require("../utils/db");

const TBL_POSTS = "posts";

module.exports = {
  all: function () {
    return db.load(`select * from ${TBL_POSTS}`);
  },
  allByStatus: function (status) {
    return db.load(`select * from ${TBL_POSTS} where Duyet = ${status}`);
  },
  allPostSapPublic: function () {
    return db.load(`select * from ${TBL_POSTS} where Duyet = 2`);
  },
  add: function (entity) {
    return db.add(TBL_POSTS, entity);
  },
  singleByCID: function (cid) {
    return db.load(`select * from ${TBL_POSTS} where CID = ${cid}`);
  },
  getByCategoryID: function (cid) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE CID = ${cid} AND Xoa = 0`);
  },
  singleByCIDXuatBan: function (cid) {
    return db.load(
      `select * from ${TBL_POSTS} where CID = ${cid} AND Duyet = 3 ORDER BY TimePost DESC`
    );
  },
  singleBySCIDXuatBan: function (id) {
    return db.load(
      `select * from ${TBL_POSTS} where SCID = ${id} AND Duyet = 3 ORDER BY TimePost DESC`
    );
  },
  singleByCIDStatus: function (cid, status) {
    return db.load(
      `select * from ${TBL_POSTS} where CID = ${cid} and Duyet = ${status}`
    );
  },
  singleByPostID: function (id) {
    return db.load(`select * from ${TBL_POSTS} where PostID = ${id}`);
  },
  singleByUserIDStatus: function (id, status) {
    return db.load(
      `select * from ${TBL_POSTS} where UID = ${id} and Duyet = ${status}`
    );
  },
  singleBySCID: function (id) {
    return db.load(`select * from ${TBL_POSTS} where SCID = ${id}`);
  },
  singleByUserID: function (id) {
    return db.load(`select * from ${TBL_POSTS} where UID = ${id}`);
  },
  patch: function (entity) {
    const condition = {
      PostID: entity.PostID,
    };
    delete entity.PostID;
    return db.patch(TBL_POSTS, entity, condition);
  },
  move: function (id, cid, scid) {
    const condition = {
      PostID: id,
    };
    const d = {
      CID: cid,
      SCID: scid,
    };
    return db.patch(TBL_POSTS, d, condition);
  },
  updateCategory: function (postID, categoryID) {
    const sql = `
        UPDATE ${TBL_POSTS}
        SET CID = ?
        WHERE PostID = ?
      `;

    return db.execute(sql, [categoryID, postID]);
  },
  update: async (post) => {
    const params = [
      post.PostTitle ?? null,
      post.SumContent ?? null,
      post.Content ?? null,
      post.source ?? null,
      post.linksource ?? null,
      post.Premium ?? null,
      post.TimePublic ?? null,
      post.TimePost ?? null,
      post.PostID ?? null,
    ];

    console.log("Update Parameters with nulls:", params);

    const sql = `
      UPDATE posts
      SET
        PostTitle = ?,
        SumContent = ?,
        Content = ?,
        source = ?,
        linksource = ?,
        Premium = ?,
        TimePublic = ?,
        TimePost=?
      WHERE PostID = ?
    `;

    return db.execute(sql, params);
  },
  del: function (id) {
    const condition = {
      PostID: id,
    };
    const d = {
      xoa: 1,
    };
    return db.patch(TBL_POSTS, d, condition);
  },
  restore: function (id) {
    const condition = {
      PostID: id,
    };
    const d = {
      xoa: 0,
    };
    return db.patch(TBL_POSTS, d, condition);
  },
  del2: function (id) {
    const condition = {
      PostID: id,
    };
    return db.del(TBL_POSTS, condition);
  },
};
