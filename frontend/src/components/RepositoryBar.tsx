import React, { useState } from "react";
import { Search, Loader2, RefreshCw, FolderGit2, CheckCircle2, AlertCircle } from "lucide-react";
import { inspectRepository, indexRepository, type RepositoryMetadata, type DocumentFile } from "../api";

interface RepositoryBarProps {
  currentRepo: RepositoryMetadata | null;
  onIndexed: (metadata: RepositoryMetadata, docs: DocumentFile[], chunksCount: number) => void;
}

export const RepositoryBar: React.FC<RepositoryBarProps> = ({ currentRepo: _currentRepo, onIndexed }) => {
  const [urlInput, setUrlInput] = useState<string>("");
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
    if (!urlInput.trim()) {
      setErrorMessage("Please paste a public GitHub repository link (e.g. https://github.com/facebook/react).");
      return;
    }
    setIsInspecting(true);
    setErrorMessage(null);
    setInspectResult(null);
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
    if (!useSample && !urlInput.trim()) {
      setErrorMessage("Please paste a public GitHub repository link first (e.g. https://github.com/owner/repo), or click 'Sample Data' to explore Flask.");
      return;
    }
    setIsIndexing(true);
    setErrorMessage(null);
    setStatusMessage(useSample ? "Indexing sample dataset (pallets/flask)..." : "Fetching files, generating chunks, and computing local embeddings...");
    try {
      const res = await indexRepository(useSample ? undefined : urlInput.trim(), useSample);
      setStatusMessage(`Successfully indexed ${res.files_count} files (${res.chunks_count} chunks) in ${res.indexing_time_ms}ms.`);
      onIndexed(res.metadata, res.documents || [], res.chunks_count);
      setInspectResult(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to index repository.");
      setStatusMessage(null);
    } finally {
      setIsIndexing(false);
    }
  };


  return (
    <div
      style={{
        backgroundColor: "rgba(16, 18, 24, 0.45)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "0.85rem 1.75rem",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <form onSubmit={handleInspect} style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          {/* Apple Spotlight Search Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: "1 1 380px",
              backgroundColor: "rgba(22, 25, 34, 0.7)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              borderRadius: 10,
              padding: "0.5rem 0.85rem",
              gap: "0.6rem",
              boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.25)",
              transition: "all 0.2s var(--ease-apple)",
            }}
          >
            <Search size={15} color="var(--accent-brass)" style={{ opacity: 0.85 }} />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste your GitHub repository link here (e.g. https://github.com/owner/repo)..."
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-mono)",
                letterSpacing: "-0.01em",
              }}
            />
            <span
              style={{
                fontSize: "0.65rem",
                padding: "2px 5px",
                borderRadius: 4,
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "var(--text-muted)",
                fontFamily: "var(--font-mono)",
                userSelect: "none",
              }}
            >
              ↵
            </span>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <button
              type="submit"
              disabled={isInspecting || isIndexing}
              className="glass-pill"
              style={{
                padding: "0.45rem 0.95rem",
                color: "var(--text-primary)",
                fontSize: "0.8rem",
                fontWeight: 500,
                cursor: isInspecting ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {isInspecting ? <Loader2 size={13} className="spin" /> : <FolderGit2 size={13} />}
              <span>Inspect Docs</span>
            </button>

            <button
              type="button"
              onClick={() => handleIndex(false)}
              disabled={isIndexing || isInspecting}
              style={{
                padding: "0.45rem 1.15rem",
                borderRadius: 9999,
                background: "linear-gradient(135deg, #E4B589 0%, #D4A373 100%)",
                border: "none",
                color: "#121316",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: isIndexing ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                boxShadow: "0 2px 10px rgba(212, 163, 115, 0.25)",
              }}
            >
              {isIndexing ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
              <span>Index Repository</span>
            </button>

            <button
              type="button"
              onClick={() => handleIndex(true)}
              disabled={isIndexing}
              className="glass-pill"
              style={{
                padding: "0.45rem 0.85rem",
                color: "var(--text-muted)",
                fontSize: "0.78rem",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.35rem",
              }}
              title="Reload verified sample documents from pallets/flask"
            >
              <RefreshCw size={11} />
              <span>Sample Data</span>
            </button>
          </div>
        </form>

        {/* Status / Feedback Notifications */}
        {statusMessage && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "0.65rem",
              padding: "0.45rem 0.85rem",
              borderRadius: 8,
              backgroundColor: "rgba(212, 163, 115, 0.08)",
              border: "1px solid rgba(212, 163, 115, 0.2)",
              fontSize: "0.78rem",
              color: "var(--accent-brass)",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <CheckCircle2 size={13} />
            <span>{statusMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div
            className="animate-fade-in"
            style={{
              marginTop: "0.65rem",
              padding: "0.45rem 0.85rem",
              borderRadius: 8,
              backgroundColor: "rgba(224, 122, 95, 0.12)",
              border: "1px solid rgba(224, 122, 95, 0.25)",
              fontSize: "0.78rem",
              color: "var(--accent-terracotta)",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
            }}
          >
            <AlertCircle size={13} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Inspection Preview Drawer */}
        {inspectResult && (
          <div
            className="glass-panel animate-fade-in"
            style={{
              marginTop: "0.85rem",
              padding: "0.95rem 1.15rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.65rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FolderGit2 size={14} color="var(--accent-brass)" />
                <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)" }}>
                  Discovered Documentation Files ({inspectResult.discovered_files.length})
                </span>
              </div>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
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
                    padding: "3px 8px",
                    borderRadius: 5,
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
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
