import React, { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Flag,
  Layers,
  Shuffle,
  XCircle,
} from 'lucide-react';
import {
  EXAM_QUESTION_BANK,
  ExamQuestion,
  PRACTICE_TOPICS,
  generateExamQuestions,
} from '../../data/practiceBank';
import { openDarkNeonPdfReport } from '../../utils/pdfReport';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getOptionReason(q: ExamQuestion, optIdx: number): string {
  if (q.optionReasons && q.optionReasons[optIdx]) {
    return q.optionReasons[optIdx];
  }
  const letter = String.fromCharCode(65 + optIdx);
  if (optIdx === q.correctIndex) {
    return `Correct (${letter}): ${q.explanation}`;
  }
  return `Incorrect (${letter}): "${q.options[optIdx]}" does not satisfy the system design trade-off here. ${q.explanation}`;
}

function buildMarkdownReport(
  topicLabel: string,
  questions: ExamQuestion[],
  selectedAnswers: Record<string, number>,
  elapsedSec: number
): string {
  const correctCount = questions.filter((q) => selectedAnswers[q.id] === q.correctIndex).length;
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  const lines: string[] = [
    `# System Design ${questions.length}-Page Diagnostic Exam Report`,
    ``,
    `- **Topic:** ${topicLabel}`,
    `- **Score:** ${correctCount} / ${questions.length} (${pct}%)`,
    `- **Time Taken:** ${formatTimer(elapsedSec)}`,
    `- **Status:** ${pct >= 70 ? 'PASSED' : 'REVIEW RECOMMENDED'}`,
    ``,
    `---`,
    ``,
  ];

  questions.forEach((q, idx) => {
    const chosen = selectedAnswers[q.id];
    const isAnswered = chosen !== undefined;
    const isCorrect = chosen === q.correctIndex;
    const status = isCorrect ? 'CORRECT' : isAnswered ? 'INCORRECT' : 'UNANSWERED';

    lines.push(`## Page ${idx + 1} of ${questions.length} — [${status}] ${q.topicLabel} (${q.difficulty})`);
    lines.push(``);
    lines.push(`**Question:** ${q.prompt}`);
    lines.push(``);
    lines.push(
      `- **Your Answer:** ${
        isAnswered ? `${String.fromCharCode(65 + chosen)}. ${q.options[chosen]}` : 'Not answered'
      }`
    );
    lines.push(
      `- **Correct Answer:** ${String.fromCharCode(65 + q.correctIndex)}. ${q.options[q.correctIndex]}`
    );
    lines.push(``);
    if (!isCorrect) {
      lines.push(
        `### Why Your Answer Was Wrong`,
        isAnswered
          ? getOptionReason(q, chosen)
          : `You left this question unanswered. ${q.explanation}`,
        ``
      );
    }
    lines.push(`### What the Correct Answer Is & Why`, q.explanation, ``);
    lines.push(`### Option-by-Option Breakdown`);
    q.options.forEach((opt, oIdx) => {
      const tag = oIdx === q.correctIndex ? 'CORRECT' : oIdx === chosen ? 'YOUR WRONG PICK' : 'INCORRECT';
      lines.push(`- **${String.fromCharCode(65 + oIdx)}. [${tag}]** ${opt} — ${getOptionReason(q, oIdx)}`);
    });
    lines.push(``, `---`, ``);
  });

  return lines.join('\n');
}

