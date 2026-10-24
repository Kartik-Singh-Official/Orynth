import React from "react";
import { Compass, GitBranch, Cpu, ExternalLink } from "lucide-react";
import type { RepositoryMetadata } from "../api";

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
  return (
    <header style={{
      backgroundColor: "var(--bg-surface-1)",
      borderBottom: "1px solid var(--border-hairline)",
      padding: "0.75rem 1.5rem",
      position: "sticky",
      top: 0,
      zIndex: 40,
    }}>
      <div style={{
        maxWidth: 1400,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
      }}>
        {/* Brand identity */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 34,
            height: 34,
            borderRadius: 6,
            backgroundColor: "var(--accent-brass-dim)",
            border: "1px solid var(--accent-brass)",
            color: "var(--accent-brass)",
          }}>
            <Compass size={20} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: "1.15rem",
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}>
                orynth
              </span>
              <span style={{
                fontSize: "0.7rem",
                padding: "1px 6px",
                borderRadius: 3,
                backgroundColor: "var(--bg-surface-2)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-hairline)",
                fontFamily: "var(--font-mono)",
              }}>
                Gemma 4 RAG
              </span>
            </div>
            <p style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              letterSpacing: "0.01em",
            }}>
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

        {/* System & Repo Status Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
              <span>{repository.owner}/{repository.repo}</span>
              <ExternalLink size={11} color="var(--text-muted)" />
            </a>
          )}

          <div style={{
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
          }}>
            <Cpu size={12} />
            <span>{apiKeyConfigured ? modelName : "Demo Mode (Local Embeddings)"}</span>
          </div>

          <div style={{
            padding: "0.3rem 0.55rem",
            borderRadius: 4,
            backgroundColor: "var(--bg-surface-2)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-secondary)",
            fontSize: "0.75rem",
            fontFamily: "var(--font-mono)",
          }}>
            {chunksCount} chunks
          </div>
        </div>
      </div>
    </header>
  );
};
