const express = require('express');
const { generateDocxBuffer } = require('../services/examGenerator');

const router = express.Router();

router.post('/export', async (req, res) => {
  try {
    const { config, questions, format } = req.body;

    if (!config || !questions) {
      return res.status(400).json({ error: 'Missing config or questions' });
    }

    const buffer = await generateDocxBuffer({ config, questions });

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
