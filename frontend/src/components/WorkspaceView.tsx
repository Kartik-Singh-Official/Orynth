import React, { useState, useEffect, useCallback } from "react";
import {
  Send,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  Sparkles,
  Layers,
  Terminal,
  Bookmark,
  CheckCircle2,
  Zap,
  Clock,
} from "lucide-react";
import { askQuestion, type GroundedAnswer, type RepositoryMetadata } from "../api";
import { useAuth } from "../context/AuthContext";
import { saveQuestionToDb, type SavedQuestion } from "../supabase";
import { StructuredAnswerView } from "./StructuredAnswerView";

interface WorkspaceViewProps {
  repository: RepositoryMetadata | null;
  initialQuery?: string;
  restoredQuestion?: SavedQuestion | null;
  onSelectChecklistTab: () => void;
}

const STARTER_PROMPTS = [
  "How do I set up a local development sandbox and install dependencies?",
  "What is the pull request convention and workflow for contributors?",
  "How do I run the automated test suite with pytest?",
  "Does Flask natively provide async Redis session backends?", // Verifiable Refusal Test
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  repository,
  initialQuery,
  restoredQuestion,
  onSelectChecklistTab,
}) => {
  const { user, openAuthModal, refreshSavedCounts } = useAuth();
  const [question, setQuestion] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passagesExpanded, setPassagesExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = useCallback(async (qText?: string) => {
    const q = (qText || question).trim();
    if (!q || cooldown > 0) return;
    setLoading(true);
    setError(null);
    setSaved(false);
    setSaveToast(null);

    try {
      const res = await askQuestion(q);
      setAnswer(res);
      setQuestion(q);
      // Initiate 3-second cooldown to preserve Gemini API rate limits
      setCooldown(3);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve grounded answer.");
    } finally {
      setLoading(false);
    }
  }, [question, cooldown]);

  useEffect(() => {
    if (initialQuery && initialQuery !== question) {
      setQuestion(initialQuery);
      handleSubmit(initialQuery);
    }
  }, [initialQuery, question, handleSubmit]);

  useEffect(() => {
    if (restoredQuestion) {
      setQuestion(restoredQuestion.question);
      setAnswer({
        question: restoredQuestion.question,
        answer: restoredQuestion.answer,
        citations: restoredQuestion.citations || [],
        retrieved_passages: restoredQuestion.passages || [],
        tier_applied: restoredQuestion.tier_applied || "grounded",
        is_refusal: restoredQuestion.tier_applied?.includes("refusal") || false,
        model_name: "gemma-4-26b-a4b-it",
        latency_ms: 0,
        similarity_threshold: 0.32,
      });
      setSaved(true);
    }
  }, [restoredQuestion]);

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToSupabase = async () => {
    if (!answer) return;
    if (!user) {
      openAuthModal("login");
      return;
    }
    setSaving(true);
    try {
      await saveQuestionToDb({
        repoOwner: repository?.owner || "pallets",
        repoName: repository?.repo || "flask",
        question: answer.question,
        answer: answer.answer,
        citations: answer.citations,
        passages: answer.retrieved_passages,
        tierApplied: answer.tier_applied,
        similarityScore: answer.retrieved_passages[0]?.similarity_score,
      });
      setSaved(true);
      setSaveToast("Saved to your Supabase notebook!");
      await refreshSavedCounts();
      setTimeout(() => setSaveToast(null), 3000);
    } catch (err: any) {
      setError("Failed to save question: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Intro Header — Apple Editorial Minimal */}
      <div style={{ marginBottom: "2rem" }}>
        <h1
          style={{
            fontSize: "1.85rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.03em",
            marginBottom: "0.5rem",
          }}
        >
          Ask the Field Guide
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: 720, lineHeight: 1.6 }}>
          Evidence-grounded answers derived strictly from {repository ? `${repository.owner}/${repository.repo}` : "repository"} documentation. Every claim cites authentic source lines; unsupported topics are safely refused.{" "}
          <button
            type="button"
            onClick={onSelectChecklistTab}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-brass)",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              cursor: "pointer",
              fontSize: "0.92rem",
              fontWeight: 500,
              padding: 0,
            }}
          >
            Or start with the 5-step onboarding guide →
          </button>
        </p>
      </div>

      {/* Query Composer — Apple Spotlight / Raycast Style */}
      <div
        className="glass-panel"
        style={{
          padding: "1.15rem 1.35rem",
          marginBottom: "1.75rem",
          borderRadius: 14,
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: "flex", gap: "0.85rem", alignItems: "flex-start" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              paddingTop: "0.35rem",
              color: "var(--accent-brass)",
              opacity: 0.9,
            }}
          >
            <Terminal size={19} />
          </div>

          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder="Ask anything about this repo (e.g., How do I set up my dev environment and run tests?)..."
            rows={2}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.98rem",
              lineHeight: 1.6,
              resize: "none",
              letterSpacing: "-0.01em",
            }}
          />

          <button
            type="submit"
            disabled={loading || !question.trim() || cooldown > 0}
            style={{
              padding: "0.55rem 1.25rem",
              borderRadius: 9999,
              background: cooldown > 0
                ? "rgba(255, 255, 255, 0.05)"
                : question.trim()
                ? "linear-gradient(135deg, #E4B589 0%, #D4A373 100%)"
                : "rgba(255, 255, 255, 0.08)",
              color: cooldown > 0
                ? "var(--text-muted)"
                : question.trim()
                ? "#121316"
                : "var(--text-muted)",
              border: "none",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: loading ? "wait" : cooldown > 0 ? "not-allowed" : question.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              boxShadow: question.trim() && cooldown === 0 ? "0 2px 10px rgba(212, 163, 115, 0.28)" : "none",
              transition: "all 0.2s var(--ease-apple)",
            }}
          >
            {loading ? (
              <>
                <Loader2 size={14} className="spin" />
                <span>Inquiring...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Clock size={14} />
                <span>Wait {cooldown}s</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Inquire</span>
              </>
            )}
          </button>
        </form>


        {/* Suggested Prompt Chips */}
        <div
          style={{
            marginTop: "1rem",
            paddingTop: "0.85rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.05)",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Try:
          </span>
          {STARTER_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(promptText);
                handleSubmit(promptText);
              }}
              className="glass-pill"
              style={{
                fontSize: "0.74rem",
                padding: "3px 10px",
                color: idx === 3 ? "var(--accent-terracotta)" : "var(--text-secondary)",
                cursor: "pointer",
                border: idx === 3 ? "1px solid rgba(224, 122, 95, 0.3)" : undefined,
              }}
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Save Toast Notification */}
      {saveToast && (
        <div
          className="animate-fade-in"
          style={{
            padding: "0.65rem 1rem",
            backgroundColor: "rgba(78, 159, 118, 0.12)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(78, 159, 118, 0.3)",
            borderRadius: 8,
            color: "var(--accent-forest)",
            fontSize: "0.82rem",
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <CheckCircle2 size={15} />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            padding: "1rem 1.25rem",
            backgroundColor: "rgba(224, 122, 95, 0.12)",
            border: "1px solid rgba(224, 122, 95, 0.3)",
            borderRadius: 10,
            color: "var(--text-primary)",
            fontSize: "0.86rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
          }}
        >
          <Clock size={18} style={{ flexShrink: 0, marginTop: 2, color: "var(--accent-terracotta)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--accent-terracotta)", marginBottom: "0.2rem" }}>
              {error.toLowerCase().includes("rate limit") ? "Gemini Rate Limit Protection" : "Inquiry Notice"}
            </div>
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.5 }}>{error}</div>
            {error.toLowerCase().includes("rate limit") && (
              <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                Tip: Rate limits protect the shared Google AI Studio free-tier token quota. Repeated identical queries hit the in-memory cache and consume 0 tokens.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Answer & Evidence Section */}
      {answer && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Main Answer Glass Card */}
          <div
            className="glass-panel"
            style={{
              padding: "1.5rem 1.75rem",
              borderRadius: 14,
              border: `1px solid ${
                answer.is_refusal ? "rgba(224, 122, 95, 0.4)" : "rgba(255, 255, 255, 0.1)"
              }`,
            }}
          >
            {/* Meta status bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                flexWrap: "wrap",
                gap: "0.6rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                {answer.is_refusal ? (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)",
                      padding: "2px 8px",
                      borderRadius: 9999,
                      backgroundColor: "var(--accent-terracotta-dim)",
                      color: "var(--accent-terracotta)",
                      border: "1px solid rgba(224, 122, 95, 0.35)",
                      fontWeight: 600,
                    }}
                  >
                    <ShieldAlert size={12} />
                    Verifiable Refusal Guarantee
                  </span>
                ) : (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)",
                      padding: "2px 8px",
                      borderRadius: 9999,
                      backgroundColor: "rgba(212, 163, 115, 0.15)",
                      color: "var(--accent-brass)",
                      border: "1px solid rgba(212, 163, 115, 0.35)",
                      fontWeight: 600,
                    }}
                  >
                    <Sparkles size={12} />
                    Evidence-Grounded Answer
                  </span>
                )}

                {answer.cached && (
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.72rem",
                      fontFamily: "var(--font-mono)",
                      padding: "2px 8px",
                      borderRadius: 9999,
                      backgroundColor: "rgba(78, 159, 118, 0.15)",
                      color: "var(--accent-forest)",
                      border: "1px solid rgba(78, 159, 118, 0.35)",
                      fontWeight: 600,
                    }}
                  >
                    <Zap size={11} />
                    Cached (0 Tokens Used)
                  </span>
                )}

                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {answer.model_name} • {answer.latency_ms}ms
                </span>
              </div>


              <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                {/* Save to Supabase Glass Button */}
                <button
                  type="button"
                  onClick={handleSaveToSupabase}
                  disabled={saving}
                  className="glass-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.35rem 0.8rem",
                    color: saved ? "var(--accent-forest)" : "var(--accent-brass)",
                    fontSize: "0.75rem",
                    fontWeight: 500,
                    cursor: saving ? "wait" : "pointer",
                    backgroundColor: saved ? "rgba(78, 159, 118, 0.12)" : undefined,
                    border: saved ? "1px solid rgba(78, 159, 118, 0.3)" : undefined,
                  }}
                >
                  {saving ? (
                    <Loader2 size={12} className="spin" />
                  ) : saved ? (
                    <Check size={12} />
                  ) : (
                    <Bookmark size={12} />
                  )}
                  <span>{saved ? "Saved" : "Save Question"}</span>
                </button>

                {/* Copy Answer Button */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="glass-pill"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.35rem 0.75rem",
                    color: copied ? "var(--accent-forest)" : "var(--text-secondary)",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  {copied ? <Check size={12} color="var(--accent-forest)" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Structured & Appealing Answer Content */}
            <div style={{ marginTop: "0.25rem" }}>
              <StructuredAnswerView content={answer.answer} />
            </div>


            {/* Source Citations */}
            {answer.citations.length > 0 && (
              <div
                style={{
                  marginTop: "1.5rem",
                  paddingTop: "1rem",
                  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.72rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-mono)",
                    display: "block",
                    marginBottom: "0.6rem",
                  }}
                >
                  Source Citations:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {answer.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.github_url}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-pill"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "4px 10px",
                        fontSize: "0.76rem",
                        color: "var(--accent-brass)",
                        fontFamily: "var(--font-mono)",
                        textDecoration: "none",
                      }}
                      title={c.snippet}
                    >
                      <FileText size={12} />
                      <span>
                        {c.file_path} {c.start_line ? `#L${c.start_line}-${c.end_line}` : ""}
                      </span>
                      <ExternalLink size={10} color="var(--text-muted)" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Retrieved Passages (Evidence Inspector) */}
          {answer.retrieved_passages.length > 0 && (
            <div
              className="glass-panel"
              style={{
                padding: "1rem 1.35rem",
                borderRadius: 12,
              }}
            >
              <div
                onClick={() => setPassagesExpanded(!passagesExpanded)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                  <Layers size={15} color="var(--accent-brass)" />
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                    Retrieved Passages & Cosine Similarity Inspector ({answer.retrieved_passages.length})
                  </span>
                  <span
                    style={{
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    Threshold: {answer.similarity_threshold ?? 0.32}
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  {passagesExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {passagesExpanded && (
                <div
                  className="animate-fade-in"
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {answer.retrieved_passages.map((p, idx) => {
                    const threshold = answer.similarity_threshold ?? 0.32;
                    const isAbove = p.similarity_score >= threshold;
                    return (
                      <div
                        key={idx}
                        className="glass-card"
                        style={{
                          padding: "0.85rem 1rem",
                          borderRadius: 8,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.45rem",
                            fontSize: "0.74rem",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          <span style={{ color: "var(--accent-brass)", fontWeight: 500 }}>
                            {p.chunk?.file_path || "source.md"}{" "}
                            {p.chunk?.start_line ? `#L${p.chunk.start_line}-${p.chunk.end_line}` : ""}
                          </span>
                          <span
                            style={{
                              padding: "2px 7px",
                              borderRadius: 9999,
                              backgroundColor: isAbove ? "var(--accent-forest-dim)" : "var(--accent-terracotta-dim)",
                              color: isAbove ? "var(--accent-forest)" : "var(--accent-terracotta)",
                              border: `1px solid ${isAbove ? "rgba(78, 159, 118, 0.3)" : "rgba(224, 122, 95, 0.3)"}`,
                              fontSize: "0.7rem",
                              fontWeight: 600,
                            }}
                          >
                            Cosine: {p.similarity_score.toFixed(3)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.82rem",
                            color: "var(--text-secondary)",
                            lineHeight: 1.6,
                            whiteSpace: "pre-wrap",
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {p.chunk?.content || ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
