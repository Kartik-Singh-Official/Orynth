import React from "react";
import { FileText, ExternalLink, Database } from "lucide-react";
import type { DocumentFile, RepositoryMetadata } from "../api";

interface SourcesViewProps {
  repository: RepositoryMetadata | null;
  documents: DocumentFile[];
  chunksCount: number;
}

export const SourcesView: React.FC<SourcesViewProps> = ({ repository, documents, chunksCount }) => {
  return (
    <div style={{ maxWidth: 1000, margin: "2.5rem auto", padding: "0 1.5rem" }}>
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
          Repository Documentation Sources
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Documentation files currently indexed and mapped into vector embeddings for {repository ? `${repository.owner}/${repository.repo}` : "the project"}.
        </p>
      </div>

      {/* Vector Store Status Panel */}
      <div
        className="glass-panel"
        style={{
          padding: "1.1rem 1.35rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Database size={16} color="var(--accent-brass)" />
          <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Vector Store Status: {chunksCount} chunks indexed
          </span>
        </div>
        <span style={{ fontSize: "0.76rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Embedding Model: sentence-transformers/all-MiniLM-L6-v2 (384-dim CPU)
        </span>
      </div>

      {documents.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: "3.5rem 2rem",
            textAlign: "center",
            color: "var(--text-muted)",
            borderRadius: 12,
          }}
        >
          No documentation files loaded yet. Use the search bar above to index any public GitHub repository.
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
            <thead>
              <tr
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  FILE PATH
                </th>
                <th style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  TYPE
                </th>
                <th style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  SIZE
                </th>
                <th style={{ padding: "0.85rem 1.25rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)", fontSize: "0.75rem" }}>
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx < documents.length - 1 ? "1px solid rgba(255, 255, 255, 0.04)" : "none",
                    transition: "background-color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.025)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "0.85rem 1.25rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                      <FileText size={14} color="var(--accent-brass)" />
                      <span>{doc.path}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 4,
                        backgroundColor: "rgba(255, 255, 255, 0.05)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        fontSize: "0.72rem",
                      }}
                    >
                      {doc.file_type}
                    </span>
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {Math.round(doc.size_bytes / 1024)} KB
                  </td>
                  <td style={{ padding: "0.85rem 1.25rem" }}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="glass-pill"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "3px 9px",
                        fontSize: "0.75rem",
                        color: "var(--accent-brass)",
                        fontFamily: "var(--font-mono)",
                        textDecoration: "none",
                      }}
                    >
                      <span>View GitHub</span>
                      <ExternalLink size={10} />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
