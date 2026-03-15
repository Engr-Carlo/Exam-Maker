const express = require('express');
const multer = require('multer');
const path = require('path');
const { parseTOS } = require('../services/tosParser');

const router = express.Router();

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `tos_${Date.now()}_${safeName}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx or .xls files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const result = parseTOS(req.file.path);
    res.json(result);
  } catch (err) {
    console.error('TOS parse error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
