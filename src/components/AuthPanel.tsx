import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import { friendlyError } from "../lib/data";

export function AuthPanel({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setInfo("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() || email.split("@")[0] } },
        });
        if (error) throw error;
        if (data.session) onClose();
        else setInfo("Account created. Check your email for a confirmation link, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onClose();
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="card modal" onClick={(e) => e.stopPropagation()}>
        <div className="row spread">
          <h2>{mode === "signin" ? "Sign in" : "Create an account"}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p className="muted small">Anyone can explore the worlds. You need an account to build or change them.</p>
        <form className="stack" onSubmit={submit}>
          {mode === "signup" ? (
            <label className="field">Your name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Miles" />
            </label>
          ) : null}
          <label className="field">Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label className="field">Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
          </label>
          {error ? <p className="error">{error}</p> : null}
          {info ? <p className="notice">{info}</p> : null}
          <button className="btn btn-primary btn-block" disabled={busy}>{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="center small" style={{ marginTop: 12 }}>
          {mode === "signin" ? (
            <>New here? <a href="#" onClick={(e) => { e.preventDefault(); setMode("signup"); }}>Create an account</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("signin"); }}>Sign in</a></>
          )}
        </p>
      </div>
    </div>
  );
}
