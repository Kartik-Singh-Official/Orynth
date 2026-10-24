import React, { useState } from "react";
import {
  Compass,
  GitBranch,
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
        backgroundColor: "rgba(13, 15, 20, 0.75)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.07)",
        padding: "0.65rem 1.75rem",
        position: "sticky",
        top: 0,
        zIndex: 50,
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
        {/* Brand identity - Apple minimal typography */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              borderRadius: 9,
              background: "linear-gradient(135deg, rgba(212, 163, 115, 0.22) 0%, rgba(212, 163, 115, 0.05) 100%)",
              border: "1px solid rgba(212, 163, 115, 0.35)",
              color: "var(--accent-brass)",
              boxShadow: "0 2px 10px rgba(212, 163, 115, 0.12)",
            }}
          >
            <Compass size={17} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontWeight: 600,
                  fontSize: "1.1rem",
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary)",
                }}
              >
                orynth
              </span>
              <span
                style={{
                  fontSize: "0.68rem",
                  padding: "1px 7px",
                  borderRadius: 9999,
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  color: "var(--text-secondary)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  fontFamily: "var(--font-mono)",
                  fontWeight: 500,
                }}
              >
                Gemma 4
              </span>
            </div>
          </div>
        </div>

        {/* Navigation tabs - Apple Segmented Control */}
        <nav
          className="segmented-control"
          style={{
            backgroundColor: "rgba(20, 23, 30, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
          }}
        >
          {[
            { id: "workspace", label: "Workspace" },
            { id: "checklist", label: "Onboarding Checklist" },
            { id: "evaluation", label: "Benchmark" },
            { id: "sources", label: "Sources" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`segmented-control-btn ${isActive ? "active" : ""}`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Action Controls & Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
          {/* Saved Work Glass Pill */}
          <button
            onClick={() => {
              if (!user) {
                openAuthModal("login");
              } else {
                openSavedWorkDrawer();
              }
            }}
            title={user ? "View your saved work" : "Log in to view saved work"}
            className="glass-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.35rem 0.8rem",
              color: "var(--text-primary)",
              fontSize: "0.78rem",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            <Bookmark size={13} color="var(--accent-brass)" />
            <span>Saved Work</span>
            {user && (
              <span
                style={{
                  padding: "1px 6px",
                  borderRadius: 9999,
                  backgroundColor: totalSaved > 0 ? "var(--accent-brass)" : "rgba(255, 255, 255, 0.08)",
                  color: totalSaved > 0 ? "#121316" : "var(--text-muted)",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {totalSaved}
              </span>
            )}
          </button>

          {/* User Auth Pill / Dropdown */}
          {user ? (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="glass-pill"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.45rem",
                  padding: "0.3rem 0.65rem 0.3rem 0.35rem",
                  color: "var(--text-primary)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(212, 163, 115, 0.3), rgba(212, 163, 115, 0.1))",
                    border: "1px solid rgba(212, 163, 115, 0.4)",
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
                    maxWidth: 100,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontWeight: 500,
                  }}
                >
                  {user.user_metadata?.full_name || user.email?.split("@")[0]}
                </span>
                <ChevronDown size={11} color="var(--text-muted)" />
              </button>

              {userMenuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    marginTop: 8,
                    width: 220,
                    backgroundColor: "rgba(22, 25, 34, 0.92)",
                    backdropFilter: "blur(24px) saturate(180%)",
                    WebkitBackdropFilter: "blur(24px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: 10,
                    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55)",
                    zIndex: 60,
                    overflow: "hidden",
                    animation: "scaleIn 0.18s var(--ease-apple)",
                  }}
                >
                  <div
                    style={{
                      padding: "0.75rem 0.95rem",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                      backgroundColor: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>
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
                      padding: "0.65rem 0.95rem",
                      background: "none",
                      border: "none",
                      color: "var(--text-primary)",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
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
                      padding: "0.65rem 0.95rem",
                      background: "none",
                      border: "none",
                      color: "var(--text-secondary)",
                      fontSize: "0.78rem",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Database size={13} color="var(--text-muted)" />
                      <span>Database</span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        padding: "1px 6px",
                        borderRadius: 4,
                        backgroundColor: isConfigured ? "rgba(78, 159, 118, 0.15)" : "rgba(255, 255, 255, 0.06)",
                        color: isConfigured ? "var(--accent-forest)" : "var(--text-muted)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {isConfigured ? "Supabase" : "Local DB"}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      signOut();
                    }}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.95rem",
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
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <button
                onClick={() => openAuthModal("login")}
                className="glass-pill"
                style={{
                  padding: "0.35rem 0.75rem",
                  color: "var(--text-primary)",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Log In
              </button>
              <button
                onClick={() => openAuthModal("signup")}
                style={{
                  padding: "0.35rem 0.85rem",
                  borderRadius: 9999,
                  background: "linear-gradient(135deg, #E4B589 0%, #D4A373 100%)",
                  border: "none",
                  color: "#121316",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(212, 163, 115, 0.25)",
                }}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Model Status Pill with Live Pulsing Dot */}
          <div
            className="glass-pill"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.35rem 0.75rem",
              fontSize: "0.74rem",
              fontFamily: "var(--font-mono)",
            }}
          >
            <span
              className={apiKeyConfigured ? "pulse-live" : ""}
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: apiKeyConfigured ? "var(--accent-forest)" : "var(--accent-brass)",
                display: "inline-block",
              }}
            />
            <span style={{ color: apiKeyConfigured ? "var(--text-primary)" : "var(--accent-brass)" }}>
              {apiKeyConfigured ? modelName : "Demo Mode"}
            </span>
            <span style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
              • {chunksCount} chunks
            </span>
          </div>

          {/* Repo Link Pill */}
          {repository && (
            <a
              href={repository.url}
              target="_blank"
              rel="noreferrer"
              title="Open repository on GitHub"
              className="glass-pill"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.35rem 0.7rem",
                color: "var(--text-secondary)",
                fontSize: "0.75rem",
                fontFamily: "var(--font-mono)",
                textDecoration: "none",
              }}
            >
              <GitBranch size={12} color="var(--accent-brass)" />
              <span>{repository.owner}/{repository.repo}</span>
              <ExternalLink size={10} color="var(--text-muted)" />
            </a>
          )}
        </div>
      </div>
    </header>
  );
};
