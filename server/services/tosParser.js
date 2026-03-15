const XLSX = require('xlsx');

function parseTOS(filePath) {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  // Find the header row containing "TOPIC"
  let headerRowIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).trim().toUpperCase());
    if (row.includes('TOPIC')) {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find header row with "TOPIC" in the TOS file.');
  }

  const headerRow = rows[headerRowIndex].map(c => String(c).trim().toUpperCase());

  // Map column indices
  const colMap = {};
  const cogLevels = ['REMEMBERING', 'UNDERSTANDING', 'APPLYING', 'ANALYZING', 'EVALUATING', 'CREATING'];

  for (let j = 0; j < headerRow.length; j++) {
    const cell = headerRow[j];
    if (cell === 'TOPIC') colMap.topic = j;
    if (cell === 'TOTAL') colMap.total = j;
    if (cell.includes('TEACHING') || cell.includes('HOURS')) colMap.hours = j;
    if (cell.includes('COMMENT') || cell.includes('REMARK')) colMap.comments = j;

    for (const level of cogLevels) {
      if (cell.includes(level) || cell.startsWith(level.substring(0, 5))) {
        colMap[level.toLowerCase()] = j;
      }
    }
  }

  // Also check the row above headerRowIndex for merged cells (LOTS/HOTS labels)
  // And the row below for "No. of Test Items" sub-headers — skip it
  let dataStartRow = headerRowIndex + 1;
  // Skip sub-header rows like "No. of Test Items"
  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    const firstCellStr = String(row[colMap.topic] || '').trim().toLowerCase();
    if (firstCellStr.includes('no. of') || firstCellStr.includes('test items') || firstCellStr === '') {
      dataStartRow = i + 1;
    } else {
      break;
    }
  }

  // Extract metadata from rows above header
  let department = '', courseCode = '', courseTitle = '', semester = '', academicYear = '', term = '';
  for (let i = 0; i < headerRowIndex; i++) {
    const rowStr = rows[i].join(' ').trim();
    if (/department/i.test(rowStr)) {
      const match = rowStr.match(/department[:\s]*(.+?)(?:sem|$)/i);
      if (match) department = match[1].trim();
      const semMatch = rowStr.match(/(\d+)\s*(?:st|nd|rd|th)?\s*sem/i);
      if (semMatch) semester = semMatch[0].trim();
      const ayMatch = rowStr.match(/(\d{4}\s*-\s*\d{4})/);
      if (ayMatch) academicYear = ayMatch[1].trim();
    }
    if (/course\s*code/i.test(rowStr)) {
      const codeMatch = rowStr.match(/course\s*code[:\s]*(\S+)/i);
      if (codeMatch) courseCode = codeMatch[1].trim();
      const titleMatch = rowStr.match(/course\s*title[:\s]*(.+?)(?:$)/i);
      if (titleMatch) courseTitle = titleMatch[1].trim();
    }
    if (/term|quarter/i.test(rowStr)) {
      const termMatch = rowStr.match(/term[\/\s]*quarter[:\s]*(\S+)/i);
      if (termMatch) term = termMatch[1].trim();
    }
  }

  // Parse topic rows
  const topics = [];
  for (let i = dataStartRow; i < rows.length; i++) {
    const row = rows[i];
    const topicName = String(row[colMap.topic] || '').trim();

    // Stop at TOTAL row or empty
    if (topicName.toUpperCase() === 'TOTAL' || topicName === '') {
      // Check if it's really TOTAL
      if (topicName.toUpperCase() === 'TOTAL') break;
      // Skip numbered empty rows (like "5", "6", etc.)
      const firstCell = String(row[0] || '').trim();
      if (/^\d+$/.test(firstCell)) continue;
      break;
    }

    const topic = {
      name: topicName,
      remembering: parseInt(row[colMap.remembering]) || 0,
      understanding: parseInt(row[colMap.understanding]) || 0,
      applying: parseInt(row[colMap.applying]) || 0,
      analyzing: parseInt(row[colMap.analyzing]) || 0,
      evaluating: parseInt(row[colMap.evaluating]) || 0,
      creating: parseInt(row[colMap.creating]) || 0,
      total: parseInt(row[colMap.total]) || 0,
      teachingHours: parseFloat(row[colMap.hours]) || 0,
    };
    topics.push(topic);
  }

  // Compute totals
  const totals = {
    remembering: 0, understanding: 0, applying: 0,
    analyzing: 0, evaluating: 0, creating: 0, grandTotal: 0,
  };
  for (const t of topics) {
    totals.remembering += t.remembering;
    totals.understanding += t.understanding;
    totals.applying += t.applying;
    totals.analyzing += t.analyzing;
    totals.evaluating += t.evaluating;
    totals.creating += t.creating;
    totals.grandTotal += t.total;
  }

  return {
    department,
    courseCode,
    courseTitle,
    semester,
    academicYear,
    term,
    topics,
    totals,
  };
}

module.exports = { parseTOS };
