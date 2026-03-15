const {
  Document, Packer, Paragraph, TextRun, ImageRun,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, Header, Footer, PageNumber, NumberFormat,
  SectionType, convertInchesToTwip, HeadingLevel,
  VerticalAlign, TableLayoutType, PageBreak,
} = require('docx');
const fs = require('fs');
const path = require('path');

const HEADER_IMAGE_PATH = path.join(__dirname, '..', 'assets', 'header.png');

function buildExamDoc({ config, questions }) {
  const headerImageBuffer = fs.existsSync(HEADER_IMAGE_PATH)
    ? fs.readFileSync(HEADER_IMAGE_PATH)
    : null;

  // -- Build header image paragraph --
  const headerParagraphs = [];
  if (headerImageBuffer) {
    headerParagraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [
          new ImageRun({
            data: headerImageBuffer,
            transformation: { width: 580, height: 80 },
            type: 'png',
          }),
        ],
      })
    );
  }

  // -- Exam type checkboxes --
  const examTypes = ['Preliminary', 'Midterm', 'Final'];
  const examTypeRuns = [];
  for (let i = 0; i < examTypes.length; i++) {
    const isChecked = config.examType === examTypes[i];
    examTypeRuns.push(
      new TextRun({
        text: isChecked ? '☑ ' : '☐ ',
        bold: true,
        size: 22,
      }),
      new TextRun({
        text: `${examTypes[i]} Examination`,
        bold: true,
        size: 22,
      })
    );
    if (i < examTypes.length - 1) {
      examTypeRuns.push(new TextRun({ text: '          ', size: 22 }));
    }
  }

  headerParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 40 },
      children: examTypeRuns,
    })
  );

  // -- Course info --
  headerParagraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 20 },
      children: [
        new TextRun({ text: `${config.courseCode || 'CPE101'} – ${config.courseTitle || 'Machine Learning'}`, bold: true, italics: true, size: 22 }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: `${config.semester || '2nd'}  Semester, AY  ${config.academicYear || '2025-2026'}`, size: 22 }),
      ],
    })
  );

  // -- Student info line --
  headerParagraphs.push(
    new Paragraph({
      spacing: { after: 40 },
      children: [
        new TextRun({ text: 'STUDENT NAME: ______________________________     ', bold: true, size: 20 }),
        new TextRun({ text: 'DATE: __________     ', bold: true, size: 20 }),
        new TextRun({ text: 'SCORE: ________', bold: true, size: 20 }),
      ],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({ text: 'YEAR AND SECTION: __________________________     ', bold: true, size: 20 }),
        new TextRun({ text: 'INSTRUCTOR: ________________________', bold: true, size: 20 }),
      ],
    })
  );

  // -- Instructions --
  const instructionsText = config.instructions ||
    'INSTRUCTIONS:\n1. Read the instructions for each type of exam carefully. you have one and a half (1.5) hours to answer this exam.\nIf you have questions, please raise them to the proctor only.\n\nMultiple Choice: Shade the circle corresponding to the letter of your answer in the test paper. Use only a black or blue ballpoint pen for shading. Refrain from using pencils and erasers, as any corrections or unshaded answers will be considered incorrect.';

  const instructionLines = instructionsText.split('\n');
  for (const line of instructionLines) {
    headerParagraphs.push(
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: line, bold: true, size: 20 }),
        ],
      })
    );
  }

  headerParagraphs.push(new Paragraph({ spacing: { after: 200 }, children: [] }));

  // -- Build question paragraphs (2-column layout via splitting into left/right) --
  const questionParagraphs = buildQuestionParagraphs(questions);

  // -- Signature footer table --
  const signatureTable = buildSignatureTable();

  // -- Assemble pages --
  // We need multi-column sections. The docx library supports columns per section.
  // Strategy: header is single-column section, questions are 2-column section, footer is single-column
  const ITEMS_PER_PAGE = 16; // approximate items per page in 2-col
  const pages = [];
  
  // Split questions into page-sized chunks
  const pageChunks = [];
  for (let i = 0; i < questions.length; i += ITEMS_PER_PAGE) {
    pageChunks.push(questions.slice(i, i + ITEMS_PER_PAGE));
  }

  for (let pageIdx = 0; pageIdx < pageChunks.length; pageIdx++) {
    const chunk = pageChunks[pageIdx];
    const startNum = pageIdx * ITEMS_PER_PAGE + 1;
    const qParagraphs = buildQuestionParagraphs(chunk, startNum);

    if (pageIdx === 0) {
      // First page: header + questions (2-col) + signature
      pages.push({
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
            },
          },
          column: {
            space: convertInchesToTwip(0.3),
            count: 1,
          },
        },
        children: [
          ...headerParagraphs,
        ],
      });

      // 2-column section for questions
      pages.push({
        properties: {
          type: SectionType.CONTINUOUS,
          column: {
            space: convertInchesToTwip(0.3),
            count: 2,
          },
        },
        children: qParagraphs,
      });

      // Back to single column for signature
      pages.push({
        properties: {
          type: SectionType.CONTINUOUS,
          column: { count: 1 },
        },
        children: [
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          signatureTable,
        ],
      });
    } else {
      // Subsequent pages: header image + 2-col questions + signature
      const pageHeader = [];
      if (headerImageBuffer) {
        pageHeader.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new ImageRun({
                data: headerImageBuffer,
                transformation: { width: 580, height: 80 },
                type: 'png',
              }),
            ],
          })
        );
      }

      pages.push({
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.5),
              bottom: convertInchesToTwip(0.5),
              left: convertInchesToTwip(0.7),
              right: convertInchesToTwip(0.7),
            },
          },
          column: { count: 1 },
        },
        children: pageHeader,
      });

      pages.push({
        properties: {
          type: SectionType.CONTINUOUS,
          column: {
            space: convertInchesToTwip(0.3),
            count: 2,
          },
        },
        children: qParagraphs,
      });

      pages.push({
        properties: {
          type: SectionType.CONTINUOUS,
          column: { count: 1 },
        },
        children: [
          new Paragraph({ spacing: { before: 200 }, children: [] }),
          signatureTable,
        ],
      });
    }
  }

  // If no questions, just show header
  if (questions.length === 0) {
    pages.push({
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(0.5),
            bottom: convertInchesToTwip(0.5),
            left: convertInchesToTwip(0.7),
            right: convertInchesToTwip(0.7),
          },
        },
      },
      children: [...headerParagraphs, signatureTable],
    });
  }

  const doc = new Document({
    sections: pages,
  });

  return doc;
}

