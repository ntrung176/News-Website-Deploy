const express = require("express");
const postModel = require("../models/posts.model");
const _postModel = require("../models/_post.model");
const categoryModel = require("../models/category.model");
const subcategoryModel = require("../models/subcategory.model");
const poststatusModel= require("../models/statuspost.model");
const router = express.Router();
const path = require('path');
const fs = require('fs'); 
const moment = require("moment");
const userModel = require("../models/user.model");
const multer = require("multer");
const sharp = require('sharp');
const flash = require('connect-flash');
moment.locale("vi");

// Helper function to get user name by UID
async function getUserNameByUID(uid) {
  const user = await userModel.singleByUserID(uid);
  return user ? user.UserName : "Unknown User";
}

router.get("/", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) {
    const cate = await categoryModel.allforuser();
    const post = await postModel.all();

    for (let i = 0; i < post.length; i++) {
      post[i].Time = moment(post[i].TimePost, "YYYY-MM-DD hh:mm:ss").format(
        "hh:mmA DD/MM/YYYY"
      );
      const cat_post = await categoryModel.single(post[i].CID);
      post[i].CName = cat_post[0]?.CName || "Unknown Category";

      const subcat_post = await subcategoryModel.single2(post[i].SCID);
      if (post[i].SCID !== null) {
        post[i].SCName =
          " / " + (subcat_post[0]?.SCName || "Unknown Subcategory");
      }

      post[i].UserName = await getUserNameByUID(post[i].UID);
      post[i].Delete = post[i].xoa === 1;
      post[i].Pre = post[i].Premium === 1;
    }

    const statuses = [
      { key: "post_ChuaDuyet", status: 0 },
      { key: "post_TuChoi", status: 1 },
      { key: "post_ChoXuatBan", status: 2 },
      { key: "post_XuatBan", status: 3 },
    ];

    const statusPosts = {};

    for (const { key, status } of statuses) {
      const posts = await postModel.allByStatus(status);
      for (let i = 0; i < posts.length; i++) {
        posts[i].Time = moment(posts[i].TimePost, "YYYY-MM-DD hh:mm:ss").format(
          "hh:mmA DD/MM/YYYY"
        );
        const cat_post = await categoryModel.single(posts[i].CID);
        posts[i].CName = cat_post[0]?.CName || "Unknown Category";

        const subcat_post = await subcategoryModel.single2(posts[i].SCID);
        if (posts[i].SCID !== null) {
          posts[i].SCName =
            " / " + (subcat_post[0]?.SCName || "Unknown Subcategory");
        }

        posts[i].UserName = await getUserNameByUID(posts[i].UID);
        posts[i].Delete = posts[i].xoa === 1;
        posts[i].Pre = posts[i].Premium === 1;
      }
      statusPosts[key] = posts;
    }

    res.render("vwPosts/home", {
      post,
      list: cate,
      empty: cate.length === 0,
      ...statusPosts,
    });
  } else {
    res.redirect("/");
  }
});

router.get("/cat/:cid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission >0) {
    const cid = +req.params.cid || -1; // Lấy CID từ URL

    // Lấy danh sách bài viết thuộc category ID (CID)
    const posts = await postModel.getByCategoryID(cid);
    const category = await categoryModel.singleByCID(cid);

    // Xử lý dữ liệu bài viết
    for (let i = 0; i < posts.length; i++) {
      posts[i].Time = moment(posts[i].TimePost, "YYYY-MM-DD hh:mm:ss").format(
        "hh:mmA DD/MM/YYYY"
      );
      const subcat_post = await subcategoryModel.single2(posts[i].SCID);
      posts[i].SCName = subcat_post[0]?.SCName || "Unknown Subcategory";

      const uid_post = await getUserNameByUID(posts[i].UID);
      posts[i].UserName = uid_post;
    }

    // Render các bài viết thuộc chuyên mục
    res.render("vwPosts/category", {
      posts,
      empty: posts.length === 0,
      category: category[0],  // Truyền category cho template
    });
  } else {
    res.redirect("/");
  }
});


