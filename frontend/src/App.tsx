import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { RepositoryBar } from "./components/RepositoryBar";
import { WorkspaceView } from "./components/WorkspaceView";
import { ChecklistView } from "./components/ChecklistView";
import { EvaluationView } from "./components/EvaluationView";
import { SourcesView } from "./components/SourcesView";
import { AuthModal } from "./components/AuthModal";
import { SavedWorkDrawer } from "./components/SavedWorkDrawer";
import { LegalModal } from "./components/LegalModal";
import { AuthProvider } from "./context/AuthContext";
import { fetchHealth, fetchCurrentRepository, type RepositoryMetadata, type DocumentFile } from "./api";
import type { SavedQuestion } from "./supabase";

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"workspace" | "checklist" | "evaluation" | "sources">("workspace");
  const [repository, setRepository] = useState<RepositoryMetadata | null>(null);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [chunksCount, setChunksCount] = useState<number>(0);
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean>(false);
  const [modelName, setModelName] = useState<string>("gemma-4-26b-a4b-it");
  const [prefilledQuery, setPrefilledQuery] = useState<string>("");
  const [restoredQuestion, setRestoredQuestion] = useState<SavedQuestion | null>(null);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState<"terms" | "privacy">("terms");

  const openLegalModal = (tab: "terms" | "privacy") => {
    setLegalInitialTab(tab);
    setLegalModalOpen(true);
  };

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      const health = await fetchHealth();
      setApiKeyConfigured(health.api_key_configured);
      setModelName(health.model);

      const current = await fetchCurrentRepository();
      setRepository(current.metadata);
      setDocuments(current.documents);
      setChunksCount(current.chunks_count);
    } catch (err) {
      console.warn("Backend not yet connected or initializing:", err);
    }
  };

  const handleRepositoryIndexed = (meta: RepositoryMetadata, docs: DocumentFile[], chunks: number) => {
    setRepository(meta);
    setDocuments(docs);
    setChunksCount(chunks);
    initApp();
  };

  const handleAskAboutStep = (stepQuery: string) => {
    setPrefilledQuery(stepQuery);
    setRestoredQuestion(null);
    setActiveTab("workspace");
  };

  const handleRestoreQuestion = (q: SavedQuestion) => {
    setRestoredQuestion(q);
    setActiveTab("workspace");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        repository={repository}
        chunksCount={chunksCount}
        apiKeyConfigured={apiKeyConfigured}
        modelName={modelName}
      />

      <RepositoryBar
        currentRepo={repository}
        onIndexed={handleRepositoryIndexed}
      />

      <main style={{ flex: 1, paddingBottom: "3rem" }}>
        {activeTab === "workspace" && (
          <WorkspaceView
            repository={repository}
            initialQuery={prefilledQuery}
            restoredQuestion={restoredQuestion}
            onSelectChecklistTab={() => setActiveTab("checklist")}
          />
        )}

        {activeTab === "checklist" && (
          <ChecklistView
            onAskAboutStep={handleAskAboutStep}
          />
        )}

        {activeTab === "evaluation" && (
          <EvaluationView />
        )}

        {activeTab === "sources" && (
          <SourcesView
            repository={repository}
            documents={documents}
            chunksCount={chunksCount}
          />
        )}
      </main>

      {/* Global Supabase Auth, Saved Work & Legal Modals */}
      <AuthModal onOpenLegal={openLegalModal} />
      <SavedWorkDrawer onRestoreQuestion={handleRestoreQuestion} />
      <LegalModal
        isOpen={legalModalOpen}
        initialTab={legalInitialTab}
        onClose={() => setLegalModalOpen(false)}
      />

      {/* Footer — Apple Glass Minimalist */}
      <footer
        style={{
          backgroundColor: "var(--bg-surface-1)",
          borderTop: "1px solid var(--border-hairline)",
          padding: "1.25rem 1.5rem",
          fontSize: "0.78rem",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.85rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <strong style={{ color: "var(--text-secondary)" }}>Orynth</strong>
            <span>•</span>
            <span>Evidence-grounded open-source guide</span>
            <span>•</span>
            <span style={{ fontFamily: "var(--font-mono)" }}>Gemma 4 & 15 RPM Token Guard</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => openLegalModal("terms")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.78rem",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-brass)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Terms & Conditions
            </button>

            <span>•</span>

            <button
              type="button"
              onClick={() => openLegalModal("privacy")}
              style={{
                background: "none",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                padding: 0,
                fontSize: "0.78rem",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent-brass)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
            >
              Privacy Policy
            </button>

            <span>•</span>

            <span style={{ color: "var(--text-muted)" }}>
              Supabase RLS Protected
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
