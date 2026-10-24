import React, { useEffect, useState, useCallback } from "react";
import {
  ExternalLink,
  ArrowRight,
  Loader2,
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
    <div style={{ maxWidth: 960, margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Header — Apple Minimal */}
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
          Where Do I Start?
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          An ordered 5-step contributor onboarding path derived strictly from the indexed repository documentation.
        </p>
      </div>

      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "3rem 0", color: "var(--text-muted)" }}>
          <Loader2 size={18} className="spin" />
          <span style={{ fontSize: "0.9rem" }}>Analyzing repository docs and synthesizing onboarding path...</span>
        </div>
      )}

      {toastMsg && (
        <div
          className="animate-fade-in"
          style={{
            padding: "0.65rem 1rem",
            backgroundColor: "rgba(78, 159, 118, 0.12)",
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
          <span>{toastMsg}</span>
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
            marginBottom: "1.25rem",
          }}
        >
          {error}
        </div>
      )}

      {checklist && (
        <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Progress Summary Card — Apple Glass Panel */}
          <div
            className="glass-panel"
            style={{
              padding: "1.25rem 1.5rem",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
            }}
          >
            <div>
              <span style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)", display: "block", marginBottom: 3 }}>
                Repository: {checklist.repository}
              </span>
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                {checklist.covered_steps} of {checklist.total_steps} onboarding areas documented ({Math.round((checklist.covered_steps / checklist.total_steps) * 100)}%) • {completedSteps.length} completed
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              {/* Progress Bar */}
              <div
                style={{
                  width: 140,
                  height: 6,
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderRadius: 9999,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(checklist.covered_steps / checklist.total_steps) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #D4A373 0%, #E4B589 100%)",
                    transition: "width 0.4s var(--ease-apple)",
                  }}
                />
              </div>

              {/* Save Checklist Button */}
              <button
                type="button"
                onClick={handleSaveChecklist}
                disabled={savingChecklist}
                className={savedChecklist ? "glass-pill" : ""}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.45rem 0.95rem",
                  borderRadius: 9999,
                  background: savedChecklist
                    ? "rgba(78, 159, 118, 0.12)"
                    : "linear-gradient(135deg, #E4B589 0%, #D4A373 100%)",
                  border: savedChecklist ? "1px solid rgba(78, 159, 118, 0.3)" : "none",
                  color: savedChecklist ? "var(--accent-forest)" : "#121316",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: savingChecklist ? "wait" : "pointer",
                  boxShadow: savedChecklist ? "none" : "0 2px 8px rgba(212, 163, 115, 0.25)",
                }}
              >
                {savingChecklist ? (
                  <Loader2 size={13} className="spin" />
                ) : savedChecklist ? (
                  <Check size={13} />
                ) : (
                  <Bookmark size={13} />
                )}
                <span>{savedChecklist ? "Saved to Supabase" : "Save Checklist"}</span>
              </button>
            </div>
          </div>

          {/* Checklist Cards — Apple Reminders Style */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {checklist.steps.map((step) => {
              const isChecked = completedSteps.includes(String(step.step_number));
              return (
                <div
                  key={step.step_number}
                  className="glass-card"
                  style={{
                    padding: "1.25rem 1.5rem",
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.65rem",
                    border: isChecked
                      ? "1px solid rgba(78, 159, 118, 0.3)"
                      : step.is_covered_in_docs
                      ? "1px solid rgba(255, 255, 255, 0.08)"
                      : "1px solid rgba(224, 122, 95, 0.25)",
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      {/* Tactile Circular Checkmark */}
                      <button
                        type="button"
                        onClick={() => toggleStepCompleted(step.step_number)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          border: isChecked
                            ? "none"
                            : "1.5px solid rgba(255, 255, 255, 0.25)",
                          backgroundColor: isChecked ? "var(--accent-forest)" : "transparent",
                          color: "#FFFFFF",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          padding: 0,
                          transition: "all 0.18s var(--ease-apple)",
                          transform: isChecked ? "scale(1.05)" : "scale(1)",
                        }}
                        title={isChecked ? "Mark incomplete" : "Mark as completed"}
                      >
                        {isChecked ? <Check size={14} strokeWidth={2.8} /> : null}
                      </button>

                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.72rem",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 700,
                          backgroundColor: step.is_covered_in_docs
                            ? "rgba(212, 163, 115, 0.15)"
                            : "rgba(255, 255, 255, 0.06)",
                          color: step.is_covered_in_docs ? "var(--accent-brass)" : "var(--text-muted)",
                        }}
                      >
                        {step.step_number}
                      </div>

                      <h2
                        style={{
                          fontSize: "0.98rem",
                          fontWeight: 600,
                          color: isChecked ? "var(--text-muted)" : "var(--text-primary)",
                          letterSpacing: "-0.015em",
                          textDecoration: isChecked ? "line-through" : "none",
                          transition: "all 0.2s ease",
                        }}
                      >
                        {step.title}
                      </h2>
                    </div>

                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "2px 8px",
                        borderRadius: 9999,
                        fontFamily: "var(--font-mono)",
                        backgroundColor: step.is_covered_in_docs
                          ? "rgba(78, 159, 118, 0.14)"
                          : "rgba(224, 122, 95, 0.14)",
                        color: step.is_covered_in_docs ? "var(--accent-forest)" : "var(--accent-terracotta)",
                        border: `1px solid ${
                          step.is_covered_in_docs ? "rgba(78, 159, 118, 0.3)" : "rgba(224, 122, 95, 0.3)"
                        }`,
                        fontWeight: 500,
                      }}
                    >
                      {step.is_covered_in_docs ? "Documented" : "Not Covered in Docs"}
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: "0.88rem",
                      color: isChecked ? "var(--text-muted)" : "var(--text-secondary)",
                      lineHeight: 1.6,
                      marginLeft: 32,
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
                        marginTop: "0.5rem",
                        paddingTop: "0.65rem",
                        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                        flexWrap: "wrap",
                        gap: "0.6rem",
                        marginLeft: 32,
                      }}
                    >
                      <a
                        href={step.supporting_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="glass-pill"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "3px 9px",
                          fontSize: "0.74rem",
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
                        className="glass-pill"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.35rem",
                          padding: "4px 10px",
                          fontSize: "0.76rem",
                          color: "var(--text-primary)",
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        <span>Ask RAG about this step</span>
                        <ArrowRight size={11} color="var(--accent-brass)" />
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
