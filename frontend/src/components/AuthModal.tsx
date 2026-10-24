import React, { useState, useEffect } from "react";
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Database,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getSupabaseCredentials,
  setCustomSupabaseCredentials,
  clearCustomSupabaseCredentials,
} from "../supabase";

export interface AuthModalProps {
  onOpenLegal?: (tab: "terms" | "privacy") => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onOpenLegal }) => {
  const {
    authModalOpen,
    authModalMode,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
    continueAsGuest,
    isConfigured,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"login" | "signup" | "config">(authModalMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Config tab state
  const [customUrl, setCustomUrl] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [configStatus, setConfigStatus] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(authModalMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [authModalMode, authModalOpen]);

  useEffect(() => {
    const creds = getSupabaseCredentials();
    setCustomUrl(creds.url);
    setCustomKey(creds.hasKey ? "••••••••••••••••" : "");
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      if (activeTab === "login") {
        if (!email || !password) {
          throw new Error("Please provide both email and password.");
        }
        await signIn(email, password);
      } else if (activeTab === "signup") {
        if (!email || !password) {
          throw new Error("Please provide an email and password.");
        }
        if (password.length < 6) {
          throw new Error("Password should be at least 6 characters.");
        }
        const res = await signUp(email, password, fullName);
        if (res?.user && !res?.session) {
          setSuccessMsg(
            `Account created! A confirmation link was sent to ${email}. Please verify your email before logging in, or continue as Guest below.`
          );
        }
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.toLowerCase().includes("email not confirmed")) {
        setErrorMsg(
          "Your email address is not confirmed yet. Please click the confirmation link sent to your inbox by Supabase, or continue as Guest below."
        );
      } else if (msg.toLowerCase().includes("invalid login credentials")) {
        setErrorMsg("Invalid email or password. Please verify your credentials or create a new account.");
      } else {
        setErrorMsg(msg || "Authentication failed. Please check your credentials or network connection.");
      }
    } finally {
      setSubmitting(false);
    }
  };


  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim() || customKey === "••••••••••••••••") {
      setConfigStatus("Please enter a valid Supabase Project URL and Anon API Key.");
      return;
    }
    try {
      setCustomSupabaseCredentials(customUrl, customKey);
      setConfigStatus("Supabase credentials saved successfully!");
      setTimeout(() => {
        setConfigStatus(null);
        setActiveTab("login");
      }, 1200);
    } catch (err: any) {
      setConfigStatus("Failed to save credentials: " + err.message);
    }
  };

  const handleResetConfig = () => {
    clearCustomSupabaseCredentials();
    const creds = getSupabaseCredentials();
    setCustomUrl(creds.url);
    setCustomKey("");
    setConfigStatus("Reset to default configuration.");
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 11, 14, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: "100%",
          maxWidth: 480,
          backgroundColor: "rgba(20, 23, 32, 0.88)",
          backdropFilter: "blur(28px) saturate(190%)",
          WebkitBackdropFilter: "blur(28px) saturate(190%)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 16,
          boxShadow: "0 30px 80px rgba(0, 0, 0, 0.6)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-hairline)",
            backgroundColor: "var(--bg-surface-2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <KeyRound size={18} color="var(--accent-brass)" />
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)" }}>
              {activeTab === "login" && "Log in to Orynth"}
              {activeTab === "signup" && "Create an Orynth Account"}
              {activeTab === "config" && "Supabase Database Settings"}
            </h2>
          </div>
          <button
            onClick={closeAuthModal}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--border-hairline)",
            backgroundColor: "var(--bg-canvas)",
          }}
        >
          <button
            onClick={() => {
              setActiveTab("login");
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: activeTab === "login" ? "var(--bg-surface-1)" : "transparent",
              border: "none",
              borderBottom: activeTab === "login" ? "2px solid var(--accent-brass)" : "2px solid transparent",
              color: activeTab === "login" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "login" ? 600 : 400,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setActiveTab("signup");
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: activeTab === "signup" ? "var(--bg-surface-1)" : "transparent",
              border: "none",
              borderBottom: activeTab === "signup" ? "2px solid var(--accent-brass)" : "2px solid transparent",
              color: activeTab === "signup" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "signup" ? 600 : 400,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Sign Up
          </button>
          <button
            onClick={() => {
              setActiveTab("config");
              setErrorMsg(null);
            }}
            style={{
              flex: 1,
              padding: "0.75rem",
              background: activeTab === "config" ? "var(--bg-surface-1)" : "transparent",
              border: "none",
              borderBottom: activeTab === "config" ? "2px solid var(--accent-brass)" : "2px solid transparent",
              color: activeTab === "config" ? "var(--text-primary)" : "var(--text-muted)",
              fontWeight: activeTab === "config" ? 600 : 400,
              fontSize: "0.85rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <Database size={13} />
            Supabase
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.25rem" }}>
          {errorMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 0.85rem",
                borderRadius: 4,
                backgroundColor: "rgba(217, 93, 93, 0.15)",
                border: "1px solid rgba(217, 93, 93, 0.3)",
                color: "#ff8b8b",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{errorMsg}</div>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 0.85rem",
                borderRadius: 4,
                backgroundColor: "rgba(78, 159, 118, 0.15)",
                border: "1px solid rgba(78, 159, 118, 0.3)",
                color: "#6dd297",
                fontSize: "0.8rem",
                marginBottom: "1rem",
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <div>{successMsg}</div>
            </div>
          )}

          {/* Config Tab */}
          {activeTab === "config" ? (
            <form onSubmit={handleSaveConfig} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div
                style={{
                  padding: "0.75rem",
                  borderRadius: 6,
                  backgroundColor: "var(--bg-surface-2)",
                  border: "1px solid var(--border-hairline)",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  lineHeight: 1.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Database size={14} color="var(--accent-brass)" />
                  <strong style={{ color: "var(--text-primary)" }}>
                    {isConfigured ? "Connected to Supabase" : "Demo / Local Storage Mode Active"}
                  </strong>
                </div>
                Connect your free Supabase PostgreSQL database to securely save contributor questions, Gemma answers, citations, and onboarding checklists.
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.35rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  SUPABASE PROJECT URL
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: 4,
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.35rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  SUPABASE ANON API KEY
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "var(--bg-canvas)",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: 4,
                    color: "var(--text-primary)",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-mono)",
                    outline: "none",
                  }}
                />
              </div>

              {configStatus && (
                <div style={{ fontSize: "0.78rem", color: "var(--accent-brass)", fontStyle: "italic" }}>
                  {configStatus}
                </div>
              )}

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "0.65rem",
                    backgroundColor: "var(--accent-brass)",
                    color: "#121316",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: 4,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Save & Connect
                </button>
                <button
                  type="button"
                  onClick={handleResetConfig}
                  style={{
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "transparent",
                    border: "1px solid var(--border-hairline)",
                    borderRadius: 4,
                    color: "var(--text-secondary)",
                    fontSize: "0.8rem",
                    cursor: "pointer",
                  }}
                >
                  Reset
                </button>
              </div>

              <div
                style={{
                  borderTop: "1px solid var(--border-hairline)",
                  paddingTop: "0.75rem",
                  fontSize: "0.75rem",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>Database schema ready at <code>supabase/schema.sql</code></span>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: "var(--accent-brass)",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    textDecoration: "none",
                  }}
                >
                  Supabase Dashboard <ExternalLink size={11} />
                </a>
              </div>
            </form>
          ) : (
            /* Login / Signup Forms */
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {activeTab === "signup" && (
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-secondary)",
                      marginBottom: "0.35rem",
                    }}
                  >
                    Your Name or Handle
                  </label>
                  <div style={{ position: "relative" }}>
                    <UserIcon
                      size={15}
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
                      placeholder="e.g. Alex Chen"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.65rem 0.85rem 0.65rem 2.2rem",
                        backgroundColor: "var(--bg-canvas)",
                        border: "1px solid var(--border-hairline)",
                        borderRadius: 4,
                        color: "var(--text-primary)",
                        fontSize: "0.85rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Email Address
                </label>
                <div style={{ position: "relative" }}>
                  <Mail
                    size={15}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="contributor@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2.2rem",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: 4,
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    marginBottom: "0.35rem",
                  }}
                >
                  Password
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    size={15}
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2.2rem",
                      backgroundColor: "var(--bg-canvas)",
                      border: "1px solid var(--border-hairline)",
                      borderRadius: 4,
                      color: "var(--text-primary)",
                      fontSize: "0.85rem",
                      outline: "none",
                    }}
                  />
                </div>
                {activeTab === "signup" && (
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                    Minimum 6 characters.
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  backgroundColor: "var(--accent-brass)",
                  color: "#121316",
                  fontWeight: 600,
                  border: "none",
                  borderRadius: 4,
                  fontSize: "0.85rem",
                  cursor: submitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "0.25rem",
                }}
              >
                {submitting && <Loader2 size={16} className="spin" />}
                {activeTab === "login" ? "Sign In" : "Create Contributor Account"}
              </button>

              {/* Divider & One-Click Guest Access */}
              <div style={{ display: "flex", alignItems: "center", margin: "0.85rem 0 0.5rem 0", gap: "0.5rem" }}>
                <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)" }} />
                <span style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>or</span>
                <div style={{ flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)" }} />
              </div>

              <button
                type="button"
                onClick={() => continueAsGuest()}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 6,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.45rem",
                  transition: "all 0.2s var(--ease-apple)",
                }}
              >
                <UserIcon size={14} color="var(--accent-brass)" />
                <span>Continue as Guest (Instant Access without Email)</span>
              </button>


              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.78rem",
                  color: "var(--text-secondary)",
                  marginTop: "0.5rem",
                }}
              >
                {activeTab === "login" ? (
                  <span>
                    New to Orynth?{" "}
                    <button
                      type="button"
                      onClick={() => openAuthModal("signup")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-brass)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Sign up for free
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => openAuthModal("login")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-brass)",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                      }}
                    >
                      Log in here
                    </button>
                  </span>
                )}
              </div>

              {/* Legal Terms & Privacy Agreement Notice */}
              <div
                style={{
                  textAlign: "center",
                  fontSize: "0.72rem",
                  color: "var(--text-muted)",
                  marginTop: "0.5rem",
                  lineHeight: 1.4,
                  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                  paddingTop: "0.65rem",
                }}
              >
                By continuing, you agree to Orynth's{" "}
                <button
                  type="button"
                  onClick={() => {
                    closeAuthModal();
                    onOpenLegal?.("terms");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    padding: 0,
                  }}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  onClick={() => {
                    closeAuthModal();
                    onOpenLegal?.("privacy");
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-secondary)",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    padding: 0,
                  }}
                >
                  Privacy Policy
                </button>
                .
              </div>
            </form>

          )}
        </div>
      </div>
    </div>
  );
};
