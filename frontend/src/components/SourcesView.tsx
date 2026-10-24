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
    <div style={{ maxWidth: 1000, margin: "2rem auto", padding: "0 1.5rem" }}>
      <div style={{ marginBottom: "1.75rem" }}>
        <h1 style={{
          fontSize: "1.6rem",
          fontWeight: 600,
          color: "var(--text-primary)",
          letterSpacing: "-0.015em",
          marginBottom: "0.3rem",
        }}>
          Repository Documentation Sources
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)" }}>
          Documentation files currently indexed and mapped into vector embeddings for {repository ? `${repository.owner}/${repository.repo}` : "the project"}.
        </p>
      </div>

      <div style={{
        backgroundColor: "var(--bg-surface-1)",
        border: "1px solid var(--border-hairline)",
        borderRadius: 6,
        padding: "1rem 1.25rem",
        marginBottom: "1.25rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "0.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Database size={16} color="var(--accent-brass)" />
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)" }}>
            Vector Store Status: {chunksCount} chunks indexed
          </span>
        </div>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          Embedding Model: sentence-transformers/all-MiniLM-L6-v2 (384-dim)
        </span>
      </div>

      {documents.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
          No documentation files loaded yet. Use the repository bar above to index a repository.
        </div>
      ) : (
        <div style={{
          backgroundColor: "var(--bg-surface-1)",
          border: "1px solid var(--border-hairline)",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--bg-surface-2)", borderBottom: "1px solid var(--border-hairline)", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>FILE PATH</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>TYPE</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>SIZE</th>
                <th style={{ padding: "0.75rem 1rem", color: "var(--text-muted)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: idx < documents.length - 1 ? "1px solid var(--border-hairline)" : "none",
                  }}
                >
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <FileText size={14} color="var(--accent-brass)" />
                      <span>{doc.path}</span>
                    </div>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {doc.file_type}
                  </td>
                  <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {Math.round(doc.size_bytes / 1024)} KB
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        color: "var(--accent-brass)",
                        textDecoration: "none",
                        fontSize: "0.75rem",
                      }}
                    >
                      <span>View on GitHub</span>
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
