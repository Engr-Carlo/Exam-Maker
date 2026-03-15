const app = require('./app');
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Exam Maker server running on http://localhost:${PORT}`);
});
