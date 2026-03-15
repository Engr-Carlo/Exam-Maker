const express = require('express');
const cors = require('cors');
const path = require('path');
const tosRoutes = require('./routes/tos');
const examRoutes = require('./routes/exam');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/api/tos', tosRoutes);
app.use('/api/exam', examRoutes);

app.listen(PORT, () => {
  console.log(`Exam Maker server running on http://localhost:${PORT}`);
});
