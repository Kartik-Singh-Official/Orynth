import React, { useEffect, useState, useCallback } from "react";
import {
  ExternalLink,
  ArrowRight,
  Loader2,
  Sparkles,
  Bookmark,
  CheckCircle2,
  Check,
} from "lucide-react";
import { fetchChecklist, type OnboardingChecklist } from "../api";
import { useAuth } from "../context/AuthContext";
import { saveChecklistToDb } from "../supabase";

interface ChecklistViewProps {
  onAskAboutStep: (query: string) => void;
}

export const ChecklistView: React.FC<ChecklistViewProps> = ({ onAskAboutStep }) => {
  const { user, openAuthModal, refreshSavedCounts } = useAuth();
  const [checklist, setChecklist] = useState<OnboardingChecklist | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [savedChecklist, setSavedChecklist] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadChecklist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchChecklist();
      setChecklist(data);
    } catch (err: any) {
      setError(err.message || "Failed to load onboarding checklist.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  const toggleStepCompleted = (stepNumber: number) => {
    const id = String(stepNumber);
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSaveChecklist = async () => {
    if (!checklist) return;
    if (!user) {
      openAuthModal("login");
      return;
    }
    setSavingChecklist(true);
    try {
      const parts = checklist.repository.split("/");
      const repoOwner = parts[0] || "pallets";
      const repoName = parts[1] || "flask";

      await saveChecklistToDb({
        repoOwner,
        repoName,
        title: `Contributor Checklist for ${checklist.repository}`,
        steps: checklist.steps,
        completedStepIds: completedSteps,
        totalSteps: checklist.total_steps,
        coveredSteps: checklist.covered_steps,
      });

      setSavedChecklist(true);
      setToastMsg("Checklist saved to your Supabase account!");
      await refreshSavedCounts();
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err: any) {
      setError("Failed to save checklist: " + err.message);
    } finally {
      setSavingChecklist(false);
    }
  };

  return (
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
          <Sparkles size={18} color="var(--accent-brass)" />
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.015em",
            }}
          >
            Where Do I Start?
          </h1>
        </div>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          An ordered 5-step contributor onboarding path derived strictly from the indexed repository documentation.
        </p>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "2rem 0", color: "var(--text-muted)" }}>
          <Loader2 size={16} className="animate-spin" />
          <span>Analyzing indexed documentation and generating contributor checklist...</span>
        </div>
      )}

      {toastMsg && (
        <div
          style={{
            padding: "0.65rem 1rem",
            backgroundColor: "rgba(78, 159, 118, 0.15)",
            border: "1px solid rgba(78, 159, 118, 0.35)",
            borderRadius: 4,
            color: "var(--accent-forest)",
            fontSize: "0.82rem",
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <CheckCircle2 size={15} />
          <span>{toastMsg}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            padding: "0.85rem 1rem",
            backgroundColor: "var(--accent-terracotta-dim)",
            border: "1px solid var(--accent-terracotta)",
            borderRadius: 4,
            color: "var(--accent-terracotta)",
            fontSize: "0.85rem",
            marginBottom: "1rem",
          }}
        >
          {error}
        </div>
      )}

      {checklist && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Progress summary banner */}
          <div
            style={{
              backgroundColor: "var(--bg-surface-1)",
              border: "1px solid var(--border-hairline)",
              borderRadius: 6,
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "0.75rem",
            }}
          >
            <div>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", display: "block" }}>
                Repository: {checklist.repository}
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {checklist.covered_steps} of {checklist.total_steps} onboarding areas documented (
                {Math.round((checklist.covered_steps / checklist.total_steps) * 100)}%) • You completed{" "}
                {completedSteps.length} of {checklist.total_steps}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: 140,
                  height: 6,
                  backgroundColor: "var(--bg-surface-2)",
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(checklist.covered_steps / checklist.total_steps) * 100}%`,
                    height: "100%",
                    backgroundColor: "var(--accent-brass)",
                  }}
                />
              </div>

              {/* Save Checklist Button */}
              <button
                type="button"
                onClick={handleSaveChecklist}
                disabled={savingChecklist}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.35rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: 4,
                  backgroundColor: savedChecklist ? "rgba(78, 159, 118, 0.15)" : "var(--accent-brass)",
                  border: savedChecklist ? "1px solid rgba(78, 159, 118, 0.35)" : "none",
                  color: savedChecklist ? "var(--accent-forest)" : "#121316",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: savingChecklist ? "wait" : "pointer",
                }}
              >
                {savingChecklist ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : savedChecklist ? (
                  <Check size={13} />
                ) : (
                  <Bookmark size={13} />
                )}
                <span>{savedChecklist ? "Saved to Supabase" : "Save Checklist"}</span>
              </button>
            </div>
          </div>

          {/* Checklist cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {checklist.steps.map((step) => {
              const isChecked = completedSteps.includes(String(step.step_number));
              return (
                <div
                  key={step.step_number}
                  style={{
                    backgroundColor: "var(--bg-surface-1)",
                    border: `1px solid ${
                      isChecked
                        ? "rgba(78, 159, 118, 0.3)"
                        : step.is_covered_in_docs
                        ? "var(--border-hairline)"
                        : "rgba(224, 122, 95, 0.3)"
                    }`,
                    borderRadius: 6,
                    padding: "1.1rem 1.35rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleStepCompleted(step.step_number)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          accentColor: "var(--accent-forest)",
                        }}
                      />
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.75rem",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                          backgroundColor: step.is_covered_in_docs
                            ? "var(--accent-brass)"
                            : "var(--bg-surface-2)",
                          color: step.is_covered_in_docs ? "var(--bg-canvas)" : "var(--text-muted)",
                        }}
                      >
                        {step.step_number}
                      </div>

                      <h2
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 600,
                          color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                          letterSpacing: "-0.01em",
                          textDecoration: isChecked ? "line-through" : "none",
                        }}
                      >
                        {step.title}
                      </h2>
                    </div>

                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 7px",
                        borderRadius: 3,
                        fontFamily: "var(--font-mono)",
                        backgroundColor: step.is_covered_in_docs
                          ? "var(--accent-forest-dim)"
                          : "var(--accent-terracotta-dim)",
                        color: step.is_covered_in_docs ? "var(--accent-forest)" : "var(--accent-terracotta)",
                        border: `1px solid ${
                          step.is_covered_in_docs ? "var(--accent-forest)" : "var(--accent-terracotta)"
                        }`,
                      }}
                    >
                      {step.is_covered_in_docs ? "Documented" : "Not Covered in Docs"}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: isChecked ? "var(--text-muted)" : "var(--text-secondary)",
                      lineHeight: 1.55,
                      marginLeft: 26,
                    }}
                  >
                    {step.description}
                  </p>

                  {step.is_covered_in_docs && step.supporting_file && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: "0.4rem",
                        paddingTop: "0.5rem",
                        borderTop: "1px solid var(--border-hairline)",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                        marginLeft: 26,
                      }}
                    >
                      <a
                        href={step.supporting_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.75rem",
                          color: "var(--accent-brass)",
                          fontFamily: "var(--font-mono)",
                          textDecoration: "none",
                        }}
                      >
                        <span>Evidence: {step.supporting_file}</span>
                        <ExternalLink size={10} />
                      </a>

                      <button
                        type="button"
                        onClick={() =>
                          onAskAboutStep(
                            `Explain step ${step.step_number} (${step.title}) based on ${step.supporting_file}`
                          )
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "3px 8px",
                          backgroundColor: "var(--bg-surface-2)",
                          border: "1px solid var(--border-hairline)",
                          borderRadius: 3,
                          fontSize: "0.74rem",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                        }}
                      >
                        <span>Ask RAG about this step</span>
                        <ArrowRight size={11} />
                      </button>
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