router.get("/status/:pid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission > 1) {
    const pid = +req.params.pid || -1;
    const pst = await postModel.singleByPostID(pid);

    if (!pst.length) {
      return res.redirect("/admin/posts");
    }

    const cate_post = await categoryModel.singleByCID(pst[0].CID);
    const subcate_post = await subcategoryModel.single2(pst[0].SCID);
    const sub_post = subcate_post[0];
    const category = await categoryModel.allforuser();

    for (let i = 0; i < category.length; i++) {
      const row = await subcategoryModel.singleforuser(category[i].CID);
      category[i].subcategories = row;
      category[i].PID = pid;
      for (let j = 0; j < category[i].subcategories.length; j++) {
        category[i].subcategories[j].PID = pid;
      }
    }

    const post = pst[0];
    res.render("vwPosts/status", {
      cate_post,
      sub_post,
      category,
      post,
    });
  } else {
    res.redirect("/");
  }
});

router.post("/status/:pid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission > 1) {
    try {
      const pid = +req.params.pid || -1; // Lấy ID bài viết từ URL
      const newStatus = Number(req.body.Duyet); // Chuyển trạng thái từ form thành số
      const reason = req.body.Reason || ""; // Lý do từ chối (nếu có)
      const timePublic = req.body.TimePublic || null; // Thời gian xuất bản (nếu có)

      // Kiểm tra trạng thái hợp lệ (1, 2, 3)
      if (![1, 2, 3].includes(newStatus)) {
        return res.status(400).send("Trạng thái không hợp lệ.");
      }

      // Lấy bài viết từ DB
      const post = await postModel.singleByPostID(pid);
      if (!post.length) {
        return res.redirect("/admin/posts");
      }

      // Cập nhật trạng thái bài viết trong bảng poststatus
      const statusEntry = {
        PostID: pid,
        Status: newStatus,
        NameStatus: getStatusName(newStatus),
        Reason: newStatus === 1 ? reason : "", // Chỉ lưu lý do nếu trạng thái là "Bị từ chối"
        TimePublic: newStatus === 3 ? timePublic : null, // Chỉ lưu thời gian nếu trạng thái là "Đã xuất bản"
      };
      await poststatusModel.add(statusEntry);

      // Cập nhật trạng thái bài viết trong bảng posts
      const updatedPost = {
        Duyet: newStatus, // Cập nhật trạng thái Duyet
        TimePublic: newStatus === 3 ? timePublic : null, // Nếu Duyệt là 3, cập nhật TimePublic
        PostID: pid,
        StatusPost: newStatus === 3
          ? "Đã xuất bản"
          : newStatus === 1
          ? "Bị từ chối"
          : "Đang duyệt", // Cập nhật StatusPost
      };
      await postModel.patch(updatedPost);

      // Quay lại trang quản lý bài viết
      res.redirect(`/admin/posts/status/${pid}`);
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).send("Có lỗi xảy ra.");
    }
  } else {
    res.redirect("/"); // Nếu người dùng không có quyền
  }
});

// Hàm lấy tên trạng thái từ mã trạng thái
function getStatusName(status) {
  switch (status) {
    case 1:
      return "Bị từ chối";
    case 2:
      return "Đang duyệt";
    case 3:
      return "Đã xuất bản";
    default:
      return "Chưa duyệt";
  }
}



