"use client";
import React from "react";

// Rendu Markdown très léger : **gras**, _italique_, listes, titres de ligne.
// Suffisant pour les réponses du chatbot (pas de markdown complet pour éviter une dépendance).
export function MessageMarkdown({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuffer: { kind: "ul" | "ol"; items: string[] } | null = null;

  const flushList = () => {
    if (listBuffer && listBuffer.items.length > 0) {
      const items = listBuffer.items;
      blocks.push(
        listBuffer.kind === "ul" ? (
          <ul key={`ul-${blocks.length}`}>
            {items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}
          </ul>
        ) : (
          <ol key={`ol-${blocks.length}`}>
            {items.map((it, i) => <li key={i}>{renderInline(it)}</li>)}
          </ol>
        )
      );
      listBuffer = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushList();
      continue;
    }
    // Liste à puces
    const ulMatch = line.match(/^\s*[•\-*]\s+(.*)$/);
    if (ulMatch) {
      if (!listBuffer || listBuffer.kind !== "ul") {
        flushList();
        listBuffer = { kind: "ul", items: [] };
      }
      listBuffer.items.push(ulMatch[1]);
      continue;
    }
    // Liste numérotée
    const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    if (olMatch) {
      if (!listBuffer || listBuffer.kind !== "ol") {
        flushList();
        listBuffer = { kind: "ol", items: [] };
      }
      listBuffer.items.push(olMatch[1]);
      continue;
    }
    flushList();
    blocks.push(
      <p key={`p-${blocks.length}`} className="md-line">
        {renderInline(line)}
      </p>
    );
  }
  flushList();

  return <div className="chat-md">{blocks}</div>;
}

function renderInline(text: string): React.ReactNode[] {
  // Gère **gras** et _italique_ (non imbriqués, suffisant)
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const tok = match[0];
    if (tok.startsWith("**")) {
      parts.push(<strong key={key++}>{tok.slice(2, -2)}</strong>);
    } else {
      parts.push(<em key={key++}>{tok.slice(1, -1)}</em>);
    }
    lastIndex = match.index + tok.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
