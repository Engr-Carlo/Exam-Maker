const express = require('express');
const multer = require('multer');
const { generateDocxBuffer } = require('../services/examGenerator');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/export', express.json({ limit: '10mb' }), async (req, res) => {
  try {
    const { config, questions, format, signatureImage } = req.body;

    if (!config || !questions) {
      return res.status(400).json({ error: 'Missing config or questions' });
    }

    // Decode base64 signature image if provided
    let signatureImageBuffer = null;
    if (signatureImage) {
      const base64Data = signatureImage.replace(/^data:image\/\w+;base64,/, '');
      signatureImageBuffer = Buffer.from(base64Data, 'base64');
    }

    const buffer = await generateDocxBuffer({ config, questions, signatureImageBuffer });

    const filename = `${config.courseCode || 'Exam'}_${config.examType || 'Exam'}.docx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
