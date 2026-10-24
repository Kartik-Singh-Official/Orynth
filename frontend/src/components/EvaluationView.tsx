import React, { useState, useEffect } from "react";
import { Play, Loader2, CheckCircle2, AlertTriangle, HelpCircle, FileCheck, ShieldCheck, Clock } from "lucide-react";
import { runEvaluation, type EvaluationReport } from "../api";
import { StructuredAnswerView } from "./StructuredAnswerView";

export const EvaluationView: React.FC = () => {
  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "answerable" | "refusal" | "failures">("all");

  useEffect(() => {
    let timer: any;
    if (running) {
      setElapsedSec(0);
      timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [running]);


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
    <div style={{ maxWidth: 1100, margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Title & Trigger — Apple Minimal */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1.25rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.85rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.03em",
              marginBottom: "0.5rem",
            }}
          >
            Transparent Evaluation Benchmark
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", maxWidth: 680, lineHeight: 1.6 }}>
            A fixed benchmark of 16 curated questions evaluating retrieval precision, citation authenticity, and safe refusal behavior.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunEvaluation}
          disabled={running}
          style={{
            padding: "0.55rem 1.35rem",
            borderRadius: 9999,
            background: "linear-gradient(135deg, #E4B589 0%, #D4A373 100%)",
            border: "none",
            color: "#121316",
            fontWeight: 600,
            fontSize: "0.85rem",
            cursor: running ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            boxShadow: "0 2px 10px rgba(212, 163, 115, 0.28)",
            transition: "all 0.2s var(--ease-apple)",
          }}
        >
          {running ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
          <span>{running ? `Running Concurrently... (${elapsedSec}s)` : report ? "Re-Run 16-Question Benchmark" : "Execute 16-Question Benchmark"}</span>
        </button>
      </div>

      {running && (
        <div
          className="animate-fade-in glass-panel"
          style={{
            padding: "0.85rem 1.25rem",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(212, 163, 115, 0.3)",
            backgroundColor: "rgba(212, 163, 115, 0.08)",
          }}
        >
          <Loader2 size={16} className="spin" color="var(--accent-brass)" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: "var(--text-primary)", fontSize: "0.86rem" }}>
              Running 16 evaluation questions in parallel ({elapsedSec}s)
            </strong>
            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
              Evaluating answerable and safe-refusal test cases concurrently with local CPU embeddings...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          className="animate-fade-in"
          style={{
            padding: "0.85rem 1.1rem",
            backgroundColor: "rgba(224, 122, 95, 0.12)",
            border: "1px solid rgba(224, 122, 95, 0.25)",
            borderRadius: 8,
            color: "var(--accent-terracotta)",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
          }}
        >
          {error}
        </div>
      )}


      {/* Methodology Note */}
      <div
        className="glass-panel"
        style={{
          padding: "1rem 1.35rem",
          borderRadius: 12,
          marginBottom: "1.75rem",
          fontSize: "0.82rem",
          lineHeight: 1.6,
          color: "var(--text-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--accent-brass)", fontWeight: 600, marginBottom: "0.3rem" }}>
          <HelpCircle size={14} />
          <span>Evaluation Methodology (Automated Heuristics vs. Human Verification)</span>
        </div>
        <p>
          This benchmark runs 16 realistic inquiries (10 answerable documentation questions, 6 unanswerable refusal tests). Correctness is measured using explainable keyword and refusal heuristics, combined with verifiable citation mapping.
        </p>
      </div>

      {report && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Summary Metric Cards — Apple Glass Panels */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "1rem",
            }}
          >
            <div className="glass-panel" style={{ padding: "1.25rem 1.35rem", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-muted)", fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
                <FileCheck size={14} color="var(--accent-brass)" />
                <span>RETRIEVAL HIT RATE</span>
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.4rem", letterSpacing: "-0.03em" }}>
                {(report.retrieval_hit_rate * 100).toFixed(0)}%
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                Expected supporting file present in Top-k passages
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.35rem", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-muted)", fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
                <ShieldCheck size={14} color="var(--accent-forest)" />
                <span>SAFE REFUSAL RATE</span>
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--accent-forest)", marginTop: "0.4rem", letterSpacing: "-0.03em" }}>
                {(report.refusal_accuracy_rate * 100).toFixed(0)}%
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                Unsupported questions safely declined without guessing
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.35rem", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-muted)", fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
                <CheckCircle2 size={14} color="var(--accent-brass)" />
                <span>CITATION ACCURACY</span>
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.4rem", letterSpacing: "-0.03em" }}>
                {(report.citation_accuracy_rate * 100).toFixed(0)}%
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                Citations strictly map to retrieved document chunks
              </p>
            </div>

            <div className="glass-panel" style={{ padding: "1.25rem 1.35rem", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "var(--text-muted)", fontSize: "0.74rem", fontFamily: "var(--font-mono)" }}>
                <Clock size={14} color="var(--text-secondary)" />
                <span>AVG LATENCY</span>
              </div>
              <div style={{ fontSize: "1.85rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "0.4rem", letterSpacing: "-0.03em" }}>
                {report.avg_latency_ms} ms
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>
                16 test questions evaluated across CPU embeddings
              </p>
            </div>
          </div>

          {/* Test Case Filters — Apple Segmented Control */}
          <div className="segmented-control">
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
                className={`segmented-control-btn ${filter === btn.id ? "active" : ""}`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Individual Test Case Results */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {filteredResults.map((item) => {
              const isPass = item.correctness_score >= 0.6 && item.citation_valid;
              return (
                <div
                  key={item.case_id}
                  className="glass-card"
                  style={{
                    padding: "1.25rem 1.45rem",
                    borderRadius: 12,
                    border: `1px solid ${
                      isPass ? "rgba(255, 255, 255, 0.08)" : "rgba(224, 122, 95, 0.35)"
                    }`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                      {isPass ? (
                        <CheckCircle2 size={16} color="var(--accent-forest)" />
                      ) : (
                        <AlertTriangle size={16} color="var(--accent-terracotta)" />
                      )}
                      <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {item.case_id}: {item.question}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          padding: "2px 8px",
                          borderRadius: 9999,
                          backgroundColor: item.expected_answerable ? "rgba(212, 163, 115, 0.12)" : "rgba(255, 255, 255, 0.06)",
                          color: item.expected_answerable ? "var(--accent-brass)" : "var(--text-secondary)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                        }}
                      >
                        {item.category}
                      </span>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontFamily: "var(--font-mono)",
                          padding: "2px 8px",
                          borderRadius: 9999,
                          backgroundColor: isPass ? "rgba(78, 159, 118, 0.12)" : "rgba(224, 122, 95, 0.12)",
                          color: isPass ? "var(--accent-forest)" : "var(--accent-terracotta)",
                          border: `1px solid ${isPass ? "rgba(78, 159, 118, 0.3)" : "rgba(224, 122, 95, 0.3)"}`,
                          fontWeight: 600,
                        }}
                      >
                        {isPass ? "Passed" : "Needs Review"}
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "0.75rem", fontSize: "0.86rem" }}>
                    <StructuredAnswerView content={item.actual_answer} />
                  </div>


                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.74rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                    <span>Retrieval Hit: {item.retrieval_hit ? "Yes" : "No"}</span>
                    <span>•</span>
                    <span>Citations Valid: {item.citation_valid ? "Yes" : "No"}</span>
                    <span>•</span>
                    <span>Refusal Observed: {item.actual_refusal ? "Yes" : "No"}</span>
                    <span>•</span>
                    <span>Latency: {item.latency_ms}ms</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
