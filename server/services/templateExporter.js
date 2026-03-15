const JSZip = require('jszip');

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Build OOXML paragraphs for all questions.
 * Minimal styling — inherits whatever the template defines.
 * Only adds red color (FF0000) for correct answers.
 */
function buildQuestionsXml(questions) {
  let xml = '';
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const num = i + 1;

    // Question paragraph
    xml +=
      `<w:p><w:pPr><w:spacing w:after="40"/></w:pPr>` +
      `<w:r><w:t xml:space="preserve">${escapeXml(`${num}. ${q.questionText}`)}</w:t></w:r></w:p>`;

    // Choice paragraphs
    for (const letter of ['A', 'B', 'C', 'D']) {
      const choiceText = q[`choice${letter}`] || '';
      const isCorrect = q.correctAnswer === letter;
      const rPr = isCorrect ? '<w:rPr><w:color w:val="FF0000"/></w:rPr>' : '';

      xml +=
        `<w:p><w:pPr><w:spacing w:after="20"/><w:ind w:left="360"/></w:pPr>` +
        `<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(`${letter}) ${choiceText}`)}</w:t></w:r></w:p>`;
    }

    // Add small spacing paragraph between questions (except after last)
    if (i < questions.length - 1) {
      xml += `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr></w:p>`;
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
