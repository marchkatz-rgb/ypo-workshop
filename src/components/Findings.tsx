import type { Finding } from "../lib/rules";

interface Props {
  findings: Finding[];
  acknowledged: string[];
  onAcknowledge?: (id: string) => void;
}

/** Shows the app's questions about a creature. The creator can mark each as answered. */
export function Findings({ findings, acknowledged, onAcknowledge }: Props) {
  if (findings.length === 0) {
    return <p className="notice">Everything about this creature fits its world. Nice work.</p>;
  }
  return (
    <div className="stack">
      {findings.map((f) => {
        const done = acknowledged.includes(f.id);
        return (
          <div key={f.id} className={`finding ${f.level} ${done ? "done" : ""}`}>
            <div>{f.text}</div>
            <div className="finding-q">{f.question}</div>
            {onAcknowledge ? (
              <div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onAcknowledge(f.id)}>
                  {done ? "✓ I explained this in my notes" : "I have an answer for this"}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
