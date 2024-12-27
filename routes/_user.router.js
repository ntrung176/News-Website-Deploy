const express = require("express");
const router = express.Router();
const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

router.get("/profile", function (req, res) {
  if (req.isAuthenticated()) {
    req.user.F_DOB = moment(req.user.DayOfBirth, "YYYY-MM-DD").format(
      "DD-MM-YYYY"
    );

    res.render("_vwAccount/profile", {
      user: req.user,
      qUser: req.user.Permission === 0,
      qWriter: req.user.Permission === 1,
      qEditor: req.user.Permission === 2,
      qAdmin: req.user.Permission === 3,
    });
  } else {
    res.redirect("/dangnhap");
  }
});

router.get("/profile/edit", function (req, res) {
  if (req.isAuthenticated()) {
    req.user.F_DOB = moment(req.user.DayOfBirth, "YYYY-MM-DD").format(
      "YYYY-MM-DD"
    );

    res.render("_vwAccount/edit", {
      user: req.user,
    });
  } else {
    res.redirect("/dangnhap");
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimeType = allowedTypes.test(file.mimetype);
  
  if (extname && mimeType) {
    return cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận các định dạng ảnh như JPG, PNG, GIF"));
  }
};
const storage = multer.memoryStorage();
// Thiết lập multer với bộ lọc và giới hạn kích thước file
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Giới hạn kích thước file 5MB
}).single("Avatar"); // Đảm bảo chỉ nhận 1 file ảnh với field "Avatar"

// Định tuyến xử lý upload ảnh
router.post("/profile/edit", upload, async function (req, res) {
  if (req.isAuthenticated()) {
    req.body.UserID = req.user.UserID;
    req.body.DayOfBirth = req.body.F_DOB;
    delete req.body.F_DOB;

    // Xử lý ảnh nếu có file upload
    if (req.file) {
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      const fileName = `${req.user.UserID}.jpg`; // Tên file là ID người dùng

      const filePath = path.join(__dirname, "../public/images/avatarUser", fileName);

      // Chuyển đổi ảnh về định dạng JPG và lưu vào thư mục
      await sharp(req.file.buffer)
        .resize(120, 120) // Kích thước ảnh nếu cần thiết
        .toFormat("jpg")
        .jpeg({ quality: 90 }) // Chuyển sang JPG với chất lượng 90%
        .toFile(filePath); // Lưu ảnh vào thư mục
    }

    // Cập nhật thông tin người dùng vào cơ sở dữ liệu (trừ ảnh)
    await userModel.patch(req.body);

    req.user.F_DOB = moment(req.user.DayOfBirth, "YYYY-MM-DD").format("DD-MM-YYYY");

    res.redirect("/profile");
  } else {
    res.redirect("/dangnhap");
  }
});

router.post("/naptien", async function (req, res) {
  if (req.isAuthenticated()) {
    console.log(req.user);
    req.user.F_DOB = moment(req.user.DayOfBirth, "YYYY-MM-DD").format(
      "DD-MM-YYYY"
    );
    req.body.tien = Number(req.body.tien);
    const entity = {
      UserID: req.user.UserID,
      tien: req.user.tien + req.body.tien,
    };
    await userModel.patch(entity);
    const naptien_success = true;

    res.render("_vwAccount/profile", {
      naptien_success,
      tienvuanap: req.body.tien,
      user: req.user,
      qUser: req.user.Permission === 0,
      qWriter: req.user.Permission === 1,
      qEditor: req.user.Permission === 2,
      qAdmin: req.user.Permission === 3,
    });
  } else {
    res.redirect("/dangnhap");
  }
});

module.exports = router;
