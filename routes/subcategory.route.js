const express = require('express');
const categoryModel = require('../models/category.model');
const subcategoryModel = require('../models/subcategory.model');

const router = express.Router();

router.get('/:id', async function (req, res) {
    try {
        if (!req.isAuthenticated() || req.user.Permission !== 3) {
            return res.redirect('/');
        }

        const id = parseInt(req.params.id, 10);
        if (isNaN(id) || id <= 0) {
            return res.status(400).send('Invalid parameter.');
        }

        const list = await subcategoryModel.single(id);
        if (!list) {
            return res.status(404).send('No subcategories found.');
        }

        const processedList = list.map(item => ({
            ...item,
            Xoa: item.Del === 1,
        }));

        const rows = await categoryModel.single(id);
        if (rows.length === 0) {
            return res.status(400).send('Invalid category.');
        }

        const category = rows[0];
        res.render('vwSubCate/list', {
            categories: processedList,
            category,
            xoa: processedList.some(item => item.Xoa),
            empty: processedList.length === 0,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/:id/add', async function (req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = +req.params.id || -1;
        const rows = await categoryModel.single(id);
        if (rows.length === 0)
        return res.send('Invalid parameter.');
    
        const category = rows[0];
        res.render('vwSubCate/add', { category });
    } else {
        res.redirect('/')
    }
})

router.post('/:id/add', async function (req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = +req.params.id || -1;
        const entity = {
            SCName: req.body.SCName,
            CID: id
        };
        await subcategoryModel.add(entity);
        
        res.redirect('/admin/subcategories/'+id);
    } else {
        res.redirect('/')
    }
})

router.get('/edit/:id', async function (req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = +req.params.id || -1;
        const rows = await subcategoryModel.single2(id);
        if (rows.length === 0)
        return res.send('Invalid parameter.');
    
        const subcategory = rows[0];
        res.render('vwSubCate/edit', { subcategory });
    } else {
        res.redirect('/')
    }
})

router.post('/update', async function (req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = req.body.SCID;
        await subcategoryModel.patch(req.body);
        res.redirect('/admin/subcategories/edit/'+id);
    } else {
        res.redirect('/')
    }
})

router.post('/del/:id', async function(req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const scid = req.body.SCID;
        const subcatory = await subcategoryModel.single2(scid);
        const cid = subcatory[0].CID;
        await subcategoryModel.del(req.body.SCID);

        res.redirect('/admin/subcategories/'+cid);
    } else {
        res.redirect('/')
    }
})
  
router.get('/del/:id', async function(req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = +req.params.id || -1;
        const rows = await subcategoryModel.single2(id);
        if(rows.length === 0) 
            res.send('Invaild parameter.');
        const cid = rows[0].CID;

        await subcategoryModel.del(req.params.id);
        res.redirect('/admin/subcategories/'+cid);
    } else {
        res.redirect('/')
    }
})

router.post('/restore/:id', async function(req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const scid = req.body.SCID;
        const subcatory = await subcategoryModel.single2(scid);
        const cid = subcatory[0].CID;
        await subcategoryModel.restore(req.body.SCID);

        res.redirect('/admin/subcategories/'+cid);
    } else {
        res.redirect('/')
    }
})
  
router.get('/restore/:id', async function(req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = +req.params.id || -1;
        const rows = await subcategoryModel.single2(id);
        if(rows.length === 0) 
            res.send('Invaild parameter.');
        const cid = rows[0].CID;

        await subcategoryModel.restore(req.params.id);
        res.redirect('/admin/subcategories/'+cid);
    } else {
        res.redirect('/')
    }
})

router.get('/delete/:id', async function (req, res) {
    if (req.isAuthenticated() && req.user.Permission === 3) {
        const id = +req.params.id || -1;
        const cid = await subcategoryModel.single2(id);
        await subcategoryModel.del2(id);
        res.redirect('/admin/subcategories/'+cid[0].CID);
    } else {
        res.redirect('/')
    }
})

module.exports = router;