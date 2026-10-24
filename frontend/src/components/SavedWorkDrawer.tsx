import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Bookmark,
  CheckSquare,
  Trash2,
  Search,
  ArrowUpRight,
  RefreshCw,
  Clock,
  FileText,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchSavedQuestions,
  deleteSavedQuestion,
  fetchSavedChecklists,
  updateSavedChecklistProgress,
  deleteSavedChecklist,
  type SavedQuestion,
  type SavedChecklist,
} from "../supabase";

interface SavedWorkDrawerProps {
  onRestoreQuestion: (q: SavedQuestion) => void;
}

export const SavedWorkDrawer: React.FC<SavedWorkDrawerProps> = ({ onRestoreQuestion }) => {
  const { savedWorkDrawerOpen, closeSavedWorkDrawer, user, refreshSavedCounts } = useAuth();
  const [tab, setTab] = useState<"questions" | "checklists">("questions");
  const [questions, setQuestions] = useState<SavedQuestion[]>([]);
  const [checklists, setChecklists] = useState<SavedChecklist[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [qs, cls] = await Promise.all([
        fetchSavedQuestions(),
        fetchSavedChecklists(),
      ]);
      setQuestions(qs);
      setChecklists(cls);
    } catch (err) {
      console.error("Failed to load saved work:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (savedWorkDrawerOpen && user) {
      loadData();
    }
  }, [savedWorkDrawerOpen, user, loadData]);

  if (!savedWorkDrawerOpen) return null;

  const handleDeleteQuestion = async (id: string) => {
    try {
      await deleteSavedQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      refreshSavedCounts();
    } catch (err) {
      console.error("Failed to delete question:", err);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    try {
      await deleteSavedChecklist(id);
      setChecklists((prev) => prev.filter((cl) => cl.id !== id));
      refreshSavedCounts();
    } catch (err) {
      console.error("Failed to delete checklist:", err);
    }
  };

  const handleToggleChecklistStep = async (checklist: SavedChecklist, stepId: string) => {
    const isCompleted = checklist.completed_step_ids.includes(stepId);
    const newCompleted = isCompleted
      ? checklist.completed_step_ids.filter((id) => id !== stepId)
      : [...checklist.completed_step_ids, stepId];

    setChecklists((prev) =>
      prev.map((c) => (c.id === checklist.id ? { ...c, completed_step_ids: newCompleted } : c))
    );

    try {
      await updateSavedChecklistProgress(checklist.id, newCompleted);
    } catch (err) {
      console.error("Failed to update step progress:", err);
    }
  };

  const filteredQuestions = questions.filter(
    (q) =>
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredChecklists = checklists.filter(
    (cl) =>
      cl.repo_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cl.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 11, 14, 0.7)",
        backdropFilter: "blur(4px)",
        zIndex: 90,
        display: "flex",
        justifyContent: "flex-end",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeSavedWorkDrawer();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          height: "100%",
          backgroundColor: "rgba(18, 21, 28, 0.88)",
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-16px 0 45px rgba(0, 0, 0, 0.6)",
          animation: "slideInRight 0.22s var(--ease-apple)",
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-hairline)",
            backgroundColor: "var(--bg-surface-2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Bookmark size={18} color="var(--accent-brass)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              My Saved Contributor Work
            </h2>
            <span
              style={{
                fontSize: "0.7rem",
                padding: "2px 6px",
                borderRadius: 10,
                backgroundColor: "var(--accent-brass-dim)",
                color: "var(--accent-brass)",
                fontFamily: "var(--font-mono)",
              }}
            >
              Supabase DB
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              onClick={loadData}
              title="Refresh"
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <RefreshCw size={15} />
            </button>
            <button
              onClick={closeSavedWorkDrawer}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                padding: 4,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab & Search Bar */}
        <div
          style={{
            padding: "0.75rem 1.25rem",
            backgroundColor: "var(--bg-canvas)",
            borderBottom: "1px solid var(--border-hairline)",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setTab("questions")}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: 4,
                backgroundColor: tab === "questions" ? "var(--bg-surface-2)" : "transparent",
                border: tab === "questions" ? "1px solid var(--border-active)" : "1px solid transparent",
                color: tab === "questions" ? "var(--accent-brass)" : "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <Bookmark size={14} />
              Saved Questions ({questions.length})
            </button>
            <button
              onClick={() => setTab("checklists")}
              style={{
                flex: 1,
                padding: "0.5rem",
                borderRadius: 4,
                backgroundColor: tab === "checklists" ? "var(--bg-surface-2)" : "transparent",
                border: tab === "checklists" ? "1px solid var(--border-active)" : "1px solid transparent",
                color: tab === "checklists" ? "var(--accent-brass)" : "var(--text-muted)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
              }}
            >
              <CheckSquare size={14} />
              Saved Checklists ({checklists.length})
            </button>
          </div>

          <div style={{ position: "relative" }}>
            <Search
              size={14}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-muted)",
              }}
            />
            <input
              type="text"
              placeholder="Filter by repository or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem 0.5rem 2rem",
                backgroundColor: "var(--bg-surface-1)",
                border: "1px solid var(--border-hairline)",
                borderRadius: 4,
                color: "var(--text-primary)",
                fontSize: "0.8rem",
                outline: "none",
              }}
            />
          </div>
        </div>

        {/* Content list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-muted)" }}>
              Loading your saved records from Supabase...
            </div>
          ) : tab === "questions" ? (
            filteredQuestions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border-hairline)",
                  borderRadius: 6,
                }}
              >
                <FileText size={32} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                  No saved questions found
                </h4>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                  Ask any contributor question in the <strong>Workspace</strong> tab and click the <strong>"Save Question"</strong> button to keep it in your Supabase database.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <div
                  key={q.id}
                  style={{
                    backgroundColor: "var(--bg-surface-2)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: 6,
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.5rem" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.35rem" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "var(--font-mono)",
                            padding: "2px 6px",
                            borderRadius: 3,
                            backgroundColor: "var(--bg-surface-3)",
                            color: "var(--accent-brass)",
                            border: "1px solid var(--border-hairline)",
                          }}
                        >
                          {q.repo_owner}/{q.repo_name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            color: "var(--text-muted)",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                        >
                          <Clock size={11} />
                          {new Date(q.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)" }}>
                        {q.question}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleDeleteQuestion(q.id)}
                      title="Delete saved question"
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div
                    style={{
                      fontSize: "0.82rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      maxHeight: "120px",
                      overflowY: "auto",
                      backgroundColor: "var(--bg-canvas)",
                      padding: "0.65rem",
                      borderRadius: 4,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {q.answer}
                  </div>

                  {/* Citations badges */}
                  {q.citations && q.citations.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", alignItems: "center" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginRight: 2 }}>
                        Sources:
                      </span>
                      {q.citations.map((c, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: "0.7rem",
                            fontFamily: "var(--font-mono)",
                            padding: "1px 6px",
                            borderRadius: 3,
                            backgroundColor: "var(--bg-surface-3)",
                            color: "var(--accent-brass)",
                            border: "1px solid var(--border-hairline)",
                          }}
                        >
                          {c.file_path}{c.start_line ? `#L${c.start_line}-${c.end_line}` : ""}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border-hairline)", paddingTop: "0.5rem" }}>
                    <button
                      onClick={() => {
                        onRestoreQuestion(q);
                        closeSavedWorkDrawer();
                      }}
                      style={{
                        backgroundColor: "transparent",
                        border: "1px solid var(--accent-brass)",
                        borderRadius: 4,
                        padding: "0.35rem 0.75rem",
                        fontSize: "0.75rem",
                        color: "var(--accent-brass)",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      Restore in Workspace <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              ))
            )
          ) : (
            filteredChecklists.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "4rem 2rem",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border-hairline)",
                  borderRadius: 6,
                }}
              >
                <CheckSquare size={32} style={{ margin: "0 auto 1rem", opacity: 0.4 }} />
                <h4 style={{ color: "var(--text-secondary)", marginBottom: "0.5rem", fontSize: "0.95rem" }}>
                  No saved checklists
                </h4>
                <p style={{ fontSize: "0.8rem", lineHeight: 1.5 }}>
                  Go to the <strong>Onboarding Checklist</strong> tab and click <strong>"Save Checklist to Account"</strong> to track your progress step-by-step.
                </p>
              </div>
            ) : (
              filteredChecklists.map((cl) => {
                const completedCount = cl.completed_step_ids.length;
                const totalCount = cl.steps.length;
                const percent = Math.round((completedCount / (totalCount || 1)) * 100);

                return (
                  <div
                    key={cl.id}
                    style={{
                      backgroundColor: "var(--bg-surface-2)",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: 6,
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.75rem",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                      <div>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontFamily: "var(--font-mono)",
                            padding: "2px 6px",
                            borderRadius: 3,
                            backgroundColor: "var(--bg-surface-3)",
                            color: "var(--accent-brass)",
                            border: "1px solid var(--border-hairline)",
                          }}
                        >
                          {cl.repo_owner}/{cl.repo_name}
                        </span>
                        <h3 style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-primary)", marginTop: "0.35rem" }}>
                          {cl.title}
                        </h3>
                      </div>
                      <button
                        onClick={() => handleDeleteChecklist(cl.id)}
                        title="Delete checklist"
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          cursor: "pointer",
                          padding: 4,
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-muted)", marginBottom: 4 }}>
                        <span>Progress: {completedCount} of {totalCount} completed</span>
                        <span>{percent}%</span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 6,
                          backgroundColor: "var(--bg-canvas)",
                          borderRadius: 3,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${percent}%`,
                            height: "100%",
                            backgroundColor: percent === 100 ? "var(--accent-forest)" : "var(--accent-brass)",
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>

                    {/* Steps list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                      {cl.steps.map((st: any) => {
                        const stepId = String(st.step_number || st.title);
                        const isDone = cl.completed_step_ids.includes(stepId);
                        return (
                          <div
                            key={stepId}
                            onClick={() => handleToggleChecklistStep(cl, stepId)}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "0.6rem",
                              padding: "0.45rem 0.6rem",
                              borderRadius: 4,
                              backgroundColor: isDone ? "rgba(78, 159, 118, 0.08)" : "var(--bg-canvas)",
                              border: isDone ? "1px solid rgba(78, 159, 118, 0.25)" : "1px solid var(--border-hairline)",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isDone}
                              onChange={() => {}}
                              style={{ marginTop: 3, cursor: "pointer", accentColor: "var(--accent-forest)" }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 500,
                                  color: isDone ? "var(--text-muted)" : "var(--text-primary)",
                                  textDecoration: isDone ? "line-through" : "none",
                                }}
                              >
                                Step {st.step_number}: {st.title}
                              </div>
                              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                                {st.description}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </div>
    </div>
  );
};
