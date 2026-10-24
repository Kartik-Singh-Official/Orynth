import React, { useState } from "react";
import { Search, Loader2, RefreshCw, FolderGit2, CheckCircle2, AlertCircle } from "lucide-react";
import { inspectRepository, indexRepository, type RepositoryMetadata, type DocumentFile } from "../api";

interface RepositoryBarProps {
  currentRepo: RepositoryMetadata | null;
  onIndexed: (metadata: RepositoryMetadata, docs: DocumentFile[], chunksCount: number) => void;
}

export const RepositoryBar: React.FC<RepositoryBarProps> = ({ currentRepo, onIndexed }) => {
  const [urlInput, setUrlInput] = useState<string>(currentRepo?.url || "https://github.com/pallets/flask");
  const [isInspecting, setIsInspecting] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [inspectResult, setInspectResult] = useState<{
    metadata: RepositoryMetadata;
    discovered_files: DocumentFile[];
  } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setIsInspecting(true);
    setErrorMessage(null);
    setStatusMessage("Inspecting repository via GitHub API...");
    try {
      const res = await inspectRepository(urlInput.trim());
      setInspectResult(res);
      setStatusMessage(`Found ${res.discovered_files.length} documentation files in ${res.metadata.owner}/${res.metadata.repo}.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to inspect repository.");
      setStatusMessage(null);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleIndex = async (useSample: boolean = false) => {
    setIsIndexing(true);
    setErrorMessage(null);
    setStatusMessage(useSample ? "Indexing sample dataset (pallets/flask)..." : "Fetching files, generating chunks, and computing local embeddings...");
    try {
      const res = await indexRepository(useSample ? undefined : urlInput.trim(), useSample);
      setStatusMessage(`Successfully indexed ${res.files_count} files (${res.chunks_count} chunks) in ${res.indexing_time_ms}ms.`);
      onIndexed(res.metadata, [], res.chunks_count);
      setInspectResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to index repository.");
      setStatusMessage(null);
    } finally {
      setIsIndexing(false);
    }
  };

  return (
    <div style={{
      backgroundColor: "var(--bg-surface-1)",
      borderBottom: "1px solid var(--border-hairline)",
      padding: "0.85rem 1.5rem",
    }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <form onSubmit={handleInspect} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            flex: "1 1 340px",
            backgroundColor: "var(--bg-surface-2)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 4,
            padding: "0.45rem 0.75rem",
            gap: "0.5rem",
          }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Enter public GitHub repository URL (e.g. https://github.com/pallets/flask)"
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-mono)",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isInspecting || isIndexing}
            style={{
              padding: "0.45rem 0.95rem",
              backgroundColor: "var(--bg-surface-2)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
              borderRadius: 4,
              fontSize: "0.82rem",
              fontWeight: 500,
              cursor: isInspecting ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {isInspecting ? <Loader2 size={13} className="animate-spin" /> : <FolderGit2 size={13} />}
            Inspect Docs
          </button>

          <button
            type="button"
            onClick={() => handleIndex(false)}
            disabled={isIndexing || isInspecting}
            style={{
              padding: "0.45rem 1.1rem",
              backgroundColor: "var(--accent-brass)",
              border: "1px solid var(--accent-brass)",
              color: "var(--bg-canvas)",
              borderRadius: 4,
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: isIndexing ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            {isIndexing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            Index Repository
          </button>

          <button
            type="button"
            onClick={() => handleIndex(true)}
            disabled={isIndexing}
            style={{
              padding: "0.45rem 0.85rem",
              backgroundColor: "transparent",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-secondary)",
              borderRadius: 4,
              fontSize: "0.8rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
            title="Reload verified sample documents from pallets/flask"
          >
            <RefreshCw size={12} />
            Reset to Sample
          </button>
        </form>

        {/* Feedback Messages */}
        {statusMessage && (
          <div style={{
            marginTop: "0.6rem",
            padding: "0.4rem 0.75rem",
            borderRadius: 4,
            backgroundColor: "rgba(212, 163, 115, 0.08)",
            border: "1px solid rgba(212, 163, 115, 0.2)",
            fontSize: "0.78rem",
            color: "var(--accent-brass)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}>
            <CheckCircle2 size={13} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div style={{
            marginTop: "0.6rem",
            padding: "0.4rem 0.75rem",
            borderRadius: 4,
            backgroundColor: "var(--accent-terracotta-dim)",
            border: "1px solid var(--accent-terracotta)",
            fontSize: "0.78rem",
            color: "var(--accent-terracotta)",
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}>
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Inspection Preview Drawer */}
        {inspectResult && (
          <div style={{
            marginTop: "0.75rem",
            padding: "0.75rem",
            backgroundColor: "var(--bg-surface-2)",
            border: "1px solid var(--border-hairline)",
            borderRadius: 4,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                Discovered Documentation Files ({inspectResult.discovered_files.length})
              </span>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Branch: {inspectResult.metadata.default_branch}
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
              {inspectResult.discovered_files.map((file) => (
                <span
                  key={file.path}
                  style={{
                    fontSize: "0.72rem",
                    fontFamily: "var(--font-mono)",
                    padding: "2px 6px",
                    borderRadius: 3,
                    backgroundColor: "var(--bg-surface-1)",
                    border: "1px solid var(--border-hairline)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {file.path} ({Math.round(file.size_bytes / 1024)} KB)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
