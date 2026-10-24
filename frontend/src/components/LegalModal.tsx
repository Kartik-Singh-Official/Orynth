import React, { useState, useEffect } from "react";
import {
  X,
  Scale,
  ShieldCheck,
  Lock,
  Zap,
  CheckCircle2,
} from "lucide-react";


export interface LegalModalProps {
  isOpen: boolean;
  initialTab?: "terms" | "privacy";
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  initialTab = "terms",
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">(initialTab);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 11, 14, 0.78)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 150,
        padding: "1.25rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: "100%",
          maxWidth: 720,
          maxHeight: "88vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "rgba(20, 23, 32, 0.92)",
          backdropFilter: "blur(32px) saturate(190%)",
          WebkitBackdropFilter: "blur(32px) saturate(190%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 16,
          boxShadow: "0 32px 90px rgba(0, 0, 0, 0.7)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1.1rem 1.5rem",
            borderBottom: "1px solid var(--border-hairline)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: "rgba(212, 163, 115, 0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--accent-brass)",
              }}
            >
              {activeTab === "terms" ? <Scale size={18} /> : <ShieldCheck size={18} />}
            </div>
            <div>
              <h2
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  letterSpacing: "-0.01em",
                  margin: 0,
                }}
              >
                {activeTab === "terms" ? "Terms & Conditions" : "Privacy Policy"}
              </h2>
              <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Last updated: October 2026 • Orynth Open-Source Contributor Platform
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close legal modal"
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 8,
              transition: "all 0.15s ease",
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-hairline)",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            padding: "0 1rem",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "terms" ? "2px solid var(--accent-brass)" : "2px solid transparent",
              color: activeTab === "terms" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "terms" ? 600 : 400,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              transition: "color 0.2s ease",
            }}
          >
            <Scale size={14} />
            <span>Terms of Service</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            style={{
              padding: "0.75rem 1rem",
              background: "none",
              border: "none",
              borderBottom: activeTab === "privacy" ? "2px solid var(--accent-brass)" : "2px solid transparent",
              color: activeTab === "privacy" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "privacy" ? 600 : 400,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              transition: "color 0.2s ease",
            }}
          >
            <ShieldCheck size={14} />
            <span>Privacy Policy</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.5rem",
            color: "var(--text-secondary)",
            fontSize: "0.88rem",
            lineHeight: 1.65,
          }}
        >
          {activeTab === "terms" ? (
            /* TERMS OF SERVICE */
            <div style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>
              {/* Highlight pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "rgba(212, 163, 115, 0.08)",
                  border: "1px solid rgba(212, 163, 115, 0.25)",
                  borderRadius: 10,
                  fontSize: "0.82rem",
                  color: "var(--text-primary)",
                }}
              >
                <Zap size={16} color="var(--accent-brass)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Hacktoberfest / HackDay Open-Source Edition:</strong> Orynth provides evidence-grounded contributor intelligence with enforced rate limits to safeguard shared Google Gemini API quotas.
                </span>
              </div>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  1. Acceptance of Terms
                </h3>
                <p>
                  By accessing or using Orynth (the "Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the Service. Orynth is an open-source research and onboarding guide developed for developer enablement and open-source documentation exploration.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  2. Rate Limits & Token Fair-Use Policy
                </h3>
                <p>
                  To prevent token exhaustion and ensure equitable access across all contributors under the Google AI Studio free tier:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: "0.4rem 0" }}>
                  <li>
                    <strong>Inference Rate Limits:</strong> Each client IP is limited to a maximum of <strong>15 requests per minute</strong> and a burst limit of <strong>5 requests per 10 seconds</strong>.
                  </li>
                  <li>
                    <strong>In-Memory Caching:</strong> Frequently asked questions and sample prompts are cached for up to 1 hour. Cached queries are served instantly with zero external token expenditure.
                  </li>
                  <li>
                    <strong>Token Capping & Conciseness:</strong> Gemma 4 generations are capped at <strong>300 output tokens</strong> to guarantee concise, 2-to-4 sentence evidence-grounded answers.
                  </li>
                  <li>
                    Automated scraping, denial-of-service attempts, or bypassing rate limits via proxy rotation is strictly prohibited.
                  </li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  3. Evidence Grounding & Safe Refusal Disclaimer
                </h3>
                <p>
                  Orynth implements a strict refusal policy: when repository documentation lacks sufficient evidence to answer a question, the model responds with an explicit refusal rather than hallucinating facts.
                </p>
                <p style={{ marginTop: "0.4rem" }}>
                  While Orynth strives for rigorous fidelity, AI-generated syntheses and citations are informational onboarding aids. Contributor decisions, security-sensitive commands, and production releases must always be verified against the official repository documentation.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  4. Public Repository Ingestion & Read-Only Access
                </h3>
                <p>
                  Orynth only indexes public GitHub repositories using GitHub's public REST APIs in read-only mode. Orynth never accesses private repositories, modifies commit history, or performs write actions without explicit authenticated permission.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  5. Intellectual Property
                </h3>
                <p>
                  The source code of the indexed repository remains the property of its original creators under their respective open-source licenses (MIT, Apache 2.0, BSD, GPL, etc.). Orynth does not claim ownership over any indexed documentation.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  6. Limitation of Liability
                </h3>
                <p>
                  Orynth is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind. In no event shall the maintainers, contributors, or affiliated organizers be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use the platform.
                </p>
              </section>
            </div>
          ) : (
            /* PRIVACY POLICY */
            <div style={{ display: "flex", flexDirection: "column", gap: "1.35rem" }}>
              {/* Highlight pill */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.75rem 1rem",
                  backgroundColor: "rgba(78, 159, 118, 0.08)",
                  border: "1px solid rgba(78, 159, 118, 0.25)",
                  borderRadius: 10,
                  fontSize: "0.82rem",
                  color: "var(--text-primary)",
                }}
              >
                <Lock size={16} color="var(--accent-forest)" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Zero Telemetry Selling & Row Level Security:</strong> Your data is protected by Supabase Row Level Security and never sold or used to train commercial models.
                </span>
              </div>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  1. Information We Collect
                </h3>
                <p>
                  Orynth is built with minimal data collection principles:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: "0.4rem 0" }}>
                  <li>
                    <strong>Authentication Data:</strong> When registering via Supabase, your email and cryptographically hashed password are stored securely in Supabase GoTrue. We never have access to plaintext passwords.
                  </li>
                  <li>
                    <strong>Saved Contributor Records:</strong> If you explicitly save a question, answer, citation, or checklist to your notebook, it is stored in PostgreSQL protected by user-isolated Row Level Security (RLS).
                  </li>
                  <li>
                    <strong>Network IP (Rate Limiting Only):</strong> Client IP addresses are processed in volatile server memory solely to enforce the 15 requests/minute token preservation window. IPs are discarded after 60 seconds and never logged to permanent databases.
                  </li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  2. AI Processing via Google AI Studio
                </h3>
                <p>
                  When you submit a question, the query along with relevant excerpts from public repository documentation is forwarded to Google AI Studio (Gemma 4 model).
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: "0.4rem 0" }}>
                  <li>Prompts are processed in accordance with Google's API Terms of Service.</li>
                  <li>Orynth does not sell, license, or use your prompts to train private AI models.</li>
                  <li>In Demonstration Mode (without an API key), processing happens 100% locally on CPU without sending any data to external servers.</li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  3. Storage, Encryption & Security
                </h3>
                <p>
                  All database communications use TLS 1.3 encryption in transit. Supabase PostgreSQL instances enforce encrypted storage at rest (AES-256). Row Level Security ensures that only your authenticated account token can read, edit, or delete your saved notebooks.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  4. Cookies & Local Storage
                </h3>
                <p>
                  Orynth uses browser local storage exclusively for:
                </p>
                <ul style={{ paddingLeft: "1.25rem", margin: "0.4rem 0" }}>
                  <li>Persisting your Supabase JWT session token so you stay logged in.</li>
                  <li>Storing demo bookmarks when Supabase is not connected.</li>
                  <li>We do NOT use third-party advertising cookies, trackers, or analytics pixels.</li>
                </ul>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  5. Your Rights & Account Purge
                </h3>
                <p>
                  You retain complete ownership over your contributor data. You can delete saved questions directly from the Saved Notebook drawer at any time. If you wish to delete your account entirely, you can purge your user records directly through your Supabase dashboard or by contacting the maintainers.
                </p>
              </section>

              <section>
                <h3 style={{ fontSize: "1rem", color: "var(--text-primary)", fontWeight: 600, marginBottom: "0.4rem" }}>
                  6. Open Source Transparency
                </h3>
                <p>
                  Orynth is fully open source. All code for chunking, vector retrieval, rate limiting, and Supabase schema enforcement is available for public audit in the repository.
                </p>
              </section>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.5rem",
            borderTop: "1px solid var(--border-hairline)",
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            fontSize: "0.78rem",
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CheckCircle2 size={13} color="var(--accent-forest)" />
            <span>Strict Grounding & Token Rate Limiting Compliant</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: 8,
              backgroundColor: "var(--accent-brass)",
              color: "#121316",
              fontWeight: 600,
              fontSize: "0.82rem",
              border: "none",
              cursor: "pointer",
            }}
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
