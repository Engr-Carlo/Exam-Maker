const express = require('express');
const multer = require('multer');
const path = require('path');
const { parseTOS } = require('../services/tosParser');

const router = express.Router();

// Use memory storage — works on both local and Vercel (no writable disk on serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') cb(null, true);
    else cb(new Error('Only .xlsx or .xls files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const result = parseTOS(req.file.buffer);
    res.json(result);
  } catch (err) {
    console.error('TOS parse error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
