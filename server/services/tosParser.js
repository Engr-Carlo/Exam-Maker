const XLSX = require('xlsx');

function parseSheet(sheet) {
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
}

function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].map(c => String(c).trim().toUpperCase());
    if (row.includes('TOPIC')) return i;
  }
  return -1;
}

function buildColMap(headerRow) {
  const colMap = {};
  const cogLevels = ['REMEMBERING', 'UNDERSTANDING', 'APPLYING', 'ANALYZING', 'EVALUATING', 'CREATING'];
  for (let j = 0; j < headerRow.length; j++) {
    const cell = headerRow[j];
    if (cell === 'TOPIC') colMap.topic = j;
    if (cell === 'TOTAL' || cell.includes('TOTAL') || cell.includes('NO. OF') || cell.includes('NUM OF') || cell.includes('NUMBER OF')) colMap.total = j;
    if (cell.includes('TEACHING') || cell.includes('HOURS')) colMap.hours = j;
    if (cell.includes('COMMENT') || cell.includes('REMARK')) colMap.comments = j;
    for (const level of cogLevels) {
      if (cell.includes(level) || cell.startsWith(level.substring(0, 5))) {
        colMap[level.toLowerCase()] = j;
      }
    }
  }
  return colMap;
}

function findDataStartRow(rows, headerRowIndex, colMap) {
  let startRow = headerRowIndex + 1;
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    const firstCellStr = String(row[colMap.topic] || '').trim().toLowerCase();
    if (firstCellStr.includes('no. of') || firstCellStr.includes('test items') || firstCellStr === '') {
      startRow = i + 1;
    } else {
      break;
    }
  }
  return startRow;
}

function extractMetadata(rows, headerRowIndex) {
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
  return { department, courseCode, courseTitle, semester, academicYear, term };
}

// Parse item ranges like "[1-4]" or "[12-14]" into an array of numbers
function parseItemRange(cellValue) {
  const str = String(cellValue).trim();
  if (!str || str === '0') return [];
  // Match patterns like [1-4], [5-11], etc.
  const match = str.match(/\[?\s*(\d+)\s*[-–]\s*(\d+)\s*\]?/);
  if (match) {
    const from = parseInt(match[1]);
    const to = parseInt(match[2]);
    const items = [];
    for (let n = from; n <= to; n++) items.push(n);
    return items;
  }
  // Match single number like [33] or just "33"
  const single = str.match(/\[?\s*(\d+)\s*\]?/);
  if (single) return [parseInt(single[1])];
  return [];
}

function findTosSheet(workbook) {
  // Prefer a sheet whose name contains "TOS" (case-insensitive)
  const tosName = workbook.SheetNames.find(n => n.trim().toUpperCase().includes('TOS'))
  return workbook.Sheets[tosName || workbook.SheetNames[0]]
}

function parseTOS(filePath) {
  const workbook = Buffer.isBuffer(filePath)
    ? XLSX.read(filePath, { type: 'buffer' })
    : XLSX.readFile(filePath);

  // ---- SHEET 1: Item counts ----
  const sheet1 = findTosSheet(workbook);
  const rows1 = parseSheet(sheet1);
  const headerRowIndex1 = findHeaderRow(rows1);
  if (headerRowIndex1 === -1) throw new Error('Could not find TOPIC header in TOS.');
  const headerRow1 = rows1[headerRowIndex1].map(c => String(c).trim().toUpperCase());
  const colMap1 = buildColMap(headerRow1);
  const dataStart1 = findDataStartRow(rows1, headerRowIndex1, colMap1);
  const meta = extractMetadata(rows1, headerRowIndex1);

  const topics = [];
  for (let i = dataStart1; i < rows1.length; i++) {
    const row = rows1[i];
    const topicName = String(row[colMap1.topic] || '').trim();
    if (topicName.toUpperCase() === 'TOTAL') break;
    if (!topicName || /^\d+$/.test(String(row[0] || '').trim())) continue;

    topics.push({
      name: topicName,
      remembering: parseInt(row[colMap1.remembering]) || 0,
      understanding: parseInt(row[colMap1.understanding]) || 0,
      applying: parseInt(row[colMap1.applying]) || 0,
      analyzing: parseInt(row[colMap1.analyzing]) || 0,
      evaluating: parseInt(row[colMap1.evaluating]) || 0,
      creating: parseInt(row[colMap1.creating]) || 0,
      total: parseInt(row[colMap1.total]) || 0,
      teachingHours: parseFloat(row[colMap1.hours]) || 0,
      // Will be filled from sheet 2
      itemRanges: {},
    });
  }

  // ---- SHEET 2: Item number ranges (if present) ----
  if (workbook.SheetNames.length >= 2) {
    const sheet2 = workbook.Sheets[workbook.SheetNames[1]];
    const rows2 = parseSheet(sheet2);
    const headerRowIndex2 = findHeaderRow(rows2);
    if (headerRowIndex2 !== -1) {
      const headerRow2 = rows2[headerRowIndex2].map(c => String(c).trim().toUpperCase());
      const colMap2 = buildColMap(headerRow2);
      const dataStart2 = findDataStartRow(rows2, headerRowIndex2, colMap2);

      let topicIdx = 0;
      for (let i = dataStart2; i < rows2.length && topicIdx < topics.length; i++) {
        const row = rows2[i];
        const topicName = String(row[colMap2.topic] || '').trim();
        if (topicName.toUpperCase() === 'TOTAL') break;
        if (!topicName || /^\d+$/.test(String(row[0] || '').trim())) continue;

        const cogLevels = ['remembering', 'understanding', 'applying', 'analyzing', 'evaluating', 'creating'];
        const ranges = {};
        for (const level of cogLevels) {
          if (colMap2[level] !== undefined) {
            ranges[level] = parseItemRange(row[colMap2[level]]);
          }
        }
        topics[topicIdx].itemRanges = ranges;
        topicIdx++;
      }
    }
  }

  // Build item-to-topic+level mapping from sheet 2 ranges
  const itemMapping = {};
  for (const topic of topics) {
    for (const [level, items] of Object.entries(topic.itemRanges)) {
      for (const num of items) {
        itemMapping[num] = { topic: topic.name, cognitiveLevel: level };
      }
    }
  }

  // If total column was missing/zero for a topic, fall back to sum of cognitive levels
  for (const t of topics) {
    const cogSum = t.remembering + t.understanding + t.applying + t.analyzing + t.evaluating + t.creating;
    if (t.total === 0 && cogSum > 0) {
      t.total = cogSum;
    }
  }

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
    ...meta,
    topics,
    totals,
    itemMapping,
  };
}

module.exports = { parseTOS };
