import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { AuthPanel } from "./AuthPanel";

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile, signOut, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-dot" />
          <span>The World According to Miles</span>
        </Link>
        <div className="topbar-right">
          {loading ? null : user ? (
            <>
              <span className="muted small">Hi, {profile?.display_name ?? "Explorer"}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => signOut()}>Sign out</button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowAuth(true)}>Sign in</button>
          )}
        </div>
      </header>
      <main className="page">{children}</main>
      {showAuth ? <AuthPanel onClose={() => setShowAuth(false)} /> : null}
    </>
  );
}
