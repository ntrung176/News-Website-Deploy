const db = require("../utils/db");

const TBL_POSTS = "posts";

module.exports = {
  all: function () {
    return db.load(`SELECT * FROM ${TBL_POSTS}`);
  },
  allByStatus: function (status) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE Duyet = ${status}`);
  },
  allPostSapPublic: function () {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE Duyet = 2`);
  },
  add: function (entity) {
    return db.add(TBL_POSTS, entity);
  },
  singleByCID: function (cid) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE CID = ${cid}`);
  },
  getByCategoryID: function (cid) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE CID = ${cid} AND Xoa = 0`);
  },
  singleByCIDXuatBan: function (cid) {
    return db.load(
      `SELECT * FROM ${TBL_POSTS} WHERE CID = ${cid} AND Duyet = 3 ORDER BY TimePost DESC`
    );
  },
  singleBySCIDXuatBan: function (id) {
    return db.load(
      `SELECT * FROM ${TBL_POSTS} WHERE SCID = ${id} AND Duyet = 3 ORDER BY TimePost DESC`
    );
  },
  singleByCIDStatus: function (cid, status) {
    return db.load(
      `SELECT * FROM ${TBL_POSTS} WHERE CID = ${cid} AND Duyet = ${status}`
    );
  },
  singleByPostID: function (id) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE PostID = ${id}`);
  },
  singleByUserIDStatus: function (id, status) {
    return db.load(
      `SELECT * FROM ${TBL_POSTS} WHERE UID = ${id} AND Duyet = ${status}`
    );
  },
  singleBySCID: function (id) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE SCID = ${id}`);
  },
  singleByUserID: function (id) {
    return db.load(`SELECT * FROM ${TBL_POSTS} WHERE UID = ${id}`);
  },
  patch: function (entity) {
    const condition = {
      PostID: entity.PostID,
    };
    delete entity.PostID;
    return db.patch(TBL_POSTS, entity, condition);
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
  updateCategory: function (postID, categoryID) {
    const sql = `
      UPDATE ${TBL_POSTS}
      SET CID = ?
      WHERE PostID = ?
    `;
    return db.execute(sql, [categoryID, postID]);
  },
  del2: function (id) {
    const condition = {
      PostID: id,
    };
    return db.del(TBL_POSTS, condition);
  },
  update: async (post) => {
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
        TimePost = ?
      WHERE PostID = ?
    `;
    return db.execute(sql, [
      post.PostTitle, // Title
      post.SumContent, // Summary
      post.Content, // Content
      post.source, // Source
      post.linksource, // Source link
      post.Premium, // Premium (0 or 1)
      post.TimePost, // Post date
      post.TimPublic, // Time of post
      post.PostID, // Post ID
    ]);
  },
};
