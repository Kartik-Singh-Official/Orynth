import React, { useState } from "react";
import { Play, Loader2, CheckCircle2, AlertTriangle, HelpCircle, FileCheck, ShieldCheck, Clock } from "lucide-react";
import { runEvaluation, type EvaluationReport } from "../api";

export const EvaluationView: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "answerable" | "refusal" | "failures">("all");

  const handleRunEvaluation = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await runEvaluation();
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Evaluation benchmark failed.");
    } finally {
      setRunning(false);
    }
  };

  const filteredResults = report?.results.filter((res) => {
    if (filter === "answerable") return res.expected_answerable;
    if (filter === "refusal") return !res.expected_answerable;
    if (filter === "failures") return res.correctness_score < 0.6 || !res.citation_valid;
    return true;
  }) || [];

  return (
    <div style={{ maxWidth: 1200, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Title & Trigger */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "1.75rem",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        <div>
          <h1 style={{
            fontSize: "1.6rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            letterSpacing: "-0.015em",
            marginBottom: "0.3rem",
          }}>
            Transparent Evaluation Benchmark
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", maxWidth: 700 }}>
            A fixed benchmark of 16 curated questions evaluating retrieval precision, citation authenticity, and safe refusal behavior.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunEvaluation}
          disabled={running}
          style={{
            padding: "0.6rem 1.25rem",
            backgroundColor: "var(--accent-brass)",
            border: "1px solid var(--accent-brass)",
            color: "var(--bg-canvas)",
            borderRadius: 4,
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: running ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
          }}
        >
          {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
          {report ? "Re-Run 16-Question Benchmark" : "Execute 16-Question Benchmark"}
        </button>
      </div>

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

      {/* Disclaimers & Methodology Note */}
      <div style={{
        padding: "0.85rem 1.1rem",
        backgroundColor: "var(--bg-surface-1)",
        border: "1px solid var(--border-hairline)",
        borderRadius: 6,
        marginBottom: "1.5rem",
        fontSize: "0.8rem",
        lineHeight: 1.5,
        color: "var(--text-secondary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent-brass)", fontWeight: 600, marginBottom: "0.25rem" }}>
          <HelpCircle size={14} />
          <span>Evaluation Methodology (Automated Heuristics vs. Human Verification)</span>
        </div>
        <p>
          This evaluation benchmark runs 16 realistic inquiries (10 answerable documentation questions, 6 unanswerable refusal tests). Correctness is measured using explainable keyword and refusal heuristics, combined with verifiable citation mapping. It is not an approximate synthetic LLM judge score.
        </p>
      </div>

      {report && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Summary Metric Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
          }}>
            <div style={{
              padding: "1.1rem",
              backgroundColor: "var(--bg-surface-1)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                <FileCheck size={14} color="var(--accent-brass)" />
                <span>RETRIEVAL HIT RATE</span>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.3rem" }}>
                {(report.retrieval_hit_rate * 100).toFixed(0)}%
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Expected supporting file present in Top-k passages
              </p>
            </div>

            <div style={{
              padding: "1.1rem",
              backgroundColor: "var(--bg-surface-1)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                <ShieldCheck size={14} color="var(--accent-forest)" />
                <span>SAFE REFUSAL RATE</span>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--accent-forest)", marginTop: "0.3rem" }}>
                {(report.refusal_accuracy_rate * 100).toFixed(0)}%
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Unsupported questions safely declined without guessing
              </p>
            </div>

            <div style={{
              padding: "1.1rem",
              backgroundColor: "var(--bg-surface-1)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                <CheckCircle2 size={14} color="var(--accent-brass)" />
                <span>CITATION ACCURACY</span>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.3rem" }}>
                {(report.citation_accuracy_rate * 100).toFixed(0)}%
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                Citations strictly map to retrieved document chunks
              </p>
            </div>

            <div style={{
              padding: "1.1rem",
              backgroundColor: "var(--bg-surface-1)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 6,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--text-muted)", fontSize: "0.75rem", fontFamily: "var(--font-mono)" }}>
                <Clock size={14} color="var(--text-secondary)" />
                <span>AVG RESPONSE LATENCY</span>
              </div>
              <div style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.3rem" }}>
                {report.avg_latency_ms} ms
              </div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                16 test questions evaluated across CPU embeddings
              </p>
            </div>
          </div>

          {/* Test Case Filters */}
          <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
            {[
              { id: "all", label: `All Inquiries (${report.total_questions})` },
              { id: "answerable", label: `Answerable (${report.answerable_count})` },
              { id: "refusal", label: `Refusal Tests (${report.unanswerable_count})` },
              { id: "failures", label: `Diagnostic Cases (${report.failure_cases.length})` },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFilter(btn.id as any)}
                style={{
                  padding: "0.35rem 0.75rem",
                  fontSize: "0.78rem",
                  borderRadius: 3,
                  cursor: "pointer",
                  backgroundColor: filter === btn.id ? "var(--accent-brass)" : "var(--bg-surface-1)",
                  color: filter === btn.id ? "var(--bg-canvas)" : "var(--text-secondary)",
                  border: filter === btn.id ? "1px solid var(--accent-brass)" : "1px solid var(--border-hairline)",
                  fontWeight: filter === btn.id ? 600 : 400,
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Individual Test Case Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {filteredResults.map((item) => {
              const isPass = item.correctness_score >= 0.6 && item.citation_valid;
              return (
                <div
                  key={item.case_id}
                  style={{
                    backgroundColor: "var(--bg-surface-1)",
                    border: `1px solid ${isPass ? "var(--border-hairline)" : "rgba(224, 122, 95, 0.4)"}`,
                    borderRadius: 6,
                    padding: "1rem 1.25rem",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {isPass ? (
                        <CheckCircle2 size={16} color="var(--accent-forest)" />
                      ) : (
                        <AlertTriangle size={16} color="var(--accent-terracotta)" />
                      )}
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        [{item.case_id}]
                      </span>
                      <span style={{ fontSize: "0.75rem", padding: "1px 5px", borderRadius: 3, backgroundColor: "var(--bg-surface-2)", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                        {item.category}
                      </span>
                      <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.question}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {item.latency_ms} ms
                      </span>
                      <span style={{
                        fontSize: "0.75rem",
                        fontFamily: "var(--font-mono)",
                        padding: "2px 6px",
                        borderRadius: 3,
                        backgroundColor: isPass ? "var(--accent-forest-dim)" : "var(--accent-terracotta-dim)",
                        color: isPass ? "var(--accent-forest)" : "var(--accent-terracotta)",
                        border: `1px solid ${isPass ? "var(--accent-forest)" : "var(--accent-terracotta)"}`,
                      }}>
                        Score: {(item.correctness_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.5, marginTop: "0.4rem" }}>
                    <strong>Response:</strong> {item.actual_answer}
                  </p>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1rem",
                    marginTop: "0.6rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid var(--border-hairline)",
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    flexWrap: "wrap",
                  }}>
                    <span>Expected Answerable: <strong>{item.expected_answerable ? "Yes" : "No (Refusal)"}</strong></span>
                    <span>Actual Refusal: <strong>{item.actual_refusal ? "Yes" : "No"}</strong></span>
                    <span>Citations Valid: <strong>{item.citation_valid ? "Yes" : "No"}</strong></span>
                    {item.retrieved_files.length > 0 && (
                      <span>Retrieved Sources: <code style={{ fontSize: "0.72rem" }}>{item.retrieved_files.join(", ")}</code></span>
                    )}
                  </div>

                  {item.failure_notes && (
                    <div style={{
                      marginTop: "0.5rem",
                      padding: "0.4rem 0.75rem",
                      backgroundColor: "var(--accent-terracotta-dim)",
                      borderRadius: 3,
                      fontSize: "0.75rem",
                      color: "var(--accent-terracotta)",
                    }}>
                      <strong>Diagnostic Note:</strong> {item.failure_notes}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