router.get("/edit/:pid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission > 1) {
    const pid = +req.params.pid || -1;
    const pst = await postModel.singleByPostID(pid);

    if (!pst.length) {
      return res.redirect("/admin/posts");
    }

    const post = pst[0];
    // Fetch category and subcategory data
    const cate_post = await categoryModel.singleByCID(post.CID);
    const subcate_post = await subcategoryModel.single2(post.SCID);
    const sub_post = subcate_post[0];

    // Fetch all categories for the dropdown
    const category = await categoryModel.allforuser();
    for (let i = 0; i < category.length; i++) {
      const row = await subcategoryModel.singleforuser(category[i].CID);
      category[i].subcategories = row;
      category[i].PID = pid;
      for (let j = 0; j < category[i].subcategories.length; j++) {
        category[i].subcategories[j].PID = pid;
      }
    }

    // Render the edit page with the post and category data
    res.render("vwPosts/edit", {
      post,
      cate_post,
      sub_post,
      category,
    });
  } else {
    res.redirect("/"); // Redirect if the user isn't authenticated or lacks permission
  }
});
router.get("/move/:pid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission > 1) {
    const pid = +req.params.pid || -1;
    const pst = await postModel.singleByPostID(pid);
    console.log(req.params);

    if (!pst.length) {
      return res.redirect("/admin/posts");
    }

    const post = pst[0];
    const cate_post = await categoryModel.singleByCID(post.CID);
    const subcate_post = await subcategoryModel.single2(post.SCID);
    const sub_post = subcate_post[0];

    // Fetch all categories and subcategories for moving the post
    const category = await categoryModel.allforuser();
    for (let i = 0; i < category.length; i++) {
      const row = await subcategoryModel.singleforuser(category[i].CID);
      category[i].subcategories = row;
      category[i].PID = pid;
      for (let j = 0; j < category[i].subcategories.length; j++) {
        category[i].subcategories[j].PID = pid;
      }
    }

    res.render("vwPosts/move", {
      post,
      cate_post,
      sub_post,
      category,
    });
  } else {
    res.redirect("/"); // Redirect if the user is not authenticated or lacks permission
  }
});
router.post("/move/:pid/tocat/:cid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission > 1) {
    const pid = +req.params.pid || -1;
    const cid = +req.params.cid || -1;

    const pst = await postModel.singleByPostID(pid);

    if (!pst.length) {
      return res.redirect("/admin/posts");
    }

    // Cập nhật CID cho bài viết
    const updateResult = await postModel.updateCategory(pid, cid);

    if (updateResult) {
      res.redirect(`/admin/posts`);
    } else {
      res.redirect(`/admin/posts/${pid}`);
    }
  } else {
    res.redirect("/");  // Redirect if not authenticated or not authorized
  }
});

router.get("/move/:pid/tocat/:cid", async function (req, res) {
  const pid = +req.params.pid || -1;
  const cid = +req.params.cid || -1;
  console.log(cid);
  if (pid === -1 || cid === -1) {
    return res.status(400).send("Invalid Post ID or Category ID.");
  }

  try {
    // Kiểm tra bài viết có tồn tại
    const pst = await postModel.singleByPostID(pid);
    if (!pst || !pst.length) {
      return res.status(404).send("Post not found.");
    }

    // Kiểm tra chuyên mục có tồn tại
    const category = await categoryModel.singleByCID(cid);
    if (!category || !category.length) {
      return res.status(404).send("Category not found.");
    }

    // Cập nhật chuyên mục cho bài viết
    const post = pst[0];
    post.CID = cid;  // Cập nhật chuyên mục cho bài viết
    await postModel.update(post);

    // Chuyển hướng về trang bài viết sau khi di chuyển
    res.redirect(`/admin/posts/${post.PostID}`);
  } catch (error) {
    console.error("Error moving post:", error);
    res.status(500).send("Error moving post.");
  }
});

