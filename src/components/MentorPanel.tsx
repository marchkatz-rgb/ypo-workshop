import { useEffect, useRef, useState, type FormEvent } from "react";
import { askMentor, clearMentorHistory, friendlyError, loadMentorHistory } from "../lib/data";
import { useAuth } from "../lib/auth";

interface Props {
  planetId: string;
  organismId?: string | null;
  isOwner: boolean;
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
export function MentorPanel({ planetId, organismId = null, isOwner, draft, starters, compact }: Props) {
  const { user } = useAuth();
  const [lines, setLines] = useState<Line[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !isOwner) return;
    loadMentorHistory(planetId, organismId)
      .then((h) => setLines(h.map((m) => ({ role: m.role, content: m.content }))))
      .catch(() => {});
  }, [planetId, organismId, user, isOwner]);

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
      const reply = await askMentor({ planetId, organismId, message: trimmed, draft });
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

  if (!user || !isOwner) {
    return <p className="muted small">The science mentor talks with the planet's creator. Sign in as the owner to ask questions.</p>;
  }

  return (
    <div className="mentor">
      {lines.length === 0 && !busy ? (
        <p className="muted small">Ask the mentor anything about your world: whether an idea makes sense, what would evolve here, or how to make a creature fit better. The mentor asks questions back. You stay the creator.</p>
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
          <button type="button" className="btn btn-ghost btn-sm" onClick={async () => { await clearMentorHistory(planetId, organismId).catch(() => {}); setLines([]); }}>Clear conversation</button>
        </div>
      ) : null}
    </div>
  );
}
