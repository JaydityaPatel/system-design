import { ExamQuestion } from '../data/practiceBank';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function openDarkNeonPdfReport(
  topicLabel: string,
  questions: ExamQuestion[],
  selectedAnswers: Record<string, number>,
  elapsedSec: number,
  getOptionReason: (q: ExamQuestion, optIdx: number) => string
): void {
  const correctCount = questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const passed = scorePct >= 70;

  const pagesHtml = questions
    .map((q, idx) => {
      const chosen = selectedAnswers[q.id];
      const isAnswered = chosen !== undefined;
      const isCorrect = chosen === q.correctIndex;
      const chosenLetter = isAnswered ? String.fromCharCode(65 + chosen) : '—';
      const correctLetter = String.fromCharCode(65 + q.correctIndex);
      const statusText = isCorrect ? 'CORRECT' : isAnswered ? 'INCORRECT' : 'UNANSWERED';
      const tubeColor = isCorrect ? '#7ec266' : isAnswered ? '#e86156' : '#e5a93e';

      const optionsHtml = q.options
        .map((opt, oIdx) => {
          const isPicked = chosen === oIdx;
          const showCorrect = oIdx === q.correctIndex;
          const showWrong = isPicked && !isCorrect;
          const letter = String.fromCharCode(65 + oIdx);
          const cls = showCorrect ? 'opt-correct' : showWrong ? 'opt-wrong' : 'opt-neutral';
          const tag = showCorrect ? '✓ CORRECT' : showWrong ? '✕ YOUR PICK' : 'INCORRECT';

          return `
            <div class="opt-card ${cls}">
              <div class="opt-head">
                <span><strong>${letter}.</strong> ${escapeHtml(opt)}</span>
                <span class="opt-tag">${tag}</span>
              </div>
              <div class="opt-reason">${escapeHtml(getOptionReason(q, oIdx))}</div>
            </div>
          `;
        })
        .join('');

      const wrongCallout = !isCorrect
        ? `
          <div class="callout callout-wrong">
            <div class="callout-label">${
              isAnswered ? `WHY OPTION ${chosenLetter} WAS WRONG` : 'WHY THIS WAS MISSED'
            }</div>
            <div class="callout-text">${escapeHtml(
              isAnswered
                ? getOptionReason(q, chosen)
                : `This question was left unanswered. Mastering why Option ${correctLetter} works is essential for ${q.topicLabel}.`
            )}</div>
          </div>
        `
        : '';

      const summaryBanner =
        idx === 0
          ? `
          <div class="exec-banner">
            <div>
              <div class="exec-brand">SYSTEM DESIGN · DIAGNOSTIC REPORT</div>
              <div class="exec-title">${escapeHtml(topicLabel)} (${questions.length}-Page Report)</div>
            </div>
            <div class="exec-stats">
              <span class="pill ${passed ? 'pill-green' : 'pill-amber'}">${
                passed ? 'PASSED' : 'REVIEW'
              } · ${correctCount}/${questions.length} (${scorePct}%)</span>
              <span class="pill pill-purple">TIME ${formatTimer(elapsedSec)}</span>
            </div>
          </div>
        `
          : '';

      return `
        <section class="report-page">
          ${summaryBanner}
          <div class="page-card" style="--tube:${tubeColor};">
            <div class="tubelight-bar"></div>
            <div class="page-meta">
              <div class="meta-left">
                <span class="pill pill-purple">PAGE ${idx + 1} OF ${questions.length}</span>
                <span class="topic-tag">${escapeHtml(q.topicLabel.toUpperCase())} · ${escapeHtml(
                  q.difficulty.toUpperCase()
                )}</span>
              </div>
              <span class="pill ${isCorrect ? 'pill-green' : isAnswered ? 'pill-coral' : 'pill-amber'}">${statusText}</span>
            </div>

            <h2 class="q-prompt">${escapeHtml(q.prompt)}</h2>

            <div class="compare-grid">
              <div class="compare-box ${isCorrect ? 'box-green' : 'box-coral'}">
                <div class="compare-label">YOUR ANSWER (${chosenLetter})</div>
                <div class="compare-val">${
                  isAnswered ? escapeHtml(q.options[chosen]) : 'No option selected'
                }</div>
              </div>
              <div class="compare-box box-green">
                <div class="compare-label">CORRECT ANSWER (${correctLetter})</div>
                <div class="compare-val">${escapeHtml(q.options[q.correctIndex])}</div>
              </div>
            </div>

            ${wrongCallout}

            <div class="callout callout-correct">
              <div class="callout-label">WHAT THE CORRECT ANSWER (${correctLetter}) IS &amp; WHY</div>
              <div class="callout-text">${escapeHtml(q.explanation)}</div>
            </div>

            <div class="breakdown-title">COMPLETE OPTION BREAKDOWN</div>
            <div class="options-grid">
              ${optionsHtml}
            </div>
          </div>
        </section>
      `;
    })
    .join('');

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>System Design ${questions.length}-Page Report — ${escapeHtml(topicLabel)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    @page {
      size: A4;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #141210;
      color: #efece6;
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 20;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: #1b1916;
      border-bottom: 1px solid #3d3832;
    }
    .toolbar-info {
      font-size: 12px;
      color: #a19a8d;
    }
    .print-btn {
      font-family: inherit;
      font-size: 12px;
      font-weight: 700;
      padding: 8px 16px;
      border-radius: 7px;
      border: 1px solid #43663e;
      background: #1e2d1c;
      color: #7ec266;
      cursor: pointer;
      box-shadow: 0 0 14px rgba(126, 194, 102, 0.28);
    }
    .report-page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 12mm 13mm;
      background: #141210;
      page-break-after: always;
      break-after: page;
    }
    .report-page:last-child {
      page-break-after: auto;
      break-after: auto;
    }
    .exec-banner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      margin-bottom: 10px;
      border-radius: 10px;
      background: #1b1916;
      border: 1px solid #57467a;
      box-shadow: 0 0 18px rgba(183, 159, 232, 0.18);
    }
    .exec-brand {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #7dd3fc;
      margin-bottom: 2px;
    }
    .exec-title {
      font-size: 13.5px;
      font-weight: 700;
      color: #efece6;
    }
    .exec-stats {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .page-card {
      position: relative;
      background: #1d1b18;
      border: 1px solid #3d3832;
      border-radius: 11px;
      padding: 15px 16px;
      box-shadow: 0 0 22px color-mix(in srgb, var(--tube) 18%, transparent);
    }
    .tubelight-bar {
      position: absolute;
      top: 0;
      left: 16px;
      right: 16px;
      height: 2.5px;
      border-radius: 99px;
      background: var(--tube);
      box-shadow: 0 0 12px var(--tube), 0 2px 14px var(--tube);
    }
    .page-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding-bottom: 9px;
      margin-bottom: 11px;
      border-bottom: 1px solid #2b2824;
    }
    .meta-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .topic-tag {
      font-size: 10px;
      font-weight: 700;
      color: #a19a8d;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 5px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .pill-purple { background: #251f31; border: 1px solid #57467a; color: #b79fe8; }
    .pill-green { background: #1e2d1c; border: 1px solid #43663e; color: #7ec266; }
    .pill-coral { background: #311e1d; border: 1px solid #6b3531; color: #e86156; }
    .pill-amber { background: #2e2418; border: 1px solid #664e2c; color: #e5a93e; }
    .q-prompt {
      margin: 0 0 12px;
      font-size: 13px;
      font-weight: 700;
      line-height: 1.5;
      color: #efece6;
    }
    .compare-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 9px;
      margin-bottom: 10px;
    }
    .compare-box {
      padding: 9px 11px;
      border-radius: 8px;
    }
    .box-green { background: #1e2d1c; border: 1px solid #43663e; color: #7ec266; }
    .box-coral { background: #311e1d; border: 1px solid #6b3531; color: #e86156; }
    .compare-label {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
      margin-bottom: 3px;
    }
    .compare-val {
      font-size: 10.5px;
      font-weight: 600;
      line-height: 1.4;
    }
    .callout {
      padding: 9px 11px;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .callout-wrong { background: #311e1d; border: 1px solid #6b3531; color: #f1b3ad; }
    .callout-correct { background: #1e2d1c; border: 1px solid #43663e; color: #b7e3a6; }
    .callout-label {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-bottom: 3px;
    }
    .callout-wrong .callout-label { color: #e86156; }
    .callout-correct .callout-label { color: #7ec266; }
    .callout-text {
      font-size: 10.5px;
      line-height: 1.48;
    }
    .breakdown-title {
      font-size: 9.5px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: #7dd3fc;
      margin: 4px 0 7px;
    }
    .options-grid {
      display: grid;
      gap: 7px;
    }
    .opt-card {
      padding: 8px 10px;
      border-radius: 7px;
    }
    .opt-correct { background: #1e2d1c; border: 1px solid #43663e; color: #7ec266; }
    .opt-wrong { background: #311e1d; border: 1px solid #6b3531; color: #e86156; }
    .opt-neutral { background: #191714; border: 1px solid #2f2b26; color: #efece6; }
    .opt-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 8px;
      font-size: 10.5px;
      font-weight: 600;
      margin-bottom: 3px;
    }
    .opt-tag {
      font-size: 9px;
      font-weight: 700;
      white-space: nowrap;
    }
    .opt-reason {
      font-size: 9.8px;
      line-height: 1.42;
      opacity: 0.92;
    }
    @media print {
      .toolbar { display: none !important; }
      body { background: #141210 !important; }
      .report-page { margin: 0 !important; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <div class="toolbar-info">
      Dark Neon ${questions.length}-Page PDF Report (JetBrains Mono) — Choose <strong>Save as PDF</strong> in the print dialog
    </div>
    <button class="print-btn" onclick="window.print()">Save as ${questions.length}-Page PDF</button>
  </div>
  ${pagesHtml}
  <script>
    (function() {
      var trigger = function() { setTimeout(function() { window.print(); }, 250); };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(trigger);
      } else {
        window.onload = trigger;
      }
    })();
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    // Fallback if popup is blocked: trigger current window print or alert
    window.print();
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
