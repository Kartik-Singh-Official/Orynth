import React, { useState } from "react";
import {
  Compass,
  GitBranch,
  Cpu,
  ExternalLink,
  Bookmark,
  LogOut,
  Database,
  ChevronDown,
} from "lucide-react";
import type { RepositoryMetadata } from "../api";
import { useAuth } from "../context/AuthContext";

interface HeaderProps {
  activeTab: "workspace" | "checklist" | "evaluation" | "sources";
  setActiveTab: (tab: "workspace" | "checklist" | "evaluation" | "sources") => void;
  repository: RepositoryMetadata | null;
  chunksCount: number;
  apiKeyConfigured: boolean;
  modelName: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  repository,
  chunksCount,
  apiKeyConfigured,
  modelName,
}) => {
  const {
    user,
    openAuthModal,
    openSavedWorkDrawer,
    savedQuestionsCount,
    savedChecklistsCount,
    signOut,
    isConfigured,
  } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const totalSaved = savedQuestionsCount + savedChecklistsCount;

  return (
    <header
      style={{
        backgroundColor: "var(--bg-surface-1)",
        borderBottom: "1px solid var(--border-hairline)",
        padding: "0.75rem 1.5rem",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        {/* Brand identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 6,
              backgroundColor: "var(--accent-brass-dim)",
              border: "1px solid var(--accent-brass)",
              color: "var(--accent-brass)",
            }}
          >
            <Compass size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontWeight: 600,
                  fontSize: "1.15rem",
                  letterSpacing: "-0.02em",
                  color: "var(--text-primary)",
                }}
              >
                orynth
              </span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "1px 6px",
                  borderRadius: 3,
                  backgroundColor: "var(--bg-surface-2)",
                  color: "var(--text-secondary)",
                  border: "1px solid var(--border-hairline)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                Gemma 4 RAG
              </span>
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                letterSpacing: "0.01em",
              }}
            >
              Find your way into open source.
            </p>
          </div>
        </div>

        {/* Navigation tabs */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          {[
            { id: "workspace", label: "Workspace" },
            { id: "checklist", label: "Onboarding Checklist" },
            { id: "evaluation", label: "Evaluation Benchmark" },
            { id: "sources", label: "Repository Sources" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  padding: "0.45rem 0.85rem",
                  fontSize: "0.82rem",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? "var(--accent-brass)" : "var(--text-secondary)",
                  backgroundColor: isActive ? "var(--bg-surface-2)" : "transparent",
                  border: isActive ? "1px solid var(--border-active)" : "1px solid transparent",
                  borderRadius: 4,
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* User Auth, Saved Work & System Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          {/* Saved Work Button */}
          <button
            onClick={() => {
              if (!user) {
                openAuthModal("login");
              } else {
                openSavedWorkDrawer();
              }
            }}
            title={user ? "View your saved questions and checklists" : "Log in to view saved work"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.4rem 0.75rem",
              borderRadius: 4,
              backgroundColor: "var(--bg-surface-2)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
              fontSize: "0.78rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Bookmark size={13} color="var(--accent-brass)" />
            <span>Saved Work</span>
            {user && (
              <span
                style={{
                  padding: "1px 5px",
                  borderRadius: 10,
                  backgroundColor: totalSaved > 0 ? "var(--accent-brass)" : "var(--bg-surface-3)",
                  color: totalSaved > 0 ? "#121316" : "var(--text-muted)",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {totalSaved}
              </span>
            )}
          </button>

          {/* User Auth Pill / Buttons */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.35rem 0.65rem",
                  borderRadius: 4,
                  backgroundColor: "var(--bg-surface-2)",
                  border: "1px solid var(--border-active)",
                  color: "var(--text-primary)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    backgroundColor: "var(--accent-brass-dim)",
                    color: "var(--accent-brass)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                  }}
                >
                  {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                </div>
                <span
                  style={{
                    maxWidth: 110,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <ChevronDown size={12} color="var(--text-muted)" />
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 6,
                    width: 210,
                    backgroundColor: "var(--bg-surface-1)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: 6,
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
                    zIndex: 50,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "0.65rem 0.85rem",
                      borderBottom: "1px solid var(--border-hairline)",
                      backgroundColor: "var(--bg-surface-2)",
                    }}
                  >
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>
                      {user.user_metadata?.full_name || "Contributor"}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user.email}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      openSavedWorkDrawer();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      background: "none",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-hairline)",
                    }}
                  >
                    <Bookmark size={13} color="var(--accent-brass)" />
                    My Saved Work ({totalSaved})
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      openAuthModal("config");
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      background: "none",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border-hairline)",
                    }}
                  >
                    <Database size={13} color="var(--text-muted)" />
                    Database Settings
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      background: "none",
                      border: "none",
                      color: "#ff8b8b",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <button
                onClick={() => openAuthModal("login")}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: 4,
                  backgroundColor: "transparent",
                  border: "1px solid var(--border-hairline)",
                  color: "var(--text-primary)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal("signup")}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: 4,
                  backgroundColor: "var(--accent-brass)",
                  border: "none",
                  color: "#121316",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Database indicator */}
          <button
            onClick={() => openAuthModal("config")}
            title={isConfigured ? "Connected to Supabase PostgreSQL database" : "Using local storage mode (Click to connect Supabase)"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "0.3rem 0.55rem",
              borderRadius: 4,
              backgroundColor: isConfigured ? "rgba(78, 159, 118, 0.15)" : "var(--bg-surface-2)",
              border: `1px solid ${isConfigured ? "rgba(78, 159, 118, 0.35)" : "var(--border-hairline)"}`,
              color: isConfigured ? "var(--accent-forest)" : "var(--text-muted)",
              fontSize: "0.72rem",
              fontFamily: "var(--font-mono)",
              cursor: "pointer",
            }}
          >
            <Database size={11} />
            <span>{isConfigured ? "Supabase" : "Local DB"}</span>
          </button>

          {/* Repo & Model Badges */}
          {repository && (
            <a
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              title="Open repository on GitHub"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.3rem 0.65rem",
                borderRadius: 4,
                backgroundColor: "var(--bg-surface-2)",
                border: "1px solid var(--border-hairline)",
                color: "var(--text-primary)",
                fontSize: "0.78rem",
                fontFamily: "var(--font-mono)",
                textDecoration: "none",
              }}
            >
              <GitBranch size={13} color="var(--accent-brass)" />
              <span>
                {repository.owner}/{repository.repo}
              </span>
              <ExternalLink size={11} color="var(--text-muted)" />
            </a>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.3rem 0.65rem",
              borderRadius: 4,
              backgroundColor: apiKeyConfigured ? "var(--accent-forest-dim)" : "var(--accent-brass-dim)",
              border: `1px solid ${apiKeyConfigured ? "var(--accent-forest)" : "var(--accent-brass)"}`,
              color: apiKeyConfigured ? "var(--accent-forest)" : "var(--accent-brass)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            <Cpu size={12} />
            <span>{apiKeyConfigured ? modelName : "Demo Mode"}</span>
          </div>

          <div
            style={{
              padding: "0.3rem 0.55rem",
              borderRadius: 4,
              backgroundColor: "var(--bg-surface-2)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-secondary)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            {chunksCount} chunks
          </div>
        </div>
      </div>
    </header>
  );
};
