import React, { useState } from "react";
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
} from "lucide-react";
import { askQuestion, type GroundedAnswer, type RepositoryMetadata } from "../api";

interface WorkspaceViewProps {
  repository: RepositoryMetadata | null;
  initialQuery?: string;
  onSelectChecklistTab: () => void;
}

const STARTER_PROMPTS = [
  "How do I set up a local development sandbox and install dependencies?",
  "What is the pull request convention and workflow for contributors?",
  "How do I run the automated test suite with pytest?",
  "Does Flask natively provide async Redis session backends?", // Refusal test!
];

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({
  repository,
  initialQuery,
  onSelectChecklistTab,
}) => {
  const [question, setQuestion] = useState(initialQuery || "");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<GroundedAnswer | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [passagesExpanded, setPassagesExpanded] = useState(true);

  React.useEffect(() => {
    if (initialQuery && initialQuery !== question) {
      setQuestion(initialQuery);
      handleSubmit(initialQuery);
    }
  }, [initialQuery]);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (qText?: string) => {
    const q = (qText || question).trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const res = await askQuestion(q);
      setAnswer(res);
      setQuestion(q);
    } catch (err: any) {
      setError(err.message || "Failed to retrieve grounded answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!answer) return;
    navigator.clipboard.writeText(answer.answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Intro Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.015em",
          marginBottom: "0.4rem",
        }}>
          Ask the Field Guide
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 750 }}>
          Grounded answers derived strictly from {repository ? `${repository.owner}/${repository.repo}` : "repository"} documentation. Every answer cites source files; unsupported inquiries are safely refused.{" "}
          <button
            type="button"
            onClick={onSelectChecklistTab}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent-brass)",
              textDecoration: "underline",
              cursor: "pointer",
              fontSize: "0.88rem",
              padding: 0,
            }}
          >
            Or start with the 5-step onboarding checklist →
          </button>
        </p>
      </div>

      {/* Query Composer */}
      <div style={{
        backgroundColor: "var(--bg-surface-1)",
        border: "1px solid var(--border-hairline)",
        borderRadius: 6,
        padding: "1rem",
        marginBottom: "1.5rem",
      }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            paddingTop: "0.3rem",
            color: "var(--accent-brass)",
          }}>
            <Terminal size={18} />
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
            placeholder="Ask about setup, contribution rules, tests, pull requests... (e.g. How do I set up a local virtualenv?)"
            rows={2}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "0.95rem",
              lineHeight: 1.5,
              resize: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading || !question.trim()}
            style={{
              padding: "0.55rem 1.15rem",
              backgroundColor: "var(--accent-brass)",
              color: "var(--bg-canvas)",
              border: "1px solid var(--accent-brass)",
              borderRadius: 4,
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: loading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            Inquire
          </button>
        </form>

        {/* Starter suggestion chips */}
        <div style={{ marginTop: "0.85rem", display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
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
              style={{
                fontSize: "0.73rem",
                padding: "2px 8px",
                borderRadius: 3,
                backgroundColor: "var(--bg-surface-2)",
                border: "1px solid var(--border-hairline)",
                color: idx === 3 ? "var(--accent-terracotta)" : "var(--text-secondary)",
                cursor: "pointer",
              }}
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div style={{
          padding: "0.85rem 1rem",
          backgroundColor: "var(--accent-terracotta-dim)",
          border: "1px solid var(--accent-terracotta)",
          borderRadius: 4,
          color: "var(--accent-terracotta)",
          fontSize: "0.85rem",
          marginBottom: "1.5rem",
        }}>
          {error}
        </div>
      )}

      {/* Answer & Evidence Section */}
      {answer && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Main Answer Card */}
          <div style={{
            backgroundColor: "var(--bg-surface-1)",
            border: `1px solid ${answer.is_refusal ? "var(--accent-terracotta)" : "var(--border-hairline)"}`,
            borderRadius: 6,
            padding: "1.25rem 1.5rem",
          }}>
            {/* Meta bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem",
              paddingBottom: "0.6rem",
              borderBottom: "1px solid var(--border-hairline)",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {answer.is_refusal ? (
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-mono)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    backgroundColor: "var(--accent-terracotta-dim)",
                    color: "var(--accent-terracotta)",
                    border: "1px solid var(--accent-terracotta)",
                  }}>
                    <ShieldAlert size={12} />
                    Verifiable Refusal Guarantee
                  </span>
                ) : (
                  <span style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-mono)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    backgroundColor: "var(--accent-brass-dim)",
                    color: "var(--accent-brass)",
                    border: "1px solid var(--accent-brass)",
                  }}>
                    <Sparkles size={12} />
                    Evidence-Grounded Answer
                  </span>
                )}
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                  Model: {answer.model_name} • Latency: {answer.latency_ms}ms
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                {copied ? <Check size={13} color="var(--accent-forest)" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Answer Content */}
            <div style={{
              fontSize: "0.95rem",
              lineHeight: 1.65,
              color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}>
              {answer.answer}
            </div>

            {/* Citations list */}
            {answer.citations.length > 0 && (
              <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid var(--border-hairline)" }}>
                <span style={{
                  fontSize: "0.72rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  display: "block",
                  marginBottom: "0.5rem",
                }}>
                  Source Citations:
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {answer.citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.github_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "3px 8px",
                        borderRadius: 3,
                        backgroundColor: "var(--bg-surface-2)",
                        border: "1px solid var(--border-hairline)",
                        fontSize: "0.75rem",
                        color: "var(--accent-brass)",
                        fontFamily: "var(--font-mono)",
                        textDecoration: "none",
                      }}
                      title={c.snippet}
                    >
                      <FileText size={12} />
                      <span>{c.file_path} {c.start_line ? `#L${c.start_line}-${c.end_line}` : ""}</span>
                      <ExternalLink size={10} color="var(--text-muted)" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Retrieved Passages Drawer */}
          <div style={{
            backgroundColor: "var(--bg-surface-1)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 6,
            overflow: "hidden",
          }}>
            <button
              type="button"
              onClick={() => setPassagesExpanded(!passagesExpanded)}
              style={{
                width: "100%",
                padding: "0.75rem 1.25rem",
                backgroundColor: "var(--bg-surface-2)",
                border: "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "var(--text-primary)",
                cursor: "pointer",
                fontSize: "0.82rem",
                fontWeight: 600,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <Layers size={14} color="var(--accent-brass)" />
                <span>Retrieved Passages & Vector Relevance ({answer.retrieved_passages.length} passages evaluated)</span>
              </div>
              {passagesExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {passagesExpanded && (
              <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {answer.retrieved_passages.map((p, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "0.85rem 1rem",
                      backgroundColor: "var(--bg-surface-2)",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: 4,
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.5rem",
                      flexWrap: "wrap",
                      gap: "0.4rem",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono)",
                          color: "var(--text-muted)",
                        }}>
                          Passage #{p.rank}
                        </span>
                        <span style={{
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                        }}>
                          {p.chunk.file_path}
                        </span>
                        {p.chunk.heading && (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                            • {p.chunk.heading}
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span style={{
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono)",
                          padding: "2px 6px",
                          borderRadius: 3,
                          backgroundColor: p.similarity_score >= 0.45 ? "var(--accent-forest-dim)" : "var(--bg-surface-3)",
                          color: p.similarity_score >= 0.45 ? "var(--accent-forest)" : "var(--text-secondary)",
                          border: `1px solid ${p.similarity_score >= 0.45 ? "var(--accent-forest)" : "var(--border-hairline)"}`,
                        }}>
                          sim: {p.similarity_score.toFixed(4)}
                        </span>

                        <a
                          href={`${p.chunk.file_url}#L${p.chunk.start_line}-L${p.chunk.end_line}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.72rem",
                            color: "var(--accent-brass)",
                            textDecoration: "none",
                          }}
                        >
                          Lines {p.chunk.start_line}–{p.chunk.end_line}
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>

                    <pre style={{
                      fontSize: "0.78rem",
                      lineHeight: 1.5,
                      padding: "0.6rem 0.85rem",
                      backgroundColor: "var(--bg-canvas)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border-hairline)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}>
                      {p.chunk.content}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
