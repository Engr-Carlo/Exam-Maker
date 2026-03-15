const express = require('express');
const multer = require('multer');
const { generateDocxBuffer } = require('../services/examGenerator');
const { generateFromTemplate } = require('../services/templateExporter');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/export', async (req, res) => {
  try {
    const { config, questions, format, templateFile } = req.body;

    if (!config || !questions) {
      return res.status(400).json({ error: 'Missing config or questions' });
    }

    let buffer;
    const hasQuestionImages = Array.isArray(questions) && questions.some((q) => typeof q.image === 'string' && q.image.startsWith('data:image/'));

    if (templateFile && !hasQuestionImages) {
      // Template-based export: inject questions into the uploaded template
      const base64Data = templateFile.replace(/^data:[^;]+;base64,/, '');
      const templateBuffer = Buffer.from(base64Data, 'base64');
      buffer = await generateFromTemplate(templateBuffer, questions);
    } else {
      // Default export: generate from scratch
      buffer = await generateDocxBuffer({ config, questions });
    }

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