router.get("/move/:pid/tosub/:scid", async function (req, res) {
  const pid = +req.params.pid || -1;
  const scid = +req.params.scid || -1;
  console.log(scid );
  if (pid === -1 || scid === -1) {
    return res.status(400).send("Invalid Post ID or Subcategory ID.");
  }

  try {
    // Kiểm tra bài viết có tồn tại
    const pst = await postModel.singleByPostID(pid);
    if (!pst || !pst.length) {
      return res.status(404).send("Post not found.");
    }

    // Kiểm tra phân loại con có tồn tại
    const subcategory = await subcategoryModel.single(scid);
    if (!subcategory || !subcategory.length) {
      return res.status(404).send("Subcategory not found.");
    }

    // Cập nhật phân loại con cho bài viết
    const post = pst[0];
    post.SCID = scid;
    await postModel.update(post);

    // Chuyển hướng về trang bài viết sau khi di chuyển
    res.redirect(`/admin/posts/${post.PostID}`);
  } catch (error) {
    console.error("Error moving post:", error);
    res.status(500).send("Error moving post.");
  }
});
router.post("/move/:pid/tosub/:scid", async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission > 1) {
    const pid = +req.params.pid || -1;
    const scid = +req.params.scid || -1;
    console.log(req.body);
    const pst = await postModel.updateSubcategory(pid,scid);
    const subcategory = await subcategoryModel.getCIDBySCID(scid);
    const cid = subcategory[0].CID;

    if (!pst.length) {
      return res.redirect("/admin/posts");
    }

    // Cập nhật SCID cho bài viết
    const updateResult = await postModel.updateCategoryAndSubcategory(pid, cid, scid);

    if (updateResult) {

      res.redirect(`/admin/posts/${pid}`);
    } else {
      res.redirect(`/admin/posts/${pid}`);
    }
  } else {
    res.redirect("/");  // Redirect if not authenticated or not authorized
  }
});
router.post("/update", async function (req, res) {
  // Debug dữ liệu từ req.body để kiểm tra
  console.log("Received req.body:", req.body);

  // Lấy dữ liệu từ form
  const post = {// Dữ liệu này từ input hidden
    PostTitle: req.body.PostTitle,
    TimePost: req.body.TimePost || new Date().toISOString().slice(0, 19).replace('T', ' '), // Xử lý checkbox
    SumContent: req.body.SumContent,
    Content: req.body.Content,
    source: req.body.source,
    linksource: req.body.linksource,
    Premium: req.body.Premium ? 1 : 0,
    PostID: req.body.PostID

  };

  // Kiểm tra tính hợp lệ của dữ liệu
  if (!post.PostID) {
    return res.status(400).send("PostID is required.");
  }
  if (!post.PostTitle || !post.Content) {
    return res.status(400).send("PostTitle and Content are required.");
  }

  try {
    // Gọi hàm cập nhật dữ liệu từ model
    const result = await postModel.update(post);

    // Kiểm tra kết quả cập nhật
    if (result.affectedRows === 0) {
      return res.status(404).send("Post not found or no changes were made.");
    }

    // Redirect về trang chi tiết bài viết
    res.redirect(`/admin/posts/${post.PostID}`);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("Error updating post.");
  }
});
router.get('/:id', async function (req, res) {
  try {
      const postID = req.params.id;  // Lấy ID bài viết từ URL
      
      // Lấy dữ liệu bài viết từ cơ sở dữ liệu bằng postModel
      const rows = await _postModel.singleByPostID(postID);

      if (rows.length === 0) {
          // Nếu không tìm thấy bài viết, chuyển hướng đến trang admin posts
          return res.redirect('/admin/posts');
      }

      // Dữ liệu bài viết
      const post = rows[0];

      // Render template Handlebars với dữ liệu bài viết
      res.render('vwPosts/baiviet', {
          rows: post // Truyền dữ liệu bài viết vào template Handlebars
      });
  } catch (error) {
      console.error('Error fetching post details:', error);
      res.status(500).send('Error fetching post details');
  }
});
router.get('/upload/:id', async function (req, res) {
  try {
      const postID = req.params.id;  // Lấy ID bài viết từ URL
      
      // Lấy dữ liệu bài viết từ cơ sở dữ liệu bằng postModel
      const rows = await postModel.singleByPostID(postID);

      if (rows.length === 0) {
          // Nếu không tìm thấy bài viết, chuyển hướng đến trang admin posts
          return res.redirect('/admin/posts');
      }

      // Dữ liệu bài viết
      const post = rows[0];

      // Render template Handlebars cho trang upload ảnh với dữ liệu bài viết
      res.render('vwPosts/upload', {
          rows: post // Truyền dữ liệu bài viết vào template Handlebars
      });
  } catch (error) {
      console.error('Error fetching post for upload:', error);
      res.status(500).send('Error fetching post for upload');
  }
});
const uploadDir = 'public/images/avatarPost';  // Không cần phải có __dirname trong uploadDir

// Tạo đường dẫn đầy đủ từ __dirname và uploadDir
;// Xác định thư mục chính xác
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('Thư mục public/images đã được tạo');
}

// Định nghĩa cách lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Kiểm tra thư mục đích có tồn tại không
        const destDir = path.join(__dirname, '..', uploadDir);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir);
        }
        cb(null, destDir);
    },
    filename: (req, file, cb) => {
      const postID = req.params.PostID; // Lấy PostID từ URL hoặc body
      const extname = path.extname(file.originalname).toLowerCase(); // Lấy phần mở rộng của file
      const filename = `${postID}${extname}`; // Tên file theo PostID
      cb(null, filename); // Đặt tên file cho ảnh
  }
});