export const PracticeView: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('latency-throughput');
  const [questions, setQuestions] = useState<ExamQuestion[]>(() =>
    generateExamQuestions('latency-throughput', 10)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  // 10-page diagnostic report state
  const [reportPageIdx, setReportPageIdx] = useState(0);
  const [showAllReportPages, setShowAllReportPages] = useState(false);

  useEffect(() => {
    if (isSubmitted) return;
    const id = window.setInterval(() => {
      setElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [isSubmitted]);

  const startNewExam = (topicId: string) => {
    setSelectedTopicId(topicId);
    setQuestions(generateExamQuestions(topicId, 10));
    setCurrentIdx(0);
    setSelectedAnswers({});
    setFlaggedIds({});
    setIsSubmitted(false);
    setElapsedSec(0);
    setReportPageIdx(0);
    setShowAllReportPages(false);
  };

  const handleSubmitExam = () => {
    setIsSubmitted(true);
    setReportPageIdx(0);
  };

  const activeTopic =
    PRACTICE_TOPICS.find((t) => t.id === selectedTopicId) ?? PRACTICE_TOPICS[0];
  const currentQ = questions[currentIdx];
  const answeredCount = questions.filter((q) => selectedAnswers[q.id] !== undefined).length;
  const correctCount = questions.filter(
    (q) => selectedAnswers[q.id] === q.correctIndex
  ).length;
  const scorePct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleDownloadReport = () => {
    const md = buildMarkdownReport(activeTopic.label, questions, selectedAnswers, elapsedSec);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-design-report-${selectedTopicId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderReportPage = (q: ExamQuestion, pageIdx: number) => {
    const chosen = selectedAnswers[q.id];
    const isAnswered = chosen !== undefined;
    const isCorrect = chosen === q.correctIndex;
    const chosenLetter = isAnswered ? String.fromCharCode(65 + chosen) : '—';
    const correctLetter = String.fromCharCode(65 + q.correctIndex);

    return (
      <div key={q.id} className="view-card" style={{ padding: '18px 20px' }}>
        {/* Report Page Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            paddingBottom: 10,
            marginBottom: 12,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="meta-badge purple">
              <FileText size={12} />
              PAGE {pageIdx + 1} OF {questions.length}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
              {q.topicLabel.toUpperCase()} · {q.difficulty.toUpperCase()}
            </span>
          </div>
          <span className={`meta-badge ${isCorrect ? 'green' : 'amber'}`}>
            {isCorrect ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
            {isCorrect ? 'CORRECT' : isAnswered ? 'INCORRECT' : 'UNANSWERED'}
          </span>
        </div>

        {/* Question */}
        <p style={{ margin: '0 0 14px', fontSize: 14.5, fontWeight: 700, lineHeight: 1.55 }}>
          {q.prompt}
        </p>

        {/* Side-by-Side: Your Answer vs Correct Answer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: isCorrect
                ? '1px solid var(--green-border)'
                : '1px solid var(--coral-border)',
              backgroundColor: isCorrect ? 'var(--green-bg)' : 'var(--coral-bg)',
              color: isCorrect ? 'var(--green-text)' : 'var(--coral-text)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
              YOUR ANSWER ({chosenLetter})
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>
              {isAnswered ? q.options[chosen] : 'No option selected'}
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid var(--green-border)',
              backgroundColor: 'var(--green-bg)',
              color: 'var(--green-text)',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 4 }}>
              CORRECT ANSWER ({correctLetter})
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.45 }}>
              {q.options[q.correctIndex]}
            </div>
          </div>
        </div>

        {/* Why Your Answer Was Wrong (if wrong or unanswered) */}
        {!isCorrect && (
          <div
            className="callout-box"
            style={{
              marginBottom: 12,
              backgroundColor: 'var(--coral-bg)',
              borderColor: 'var(--coral-border)',
              color: 'var(--coral-text)',
            }}
          >
            <div>
              <span className="callout-title" style={{ color: 'var(--coral-text)' }}>
                {isAnswered ? `WHY OPTION ${chosenLetter} WAS WRONG` : 'WHY THIS WAS MISSED'}
              </span>
              <span>
                {isAnswered
                  ? getOptionReason(q, chosen)
                  : `This question was left blank. Understanding why Option ${correctLetter} is correct is key to mastering ${q.topicLabel}.`}
              </span>
            </div>
          </div>
        )}

        {/* What the Correct Answer Is & Why */}
        <div
          className="callout-box"
          style={{
            marginBottom: 14,
            backgroundColor: 'var(--green-bg)',
            borderColor: 'var(--green-border)',
            color: 'var(--green-text)',
          }}
        >
          <div>
            <span className="callout-title" style={{ color: 'var(--green-text)' }}>
              WHAT THE CORRECT ANSWER ({correctLetter}) IS &amp; WHY
            </span>
            <span>{q.explanation}</span>
          </div>
        </div>

        {/* Full A / B / C / D Option-by-Option Breakdown */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
          COMPLETE OPTION BREAKDOWN
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {q.options.map((opt, oIdx) => {
            const isPicked = chosen === oIdx;
            const showCorrect = oIdx === q.correctIndex;
            const showWrong = isPicked && !isCorrect;
            const letter = String.fromCharCode(65 + oIdx);

            return (
              <div
                key={oIdx}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  fontSize: 12,
                  border: showCorrect
                    ? '1px solid var(--green-border)'
                    : showWrong
                    ? '1px solid var(--coral-border)'
                    : '1px solid var(--border-strong)',
                  backgroundColor: showCorrect
                    ? 'var(--green-bg)'
                    : showWrong
                    ? 'var(--coral-bg)'
                    : 'var(--bg-inset)',
                  color: showCorrect
                    ? 'var(--green-text)'
                    : showWrong
                    ? 'var(--coral-text)'
                    : 'var(--text-primary)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  <span>
                    <strong>{letter}.</strong> {opt}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {showCorrect ? '✓ CORRECT' : showWrong ? '✕ YOUR PICK' : 'INCORRECT'}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, opacity: 0.9, lineHeight: 1.45 }}>
                  {getOptionReason(q, oIdx)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="secondary-view">
      <div className="view-container">
        {/* Top Exam Header + Controls */}
        <div
          className="view-card"
          style={{
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
                System Design MCQ Exam
              </h1>
              <span className="meta-badge purple">
                {EXAM_QUESTION_BANK.length} Question Bank
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
              {activeTopic.description} Questions &amp; options reshuffle on every refresh.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="meta-badge amber">
              <Clock size={13} />
              {formatTimer(elapsedSec)}
            </span>
            {isSubmitted ? (
              <span className={`meta-badge ${scorePct >= 70 ? 'green' : 'amber'}`}>
                <Award size={13} />
                {correctCount}/{questions.length} ({scorePct}%)
              </span>
            ) : (
              <span className="meta-badge green">
                {answeredCount}/{questions.length} Answered
              </span>
            )}
            <button
              type="button"
              className="tactile-btn"
              onClick={() => startNewExam(selectedTopicId)}
              title="Draw a fresh set of randomized questions"
            >
              <Shuffle size={13} />
              <span>New Shuffled Exam</span>
            </button>
          </div>
        </div>

        {/* Topic Selector Pills */}
        <div
          className="view-card"
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
          }}
        >
          {PRACTICE_TOPICS.map((topic) => {
            const bankCount =
              topic.id === 'all'
                ? EXAM_QUESTION_BANK.length
                : EXAM_QUESTION_BANK.filter((q) => q.topicId === topic.id).length;
            const active = topic.id === selectedTopicId;
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => startNewExam(topic.id)}
                style={{
                  padding: '6px 11px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: active ? 700 : 500,
                  border: active
                    ? '1px solid var(--green-border)'
                    : '1px solid var(--border-strong)',
                  backgroundColor: active ? 'var(--green-bg)' : 'var(--bg-inset)',
                  color: active ? 'var(--green-text)' : 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <span>{topic.label}</span>
                <span style={{ opacity: 0.75, fontSize: 10.5 }}>({bankCount})</span>
              </button>
            );
          })}
        </div>

        {/* Active Exam Mode vs Submitted 10-Page Diagnostic Report */}
        {!isSubmitted && currentQ ? (
          <div style={{ display: 'grid', gap: 14 }}>
            {/* Question Navigator Bar */}
            <div
              className="view-card"
              style={{
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {questions.map((q, idx) => {
                  const isCurr = idx === currentIdx;
                  const isAns = selectedAnswers[q.id] !== undefined;
                  const isFlag = !!flaggedIds[q.id];
                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: isCurr
                          ? '2px solid var(--accent-purple)'
                          : isFlag
                          ? '1px solid var(--amber-border)'
                          : isAns
                          ? '1px solid var(--green-border)'
                          : '1px solid var(--border-strong)',
                        backgroundColor: isCurr
                          ? 'var(--callout-bg)'
                          : isAns
                          ? 'var(--green-bg)'
                          : 'var(--bg-inset)',
                        color: isCurr
                          ? 'var(--callout-title)'
                          : isAns
                          ? 'var(--green-text)'
                          : 'var(--text-secondary)',
                      }}
                      title={`Question ${idx + 1}${isFlag ? ' (Flagged)' : ''}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="tactile-btn primary"
                onClick={handleSubmitExam}
              >
                <CheckCircle2 size={13} />
                <span>
                  Submit &amp; Generate {questions.length}-Page Report ({answeredCount}/
                  {questions.length})
                </span>
              </button>
            </div>

            {/* Active Question Card */}
            <div className="view-card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  fontSize: 11,
                  gap: 8,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>
                  QUESTION {currentIdx + 1} OF {questions.length} ·{' '}
                  {currentQ.topicLabel.toUpperCase()}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="tactile-btn"
                    onClick={() => toggleFlag(currentQ.id)}
                    style={{
                      padding: '4px 9px',
                      fontSize: 11,
                      color: flaggedIds[currentQ.id] ? 'var(--amber-text)' : undefined,
                      borderColor: flaggedIds[currentQ.id] ? 'var(--amber-border)' : undefined,
                    }}
                  >
                    <Flag size={12} />
                    <span>{flaggedIds[currentQ.id] ? 'Flagged' : 'Flag'}</span>
                  </button>
                  <span className="meta-badge purple">{currentQ.difficulty}</span>
                </div>
              </div>

              <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, lineHeight: 1.55 }}>
                {currentQ.prompt}
              </p>

              <div style={{ display: 'grid', gap: 8 }}>
                {currentQ.options.map((opt, oIdx) => {
                  const isPicked = selectedAnswers[currentQ.id] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() =>
                        setSelectedAnswers((prev) => ({ ...prev, [currentQ.id]: oIdx }))
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        padding: '10px 13px',
                        borderRadius: 8,
                        textAlign: 'left',
                        fontSize: 12.5,
                        cursor: 'pointer',
                        border: isPicked
                          ? '1.5px solid var(--green-border)'
                          : '1px solid var(--border-strong)',
                        backgroundColor: isPicked ? 'var(--green-bg)' : 'var(--bg-inset)',
                        color: isPicked ? 'var(--green-text)' : 'var(--text-primary)',
                      }}
                    >
                      <span>
                        <strong>{String.fromCharCode(65 + oIdx)}.</strong> {opt}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 16,
                  paddingTop: 12,
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <button
                  type="button"
                  className="tactile-btn"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    className="tactile-btn primary"
                    onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                  >
                    <span>Next Question</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tactile-btn primary"
                    onClick={handleSubmitExam}
                  >
                    <CheckCircle2 size={14} />
                    <span>Finish &amp; Generate {questions.length}-Page Report</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Submitted 10-Page Diagnostic Report */
          <div style={{ display: 'grid', gap: 14 }}>
            {/* Executive Summary Banner */}
            <div
              className="view-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 14,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
                    {questions.length}-Page Diagnostic Report — {activeTopic.label}
                  </h2>
                  <span className={`meta-badge ${scorePct >= 70 ? 'green' : 'amber'}`}>
                    {scorePct >= 70 ? 'PASSED' : 'REVIEW RECOMMENDED'}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
                  Scored {correctCount} / {questions.length} ({scorePct}%) in{' '}
                  {formatTimer(elapsedSec)}. Each page below explains why wrong options fail and why
                  the correct answer works.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="tactile-btn"
                  onClick={() => setShowAllReportPages((v) => !v)}
                >
                  {showAllReportPages ? <BookOpen size={13} /> : <Layers size={13} />}
                  <span>
                    {showAllReportPages
                      ? '1-Page-at-a-Time View'
                      : `View All ${questions.length} Pages`}
                  </span>
                </button>
                <button
                  type="button"
                  className="tactile-btn"
                  onClick={() =>
                    openDarkNeonPdfReport(
                      activeTopic.label,
                      questions,
                      selectedAnswers,
                      elapsedSec,
                      getOptionReason
                    )
                  }
                >
                  <FileText size={13} />
                  <span>Export {questions.length}-Page PDF (Dark Neon)</span>
                </button>
                <button type="button" className="tactile-btn" onClick={handleDownloadReport}>
                  <Download size={13} />
                  <span>Download Report (.md)</span>
                  <span>Download (.md)</span>
                </button>
                <button
                  type="button"
                  className="tactile-btn primary"
                  onClick={() => startNewExam(selectedTopicId)}
                >
                  <Shuffle size={13} />
                  <span>New Shuffled Exam</span>
                </button>
              </div>
            </div>

            {/* Report Page Navigator (when in 1-page-at-a-time mode) */}
            {!showAllReportPages && (
              <div
                className="view-card"
                style={{
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {questions.map((q, idx) => {
                    const chosen = selectedAnswers[q.id];
                    const isCurr = idx === reportPageIdx;
                    const isCorr = chosen === q.correctIndex;
                    const isWrong = chosen !== undefined && !isCorr;
                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setReportPageIdx(idx)}
                        style={{
                          padding: '5px 9px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: isCurr
                            ? '2px solid var(--accent-purple)'
                            : isCorr
                            ? '1px solid var(--green-border)'
                            : isWrong
                            ? '1px solid var(--coral-border)'
                            : '1px solid var(--amber-border)',
                          backgroundColor: isCorr
                            ? 'var(--green-bg)'
                            : isWrong
                            ? 'var(--coral-bg)'
                            : 'var(--amber-bg)',
                          color: isCorr
                            ? 'var(--green-text)'
                            : isWrong
                            ? 'var(--coral-text)'
                            : 'var(--amber-text)',
                        }}
                      >
                        P{idx + 1}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className="tactile-btn"
                    disabled={reportPageIdx === 0}
                    onClick={() => setReportPageIdx((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={13} />
                    <span>Prev Page</span>
                  </button>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Page {reportPageIdx + 1} / {questions.length}
                  </span>
                  <button
                    type="button"
                    className="tactile-btn"
                    disabled={reportPageIdx === questions.length - 1}
                    onClick={() =>
                      setReportPageIdx((p) => Math.min(questions.length - 1, p + 1))
                    }
                  >
                    <span>Next Page</span>
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}

            {/* Render either the active Report Page or all 10 Pages */}
            {showAllReportPages
              ? questions.map((q, idx) => renderReportPage(q, idx))
              : questions[reportPageIdx] && renderReportPage(questions[reportPageIdx], reportPageIdx)}
          </div>
        )}
      </div>
    </div>
  );
};
