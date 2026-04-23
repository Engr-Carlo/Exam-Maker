const JSZip = require('jszip');

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildTableXml(table) {
  if (!table || !Array.isArray(table.headers) || table.headers.length === 0) return '';
  const { headers, rows } = table;
  const allRows = [{ cells: headers, isHeader: true }, ...(rows || []).map((r) => ({ cells: r, isHeader: false }))];
  const cols = headers.length;
  const HEADER_COLOR = '2E4057';

  const tblBordersXml =
    '<w:tblBorders>' +
    '<w:top w:val="single" w:sz="4" w:color="000000"/>' +
    '<w:left w:val="single" w:sz="4" w:color="000000"/>' +
    '<w:bottom w:val="single" w:sz="4" w:color="000000"/>' +
    '<w:right w:val="single" w:sz="4" w:color="000000"/>' +
    '<w:insideH w:val="single" w:sz="4" w:color="000000"/>' +
    '<w:insideV w:val="single" w:sz="4" w:color="000000"/>' +
    '</w:tblBorders>';

  let tbl = '<w:tbl>';
  tbl += `<w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblInd w:w="432" w:type="dxa"/>${tblBordersXml}</w:tblPr>`;
  tbl += `<w:tblGrid>${Array(cols).fill('<w:gridCol/>').join('')}</w:tblGrid>`;

  for (const { cells, isHeader } of allRows) {
    tbl += '<w:tr>';
    const normalised = [...cells];
    while (normalised.length < cols) normalised.push('');
    for (const cell of normalised.slice(0, cols)) {
      const shadingXml = isHeader
        ? `<w:shd w:val="clear" w:color="auto" w:fill="${HEADER_COLOR}"/>`
        : '';
      const tcPrContent = shadingXml ? `<w:tcPr>${shadingXml}</w:tcPr>` : '';
      const rPr = isHeader
        ? `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:b/><w:color w:val="FFFFFF"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`
        : `<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:color w:val="000000"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr>`;
      const pPr = `<w:pPr><w:spacing w:before="20" w:after="20"/></w:pPr>`;
      tbl +=
        `<w:tc>${tcPrContent}` +
        `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(cell || '')}</w:t></w:r></w:p></w:tc>`;
    }
    tbl += '</w:tr>';
  }
  tbl += '</w:tbl>';
  return tbl;
}

/**
 * Build OOXML paragraphs for all questions.
 * Enforces Arial 10pt and consistent indenting regardless of template defaults.
 */
function buildQuestionsXml(questions) {
  let xml = '';
  const FONT_RPR = '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr>';
  const FONT_RPR_CORRECT = '<w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial" w:eastAsia="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/><w:color w:val="FF0000"/></w:rPr>';

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const num = i + 1;

    // Question paragraph: number hangs at margin, wrapped text aligns with choices
    xml +=
      `<w:p><w:pPr><w:spacing w:before="80" w:after="20"/><w:jc w:val="both"/><w:tabs><w:tab w:val="left" w:pos="432"/></w:tabs><w:ind w:left="432" w:hanging="432"/></w:pPr>` +
      `<w:r>${FONT_RPR}<w:t xml:space="preserve">${escapeXml(`${num}.`)}</w:t></w:r>` +
      `<w:r>${FONT_RPR}<w:tab/></w:r>` +
      `<w:r>${FONT_RPR}<w:t xml:space="preserve">${escapeXml(q.questionText || '')}</w:t></w:r></w:p>`;

    // Optional table after question text
    if (q.table) {
      xml += buildTableXml(q.table);
      xml += '<w:p><w:pPr><w:spacing w:after="40"/></w:pPr></w:p>';
    }

    // Choice paragraphs: same left indent as question text
    for (const letter of ['A', 'B', 'C', 'D']) {
      const choiceText = q[`choice${letter}`] || '';
      const isCorrect = q.correctAnswer === letter;
      const rPr = isCorrect ? FONT_RPR_CORRECT : FONT_RPR;
      const isLast = letter === 'D';

      xml +=
        `<w:p><w:pPr><w:spacing w:after="${isLast ? '240' : '0'}"/><w:jc w:val="both"/><w:ind w:left="432"/></w:pPr>` +
        `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(`${letter}) ${choiceText}`)}</w:t></w:r></w:p>`;
    }
  }
  return xml;
}

/**
 * Generate a .docx buffer by injecting questions into an uploaded template.
 * The template must contain the placeholder text {{QUESTIONS}} somewhere in the document body.
 */
async function generateFromTemplate(templateBuffer, questions) {
  const zip = await JSZip.loadAsync(templateBuffer);

  const docXmlFile = zip.file('word/document.xml');
  if (!docXmlFile) {
    throw new Error('Invalid .docx template: missing word/document.xml');
  }

  let docXml = await docXmlFile.async('string');

  // Check if placeholder exists by stripping XML tags to get plain text
  const plainText = docXml.replace(/<[^>]+>/g, '');
  if (!plainText.includes('{{QUESTIONS}}')) {
    throw new Error(
      'Template must contain the placeholder text {{QUESTIONS}} where exam items should be inserted.'
    );
  }

  // Build replacement XML
  const questionsXml = buildQuestionsXml(questions);

  // Replace the paragraph(s) containing {{QUESTIONS}} with the generated question paragraphs.
  // Word may split {{QUESTIONS}} across multiple <w:r> runs, so we check the plain text
  // of each <w:p> paragraph and replace the whole paragraph block if it matches.
  docXml = docXml.replace(
    /(<w:p\b[^>]*>)([\s\S]*?)(<\/w:p>)/g,
    (match, open, content, close) => {
      const text = (open + content + close).replace(/<[^>]+>/g, '');
      if (text.includes('{{QUESTIONS}}')) {
        return questionsXml;
      }
      return match;
    }
  );

  zip.file('word/document.xml', docXml);

  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  return buffer;
}

module.exports = { generateFromTemplate };
