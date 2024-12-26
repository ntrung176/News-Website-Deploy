const express = require("express");
const session = require("express-session");
const exphbs = require("express-handlebars");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const hbs_sections = require("express-handlebars-sections");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const mysql = require("mysql2");
require("express-async-errors");

require("dotenv").config();

const app = express();

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(express.json());

app.engine(
  "hbs",
  exphbs.engine({
    layoutsDir: "views/_layouts",
    defaultLayout: "main.hbs",
    extname: ".hbs",
    helpers: {
      section: hbs_sections(),
    },
  })
);
app.set("view engine", "hbs");
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat", // Đổi bằng biến môi trường
    resave: false,
    saveUninitialized: true,
    cookie: {
      // secure: true
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/public", express.static("public"));

app.use(function (req, res, next) {
  if (req.isAuthenticated()) {
    res.locals.lcIsAuthenticated = true;
    res.locals.lcAuthUser = req.user;
    if (req.user.Permission === 3) {
      res.locals.lcAdmin = true;
    }
    if (req.user.Permission === 2) {
      res.locals.lcEditor = true;
    }
    if (req.user.Permission === 1) {
      res.locals.lcWriter = true;
    }
  }

  next();
});

const categoryModel = require("./models/category.model");
const subcategoryModel = require("./models/subcategory.model");
const postModel = require("./models/posts.model");
const _postModel = require("./models/_post.model");
const commentModel = require("./models/comment.model");
const userModel = require("./models/user.model");

app.use(async function (req, res, next) {
  const rows = await categoryModel.allforuser();
  for (var i = 0; i < rows.length; i++) {
    if (i % 5 == 0) {
      rows[i].xd = "margin-bottom: 45px;";
    }
  }
  for (var i = 0; i < rows.length; i++) {
    const row = await subcategoryModel.singleforuser(rows[i].CID);
    rows[i].subcategories = row;
  }
  res.locals.lcCategories = rows;
  next();
});

app.use(async function (req, res, next) {
  const post = await postModel.allPostSapPublic();
  var today = new Date();
  var date =
    today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
  var time =
    today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
  var datetime = date + " " + time;
  datetime = moment(datetime, "YYYY-MM-DD hh:mm:ss").format(
    "YYYY-MM-DD hh:mm:ss"
  );

  for (var i = 0; i < post.length; i++) {
    const entity = {
      PostID: post[i].PostID,
      Duyet: 3,
      StatusPost: "Đã xuất bản",
    };
    datetimep = moment(post[i].TimePublic, "YYYY-MM-DD hh:mm:ss").format(
      "YYYY-MM-DD hh:mm:ss"
    );
    if (datetimep <= datetime) {
      await postModel.patch(entity);
    }
  }

  next();
});

app.get("/", async function (req, res) {
  const rows = await _postModel.best();
  if (rows.length !== 0) {
    const cat_post = await categoryModel.singleByCID(rows[0].CID);

    const subcat_post = await subcategoryModel.single2(rows[0].SCID);
    rows[0].CName = cat_post.CName;
    if (rows[0].SCID !== null) {
      rows[0].SCName = subcat_post[0].SCName;
    }
    rows[0].Time = moment(rows[0].TimePost, "YYYY-MM-DD hh:mm:ss").fromNow();
    const hot = await _postModel.hot2();
    const countComment = await commentModel.countByPostID(rows[0].PostID);
    rows[0].countComment = countComment[0].Count;
    for (const item of hot) {
      const cat = await categoryModel.singleByCID(item.CID);
      const subc = await subcategoryModel.single2(item.SCID);
      item.CName = cat.CName;

      if (item.SCID !== null && subc.length > 0) {
        item.SCName = subc[0].SCName;
      }

      item.Time = moment(item.TimePost, "YYYY-MM-DD hh:mm:ss").fromNow();
    }

    // Xóa phần tử có PostID trùng với rows[0].PostID
    for (let i = 0; i < hot.length; i++) {
      if (hot[i].PostID === rows[0].PostID) {
        hot.splice(i, 1); // Xóa phần tử khỏi mảng
        break; // Dừng vòng lặp khi tìm thấy và xóa phần tử
      }
    }

    const new10 = await _postModel.new10();
    for (var i = 0; i < new10.length; i++) {
      const cat = await categoryModel.singleByCID(new10[i].CID);
      const subc = await subcategoryModel.single2(new10[i].SCID);
      new10[i].CName = cat.CName;
      if (new10[i].SCID !== null) {
        new10[i].SCName = subc[0].SCName;
      }
      new10[i].Time = moment(
        new10[i].TimePost,
        "YYYY-MM-DD hh:mm:ss"
      ).fromNow();
      if (new10[i].Premium === 1) {
        new10[i].Pre = true;
      }
    }

    const hot10 = await _postModel.hot10();
    for (var i = 0; i < hot10.length; i++) {
      const cat = await categoryModel.singleByCID(hot10[i].CID);
      const subc = await subcategoryModel.single2(hot10[i].SCID);

      // Kiểm tra xem subc có hợp lệ hay không
      hot10[i].CName = cat.CName;
      if (hot10[i].SCID !== null && subc && subc.length > 0) {
        hot10[i].SCName = subc[0].SCName; // Gán SCName từ subc nếu subc hợp lệ
      }
      hot10[i].Time = moment(
        hot10[i].TimePost,
        "YYYY-MM-DD hh:mm:ss"
      ).fromNow();
      if (hot10[i].Premium === 1) {
        hot10[i].Pre = true;
      }
    }

    const category = await categoryModel.allforuser();
    for (var i = 0; i < category.length; i++) {
      const subcategory = await subcategoryModel.singleforuser(category[i].CID);
      category[i].subcategory = subcategory;
      const new1 = await _postModel.new1(category[i].CID);
      category[i].new = new1;
    }
    res.render("home", {
      rows,
      hot,
      new10,
      hot10,
      category,
    });
  } else {
    res.render("home");
  }
});

app.get("/admin", function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) {
    res.render("adminpanel");
  } else {
    res.redirect("/");
  }
});