// Khởi tạo multer
const upload = multer({ storage: storage });


router.post('/upload/:id', upload.single('fuMain'), async (req, res) => {
  const postID = req.params.id; // Lấy ID bài viết từ params
  const uploadedFile = req.file;

  // Kiểm tra file đã tải lên
  if (!uploadedFile) {
    return res.status(400).send('Không có file nào được chọn hoặc định dạng không hợp lệ');
  }

  console.log('File uploaded:', uploadedFile); // Log file để kiểm tra

  const targetFilePath = path.join(uploadDir, `${postID}.png`); // Đường dẫn ảnh mới (định dạng PNG)

  // Đảm bảo thư mục upload tồn tại
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Đường dẫn ảnh cũ
  const oldImagePathPng = path.join(uploadDir, `${postID}.png`);
  const oldImagePathJpg = path.join(uploadDir, `${postID}.jpg`);
  const oldImagePathJpeg = path.join(uploadDir, `${postID}.jpeg`);

  // Kiểm tra và xóa ảnh cũ nếu tồn tại
  [oldImagePathPng, oldImagePathJpg, oldImagePathJpeg].forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath); // Xóa ảnh cũ
        console.log(`Đã xóa ảnh cũ: ${filePath}`);
      } catch (error) {
        console.error(`Lỗi khi xóa ảnh cũ: ${filePath}`, error);
      }
    }
  });

  try {
    // Chuyển đổi ảnh sang định dạng PNG và lưu vào thư mục dự án
    await sharp(uploadedFile.path)
      .png()
      .toFile(targetFilePath);

    // Xóa file gốc đã tải lên (không còn cần thiết)
    fs.unlinkSync(uploadedFile.path);

    res.status(200).send('Ảnh đã được tải lên và chuyển đổi thành định dạng PNG.');
  } catch (error) {
    console.error('Lỗi khi xử lý ảnh:', error);
    res.status(500).send('Đã xảy ra lỗi khi xử lý ảnh.');
  }
});
router.post('/del/:id', async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) { // Kiểm tra quyền người dùng
      const id = +req.params.id || -1; // Lấy ID bài viết từ URL
      try {
          await postModel.del(id); // Gọi hàm xóa bài viết trong model
          res.redirect('/admin/posts'); // Chuyển hướng sau khi xóa thành công
      } catch (error) {
          console.error('Error deleting post:', error);
          res.status(500).send('An error occurred while deleting the post.');
      }
  } else {
      res.redirect('/'); // Người dùng không có quyền thì chuyển hướng về trang chủ
  }
});
router.get('/restore/:id', async function(req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) {
      const id = +req.params.id || -1;

      await postModel.restore(id);
      res.redirect('/admin/posts/');
  } else {
      res.redirect('/')
  }
});
router.post('/restore/:id', async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) { // Kiểm tra quyền
      const id = +req.params.id || -1; // Lấy ID từ URL
      try {
          await postModel.restore(id); // Gọi hàm khôi phục bài viết trong model
          res.redirect('/admin/posts/'); // Chuyển hướng sau khi khôi phục
      } catch (error) {
          console.error('Error restoring post:', error);
          res.status(500).send('An error occurred while restoring the post.');
      }
  } else {
      res.redirect('/'); // Người dùng không có quyền thì chuyển hướng về trang chủ
  }
});
router.get('/delete/:id', async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) {
      const id = +req.params.id || -1;
      await postModel.del2(id);
      res.redirect('/admin/posts/');
  } else {
      res.redirect('/')
  }
});
router.post('/delete', async function (req, res) {
  if (req.isAuthenticated() && req.user.Permission === 3) {
    const id = +req.body.id || -1; // Lấy ID từ body
    try {
      await postModel.del2(id); // Gọi hàm xóa
      res.status(200).json({ success: true, message: 'Post deleted successfully.' });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ success: false, message: 'Failed to delete post.' });
    }
  } else {
    res.status(403).json({ success: false, message: 'Unauthorized.' });
  }
});

module.exports = router;
