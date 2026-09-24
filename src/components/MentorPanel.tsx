import { useEffect, useRef, useState, type FormEvent } from "react";
import { askMentor, clearMentorHistory, friendlyError, loadMentorHistory } from "../lib/data";
import { useAuth } from "../lib/auth";

interface Props {
  planetId: string;
  organismId?: string | null;
  /** Whether this viewer may talk to the mentor here. */
  allowed: boolean;
  /** Shown when the viewer isn't allowed (for example, not signed in). */
  disallowedText?: string;
  /** Unsaved creature to include in the conversation. */
  draft?: unknown;
  starters?: string[];
  compact?: boolean;
}

interface Line {
  role: "user" | "assistant";
  content: string;
}

/** Chat with the science mentor about a planet or a specific creature. */
export function MentorPanel({ planetId, organismId = null, allowed, disallowedText, draft, starters, compact }: Props) {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !allowed) return;
    loadMentorHistory(planetId, organismId)
      .then((h) => setLines(h.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => {});
  }, [planetId, organismId, user, allowed]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, busy]);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError("");
    setLines((l) => [...l, { role: "user", content: trimmed }]);
    setText("");
    try {
      const reply = await askMentor({ planetId, organismId, message: trimmed, draft, history: user ? undefined : lines });
      setLines((l) => [...l, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(text);
  }

  if (!allowed) {
    return <p className="muted small">{disallowedText ?? "The mentor isn't available here."}</p>;
  }

  return (
    <div className="mentor">
      {lines.length === 0 && !busy ? (
        <p className="muted small">{user
          ? "Ask the mentor anything about this world: whether an idea makes sense, what would evolve here, or how a creature fits. The mentor asks questions back."
          : "Ask the mentor anything about this creature and its world. You're not signed in, so this conversation stays in your browser for this visit."}</p>
      ) : null}
      {starters && lines.length === 0 ? (
        <div className="chips">
          {starters.map((s) => (
            <button key={s} type="button" className="btn btn-ghost btn-sm" onClick={() => send(s)} disabled={busy}>{s}</button>
          ))}
        </div>
      ) : null}
      <div className="mentor-log" ref={logRef} style={compact ? { maxHeight: 260 } : undefined}>
        {lines.map((l, i) => (
          <div key={i} className={`msg ${l.role}`}>{l.content}</div>
        ))}
        {busy ? <div className="msg assistant muted">Thinking…</div> : null}
      </div>
      {error ? <p className="error small">{error}</p> : null}
      <form className="mentor-form" onSubmit={onSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask the mentor…"
          maxLength={2000}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
        />
        <button className="btn btn-accent" disabled={busy || !text.trim()}>Send</button>
      </form>
      {lines.length > 0 ? (
        <div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { if (user) await clearMentorHistory(planetId, organismId).catch(() => {}); setLines([]); }}>Clear conversation</button>
        </div>
      ) : null}
    </div>
  );
}