function buildQuestionParagraphs(questions, startNum = 1) {
  const paragraphs = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const num = startNum + i;
    const choices = ['A', 'B', 'C', 'D'];

    // Question text
    paragraphs.push(
      new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${num}. `, bold: false, size: 20 }),
          new TextRun({ text: q.questionText, size: 20 }),
        ],
      })
    );

    // Choices
    for (let c = 0; c < choices.length; c++) {
      const letter = choices[c];
      const choiceText = q[`choice${letter}`] || '';
      const isCorrect = q.correctAnswer === letter;

      paragraphs.push(
        new Paragraph({
          spacing: { after: 20 },
          indent: { left: convertInchesToTwip(0.25) },
          children: [
            new TextRun({
              text: `${letter}) ${choiceText}`,
              size: 20,
              color: isCorrect ? 'FF0000' : '000000',
            }),
          ],
        })
      );
    }
  }

  return paragraphs;
}

function buildSignatureTable() {
  const roles = [
    { label: 'Prepared by:', title: 'Faculty' },
    { label: 'Reviewed by:', title: 'Department Chair' },
    { label: 'Checked by:', title: 'College Dean' },
    { label: 'Approved by:', title: 'Vice President for\nAcademics and Student\nServices' },
  ];

  const noBorder = {
    top: { style: BorderStyle.SINGLE, size: 1 },
    bottom: { style: BorderStyle.SINGLE, size: 1 },
    left: { style: BorderStyle.SINGLE, size: 1 },
    right: { style: BorderStyle.SINGLE, size: 1 },
  };

  // Row 1: Labels
  const row1 = new TableRow({
    children: roles.map(r =>
      new TableCell({
        borders: noBorder,
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            spacing: { after: 20 },
            children: [new TextRun({ text: r.label, size: 18 })],
          }),
        ],
      })
    ),
  });

  // Row 2: Signature lines
  const row2 = new TableRow({
    children: roles.map(r =>
      new TableCell({
        borders: noBorder,
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({ spacing: { before: 400 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 20 },
            children: [
              new TextRun({ text: 'Signature over Printed Name', bold: true, size: 18 }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: r.title, italics: true, size: 18 }),
            ],
          }),
        ],
      })
    ),
  });

  // Row 3: Date
  const row3 = new TableRow({
    children: roles.map(() =>
      new TableCell({
        borders: noBorder,
        width: { size: 25, type: WidthType.PERCENTAGE },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Date:', size: 18 })],
          }),
        ],
      })
    ),
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    rows: [row1, row2, row3],
  });
}

async function generateDocxBuffer(examData) {
  const doc = buildExamDoc(examData);
  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

module.exports = { generateDocxBuffer };
