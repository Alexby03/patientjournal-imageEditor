const express = require('express');
const multer = require('multer');
const controller = require('./imageController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// upload new
router.post('/upload', upload.single('image'), controller.uploadImage);

// download
router.get('/:id', controller.getImage);

// upload edit
router.put('/:id', upload.single('image'), controller.updateImage);

module.exports = router;