const categoryRouter = require("./routes/category.route");
app.use("/admin/categories", categoryRouter);

const subcategoryRouter = require("./routes/subcategory.route");
app.use("/admin/subcategories", subcategoryRouter);

const postRouter = require("./routes/posts.route");
app.use("/admin/posts", postRouter);

const userRouter = require("./routes/user.route");
app.use("/", userRouter);

const usersRouter = require("./routes/users.route");
app.use("/admin/users", usersRouter);

const utilsRouter = require("./routes/utils.route");
app.use("/", utilsRouter);

const _userModel = require("./routes/_user.router");
app.use("/", _userModel);

const _postRouter = require("./routes/_post.route");
app.use("/post", _postRouter);

const writerPanelRouter = require("./routes/writerpanel.route");
app.use("/writerpanel", writerPanelRouter);

const editorPanelRouter = require("./routes/editorpanel.route");
app.use("/editorpanel", editorPanelRouter);

app
  .route("/dangnhap")
  .get(function (req, res) {
    res.render("_vwAccount/dangnhap");
  })
  .post(
    passport.authenticate("local", {
      failureRedirect: "/dangnhap",
      successRedirect: "/",
    })
  );

app.use(express.urlencoded({ extended: true }));
app
  .route("/quenmatkhau")
  .get(function (req, res) {
    res.render("_vwAccount/quenmatkhau");
  })
  .post(
    passport.authenticate("local", {
      failureRedirect: "/quenmatkhau",
      successRedirect: "/",
    })
  );
app.post("/quenmatkhau", async (req, res) => {
  const phone = req.body.phone; // Số điện thoại người dùng nhập
  const newPassword = req.body.new_password; // Mật khẩu mới người dùng nhập
  console.log("Số điện thoại:", phone); // Kiểm tra xem dữ liệu đã gửi đúng chưa
  console.log("Mật khẩu mới:", newPassword);
  // Kiểm tra số điện thoại có tồn tại trong cơ sở dữ liệu không
  try {
    const user = await User.findOne({ where: { Phone: phone } });

    if (!user) {
      // Nếu không tìm thấy người dùng với số điện thoại này
      return res.status(400).send("Số điện thoại không tồn tại.");
    }

    // Mã hóa mật khẩu trước khi lưu vào cơ sở dữ liệu (nếu cần)
    const hashedPassword = bcrypt.hashSync(newPassword, 10); // Sử dụng bcrypt hoặc thư viện mã hóa mật khẩu tương tự

    // Cập nhật mật khẩu cho người dùng
    await User.update(
      { Password_hash: hashedPassword }, // Mật khẩu đã mã hóa
      { where: { Phone: phone } } // Cập nhật người dùng có số điện thoại này
    );

    res.send("Mật khẩu đã được cập nhật thành công.");
  } catch (error) {
    console.error(error);
    res.status(500).send("Đã xảy ra lỗi trong quá trình xử lý.");
  }
});
app.route("/search").get(function (req, res) {
  res.render("search");
});
app.route("/edit").get(function (req, res) {
  res.render("vwAccount/edit");
});

