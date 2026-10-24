import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";


interface StructuredAnswerViewProps {
  content: string;
}

export const StructuredAnswerView: React.FC<StructuredAnswerViewProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText.trim());
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!content) return null;

  // Split into code blocks vs text blocks
  // Regex matches ```language?\ncode```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let blockCounter = 0;

  const renderInlineFormattedText = (text: string, keyPrefix: string): React.ReactNode[] => {
    // Splits lines to handle lists, headers, and paragraphs
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={`${keyPrefix}-blank-${lineIdx}`} style={{ height: "0.6rem" }} />;
      }

      // Check if heading (### or ##)
      if (trimmed.startsWith("### ")) {
        return (
          <h4
            key={`${keyPrefix}-h4-${lineIdx}`}
            style={{
              fontSize: "0.95rem",
              fontWeight: 600,
              color: "var(--accent-brass)",
              margin: "0.85rem 0 0.35rem 0",
              letterSpacing: "-0.01em",
            }}
          >
            {formatBoldAndCode(trimmed.replace(/^###\s*/, ""))}
          </h4>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h3
            key={`${keyPrefix}-h3-${lineIdx}`}
            style={{
              fontSize: "1.05rem",
              fontWeight: 600,
              color: "var(--text-primary)",
              margin: "1rem 0 0.45rem 0",
              letterSpacing: "-0.02em",
            }}
          >
            {formatBoldAndCode(trimmed.replace(/^##\s*/, ""))}
          </h3>
        );
      }

      // Check if numbered list (e.g. "1. ", "2. ")
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        const stepNum = numMatch[1];
        const stepText = numMatch[2];
        return (
          <div
            key={`${keyPrefix}-num-${lineIdx}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.65rem",
              margin: "0.45rem 0",
            }}
          >
            <span
              style={{
                flexShrink: 0,
                width: 22,
                height: 22,
                borderRadius: 9999,
                backgroundColor: "rgba(212, 163, 115, 0.16)",
                border: "1px solid rgba(212, 163, 115, 0.32)",
                color: "var(--accent-brass)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                marginTop: 2,
              }}
            >
              {stepNum}
            </span>
            <div style={{ flex: 1, lineHeight: 1.65 }}>
              {formatBoldAndCode(stepText)}
            </div>
          </div>
        );
      }

      // Check if bullet point (- or * or •)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        const bulletText = trimmed.replace(/^[-*•]\s+/, "");
        return (
          <div
            key={`${keyPrefix}-bullet-${lineIdx}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.6rem",
              margin: "0.35rem 0",
            }}
          >
            <div
              style={{
                marginTop: "0.45rem",
                width: 5,
                height: 5,
                borderRadius: 9999,
                backgroundColor: "var(--accent-brass)",
                flexShrink: 0,
                boxShadow: "0 0 6px rgba(212, 163, 115, 0.6)",
              }}
            />
            <div style={{ flex: 1, lineHeight: 1.65 }}>
              {formatBoldAndCode(bulletText)}
            </div>
          </div>
        );
      }

      // Standard paragraph line
      return (
        <p
          key={`${keyPrefix}-p-${lineIdx}`}
          style={{
            margin: "0.4rem 0",
            lineHeight: 1.7,
            color: "var(--text-primary)",
          }}
        >
          {formatBoldAndCode(line)}
        </p>
      );
    });
  };

  const formatBoldAndCode = (rawText: string): React.ReactNode => {
    // Regex splits on `code` or **bold** or citations (filename.md)
    const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+\))/g;
    const parts = rawText.split(tokenRegex);

    return parts.map((part, i) => {
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        return (
          <code
            key={i}
            style={{
              fontSize: "0.85em",
              padding: "2px 6px",
              margin: "0 2px",
              borderRadius: 5,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "var(--accent-brass)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong
            key={i}
            style={{
              fontWeight: 600,
              color: "var(--text-primary)",
              letterSpacing: "-0.01em",
            }}
          >
            {part.slice(2, -2)}
          </strong>
        );
      }
      // Source citation in parenthesis e.g. (CONTRIBUTING.md)
      if (part.startsWith("(") && part.endsWith(")") && (part.includes(".md") || part.includes(".rst") || part.includes(".py") || part.includes(".toml"))) {
        return (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              fontSize: "0.75rem",
              padding: "1px 6px",
              margin: "0 3px",
              borderRadius: 4,
              backgroundColor: "rgba(212, 163, 115, 0.12)",
              border: "1px solid rgba(212, 163, 115, 0.25)",
              color: "var(--accent-brass)",
              fontFamily: "var(--font-mono)",
              verticalAlign: "middle",
            }}
          >
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore.trim()) {
      elements.push(
        <div key={`text-${blockCounter}`}>
          {renderInlineFormattedText(textBefore, `blk-${blockCounter}`)}
        </div>
      );
    }

    const lang = match[1] || "bash";
    const codeContent = match[2];
    const currentIndex = blockCounter;

    elements.push(
      <div
        key={`code-${currentIndex}`}
        style={{
          margin: "1rem 0",
          borderRadius: 10,
          backgroundColor: "rgba(10, 12, 18, 0.82)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          overflow: "hidden",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        }}
      >
        {/* Apple Terminal Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.5rem 0.85rem",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <div style={{ width: 9, height: 9, borderRadius: 9999, backgroundColor: "#FF5F56" }} />
            <div style={{ width: 9, height: 9, borderRadius: 9999, backgroundColor: "#FFBD2E" }} />
            <div style={{ width: 9, height: 9, borderRadius: 9999, backgroundColor: "#27C93F" }} />
            <span
              style={{
                marginLeft: "0.5rem",
                fontSize: "0.7rem",
                fontFamily: "var(--font-mono)",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Terminal size={11} /> {lang}
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleCopyCode(codeContent, currentIndex)}
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: 6,
              color: copiedIndex === currentIndex ? "var(--accent-forest)" : "var(--text-secondary)",
              padding: "2px 8px",
              fontSize: "0.72rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s ease",
            }}
          >
            {copiedIndex === currentIndex ? (
              <>
                <Check size={12} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code Body */}
        <pre
          style={{
            margin: 0,
            padding: "0.95rem 1.15rem",
            fontSize: "0.85rem",
            fontFamily: "var(--font-mono)",
            lineHeight: 1.6,
            color: "#E2E8F0",
            overflowX: "auto",
          }}
        >
          <code>{codeContent.trim()}</code>
        </pre>
      </div>
    );

    lastIndex = match.index + match[0].length;
    blockCounter++;
  }

  const textAfter = content.substring(lastIndex);
  if (textAfter.trim()) {
    elements.push(
      <div key={`text-end`}>
        {renderInlineFormattedText(textAfter, `blk-end`)}
      </div>
    );
  }

  return (
    <div style={{ fontSize: "0.96rem", color: "var(--text-primary)" }}>
      {elements}
    </div>
  );
};
