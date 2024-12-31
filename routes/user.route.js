const express = require("express");
const userModel = require("../models/user.model");
const bcrypt = require("bcryptjs");
const utilsModel = require("../models/utils.model");

const router = express.Router();

router.get("/dangky", async function (req, res) {
  const user = await userModel.all();
  res.render("_vwAccount/dangky", {
    list: user,
    count: user.length,
  });
});

router.post("/dangky", async function (req, res) {
  const byUsername = await userModel.singleByUserName(req.body.username);
  const byEmail = await userModel.singleByEmail(req.body.email);
  const byPhone = await userModel.singleByPhone(req.body.phone);

  if (byUsername || byEmail || byPhone) {
    var invalid_username = false;
    var invalid_mail = false;
    var invalid_phone = false;
    if (byUsername) {
      invalid_username = true;
    }
    if (byEmail) {
      invalid_mail = true;
    }
    if (byPhone) {
      invalid_phone = true;
    }
    res.render("_vwAccount/dangky", {
      invalid_username,
      invalid_mail,
      invalid_phone,
      info: req.body,
    });
  } else {
    const password_hash = bcrypt.hashSync(req.body.password, 8);
    const entity = {
      username: req.body.username,
      password_hash,
      phone: req.body.phone,
      email: req.body.email,
      fullname: req.body.fullname,
      address: req.body.address,
      dayofbirth: req.body.dob,
    };

    await userModel.add(entity);
    res.redirect("/dangnhap");
  }
});

router.get("/premium", async function (req, res) {
  var today = new Date();
  console.log(req.user.tien);
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var datetime = date + " " + time;
  today.setDate(today.getDate() + 7);
  var date1 =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time1 =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var datetime1 = date1 + " " + time1;
  const entity = {
    UserID: req.user.UserID,
    HSD: 7,
    Premium: 1,
    NgayDKPremium: datetime,
    NgayHHPremium: datetime1,
  };
  await userModel.patch(entity);
  res.redirect("/profile");
});
router.post("/premium", async function (req, res) {
  try {
    // Lấy thông tin người dùng
    const user = await userModel.singleByUserID(req.user.UserID);

    if (!user) {
      return res.status(404).send("Người dùng không tồn tại.");
    }

    // Kiểm tra số dư
    let soDu = parseFloat(user.tien); // Tiền hiện tại trong tài khoản
    const phiPremium = 99000; // Phí đăng ký Premium

    if (isNaN(soDu)) {
      return res.status(400).send("Số dư không hợp lệ.");
    }

    if (soDu < phiPremium) {
      // Nếu không đủ tiền, thông báo lỗi
      req.session.message = "Số dư không đủ để đăng ký Premium!";
      return res.redirect("/profile");
    }

    // Tính số dư sau khi trừ phí Premium
    soDu -= phiPremium;

    // Xử lý thời gian đăng ký và hết hạn Premium
    const today = new Date();
    const datetime = today.toISOString().slice(0, 19).replace("T", " "); // Ngày đăng ký
    today.setDate(today.getDate() + 7); // Thêm 7 ngày
    const datetime1 = today.toISOString().slice(0, 19).replace("T", " "); // Ngày hết hạn

    // Cập nhật thông tin Premium
    const entity = {
      UserID: req.user.UserID,
      HSD: 7,
      Premium: 1, // Đặt Premium = 1 khi đăng ký thành công
      NgayDKPremium: datetime,
      NgayHHPremium: datetime1,
      tien: soDu, // Cập nhật số dư sau khi trừ phí
    };

    await userModel.patch(entity);

    // Thông báo thành công
    req.session.message = "Đăng ký Premium thành công!";
    res.redirect("/profile");
  } catch (error) {
    console.error("Error while registering for Premium:", error);
    req.session.message = "Đã xảy ra lỗi khi đăng ký Premium.";
    res.redirect("/profile");
  }
});

module.exports = router;