app.get("/quenmatkhau", function (req, res) {
  // Kiểm tra nếu người dùng đã đăng nhập
  if (req.isAuthenticated()) {
    return res.redirect("/"); // Đã đăng nhập, chuyển hướng về trang chủ
  }

  // Nếu chưa đăng nhập, hiển thị trang quên mật khẩu
  res.render("_vwAccount/quenmatkhau");
});

app.post("/quenmatkhau", async (req, res) => {
  const phone = req.body.phone; // Số điện thoại người dùng nhập
  const newPassword = req.body.new_password; // Mật khẩu mới người dùng nhập

  console.log("Số điện thoại:", phone); // Kiểm tra xem dữ liệu đã gửi đúng chưa
  console.log("Mật khẩu mới:", newPassword);

  try {
    // Tìm người dùng theo số điện thoại
    const user = await User.singleByPhone(phone); // Sử dụng hàm singleByPhone để tìm người dùng

    if (!user) {
      // Nếu không tìm thấy người dùng với số điện thoại này
      return res
        .status(400)
        .json({ success: false, message: "Số điện thoại không tồn tại." });
    }

    // Mã hóa mật khẩu mới trước khi lưu vào cơ sở dữ liệu (nếu cần)
    const hashedPassword = bcrypt.hashSync(newPassword, 10); // Sử dụng bcrypt để mã hóa mật khẩu

    // Cập nhật mật khẩu cho người dùng
    await User.update(
      { Password_hash: hashedPassword }, // Mật khẩu đã mã hóa
      { where: { Phone: phone } } // Cập nhật người dùng có số điện thoại này
    );

    // Trả về phản hồi thành công
    return res.json({
      success: true,
      message: "Mật khẩu đã được đặt lại thành công!",
    });
  } catch (error) {
    // Xử lý lỗi nếu có
    console.error("Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Có lỗi xảy ra, vui lòng thử lại!" });
  }
});
app.route("/search").get(function (req, res) {
  res.render("search");
});
app.route("/edit").get(function (req, res) {
  res.render("vwAccount/edit");
});

app.route("/search").get(function (req, res) {
  res.render("search");
});
app.route("/edit").get(function (req, res) {
  res.render("vwAccount/edit");
});

passport.use(
  new LocalStrategy(async function (username, password, done) {
    const user = await userModel.singleByUserName(username);
    if (user === null) {
      return done(null, false);
    }
    const rs = bcrypt.compareSync(password, user.Password_hash);
    if (rs === false) {
      return done(null, false);
    }

    return done(null, user);

    delete user.Password_hash;
  })
);
app.post("/quenmatkhau", (req, res) => {
  const { phone, new_password } = req.body;

  // Kiểm tra số điện thoại và mật khẩu
  if (!phone || !new_password) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin" });
  }

  // Logic cập nhật mật khẩu trong database (giả sử có hàm updatePassword)
  updatePassword(phone, new_password)
    .then((result) => {
      if (result.success) {
        return res.json({
          success: true,
          message: "Mật khẩu đã được thay đổi thành công",
        });
      } else {
        return res
          .status(500)
          .json({ success: false, message: "Có lỗi khi thay đổi mật khẩu" });
      }
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json({ success: false, message: "Có lỗi xảy ra" });
    });
});
app.route("/adminpanel").get(function (req, res) {
  res.render("adminpanel");
});

passport.serializeUser((user, done) => {
  done(null, user.UserName);
});

passport.deserializeUser(async function (name, done) {
  const user = await userModel.singleByUserName(name);
  delete user.Password_hash;

  if (user) {
    return done(null, user);
  } else {
    return done(null, false);
  }
});

app.get("/dangxuat", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err); // Chuyển lỗi sang middleware xử lý lỗi
    }
    res.redirect(req.headers.referer || "/"); // Chuyển hướng về trang trước hoặc trang chính
  });
});

app.use(function (req, res) {
  res.render("404", { layout: false });
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).render("500", { layout: false });
});
// admin tạo cho editor
//

const port = process.env.PORT;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
