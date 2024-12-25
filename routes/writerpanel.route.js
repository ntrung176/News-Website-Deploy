const express = require("express");
const userModel = require("../models/user.model");
const categoryModel = require("../models/category.model");
const subcategoryModel = require("../models/subcategory.model");
const postModel = require("../models/posts.model");
const moment = require("moment");
const commentModel = require("../models/comment.model");
const { compareSync } = require("bcryptjs");
const { post } = require("./posts.route");
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); 

router.get("/", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 1) {
    try {
      const category = await categoryModel.allforuser();
      const post_by_UID = await postModel.singleByUserID(req.user.UserID);
      const post_ChuaDuyet = await postModel.singleByUserIDStatus(req.user.UserID, 0);
      const post_TuChoi = await postModel.singleByUserIDStatus(req.user.UserID, 1);
      const post_ChoXuatBan = await postModel.singleByUserIDStatus(req.user.UserID, 2);
      const post_XuatBan = await postModel.singleByUserIDStatus(req.user.UserID, 3);

      // Chuyển đổi thời gian và lấy thông tin thêm cho mỗi bài viết
      for (let i = 0; i < post_by_UID.length; i++) {
        // Chuyển thời gian
        post_by_UID[i].Time = moment(post_by_UID[i].TimePost, "YYYY-MM-DD HH:mm:ss").fromNow();

        // Lấy tên chuyên mục
        const cat_post = await categoryModel.single(post_by_UID[i].CID);
        if (cat_post && cat_post.length > 0) {
          post_by_UID[i].CName = cat_post[0].CName;
        }

        // Lấy tên chuyên mục con
        if (post_by_UID[i].SCID) {
          const subcat_post = await subcategoryModel.single2(post_by_UID[i].SCID);
          if (subcat_post && subcat_post.length > 0) {
            post_by_UID[i].SCName = " / " + subcat_post[0].SCName;
          }
        }

        // Lấy thông tin người dùng
        const uid_post = await userModel.singleByUserID(post_by_UID[i].UID);
      }

      res.render("writerpanel", {
        list: category,
        empty: category.length === 0,
        post: post_by_UID,
        post_ChuaDuyet,
        post_TuChoi,
        post_ChoXuatBan,
        post_XuatBan,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      res.status(500).send("An error occurred while fetching the data.");
    }
  } else {
    res.redirect("/");
  }
});

router.get("/post", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 1) {
    const category = await categoryModel.allforuser();
    for (var i = 0; i < category.length; i++) {
      const subcategory = await subcategoryModel.singleforuser(category[i].CID);
      category[i].Subcategory = subcategory;
    }
    res.render("vwPosts/post", {
      category,
    });
  } else {
    res.redirect("/");
  }
});

router.post("/post", upload.single('fileUpload'), async function (req, res) {
  console.log("Received req.body:", req.body);
  console.log("Received file:", req.file);  // Nếu có file tải lên

  // Kiểm tra và xử lý isPremium
  if (Array.isArray(req.body.Premium)) {
    req.body.Premium = req.body.Premium[0];  // Lấy giá trị đầu tiên của mảng (nếu là mảng)
  }
  req.body.UID = parseInt(req.body.UID, 10); 

  // Xử lý SCID và CID
  const subcategory = await subcategoryModel.single2(req.body.SCID);
  if (subcategory.length === 0) {
    return res.status(400).send("Invalid SCID");
  }
  req.body.CID = subcategory[0].CID;

  // Kiểm tra và lưu file tải lên (nếu có)
  if (req.file) {
    // Lưu thông tin file nếu cần (ví dụ: đường dẫn file, tên file)
    req.body.filePath = req.file.path;  // Đảm bảo xử lý file upload đúng cách
  }

  // Xử lý thời gian
  var today = new Date();
  var time =
    today.getFullYear() +
    "-" +
    (today.getMonth() + 1).toString().padStart(2, '0') +
    "-" +
    today.getDate().toString().padStart(2, '0') +
    " " +
    today.getHours().toString().padStart(2, '0') +
    ":" +
    today.getMinutes().toString().padStart(2, '0') +
    ":" +
    today.getSeconds().toString().padStart(2, '0');
  
  req.body.TimePost = time;
  req.body.UID = req.user.UserID;

  // Thêm bài viết vào cơ sở dữ liệu
  try {
    await postModel.add(req.body);
    res.redirect("/writerpanel");
  } catch (error) {
    console.error("Error adding post:", error);
    res.status(500).send("An error occurred while adding the post.");
  }
});
module.exports = router;
