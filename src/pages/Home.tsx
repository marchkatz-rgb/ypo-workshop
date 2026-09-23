import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { friendlyError, listPlanets } from "../lib/data";
import { climateOf, labelFor, starColor } from "../lib/planetOptions";
import type { Planet, Profile } from "../lib/types";

export function PlanetIcon({ planet, size = 64 }: { planet: Planet; size?: number }) {
  const c = planet.config;
  const water = { dry: "#c98a3a", lakes: "#7bb060", oceans: "#3b82f6", waterworld: "#1d5fd6" }[c.water];
  const land = { dry: "#e0a85a", lakes: "#9fd070", oceans: "#7bc850", waterworld: "#3b82f6" }[c.water];
  const glow = starColor(c.star).disc;
  return (
    <div
      className="planet-icon"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at 35% 35%, ${land} 0 22%, ${water} 23% 100%)`,
        boxShadow: `inset -${size / 5}px -${size / 6}px ${size / 3}px rgba(0,0,0,0.55), 0 0 ${size / 3}px ${glow}55`,
      }}
      aria-hidden="true"
    />
  );
}

export function Home() {
  const { user } = useAuth();
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [owners, setOwners] = useState<Record<string, Profile>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listPlanets()
      .then((r) => { setPlanets(r.planets); setOwners(r.owners); setCounts(r.counts); })
      .catch((e) => setError(friendlyError(e)))
      .finally(() => setLoading(false));
  }, [user?.id]);

  return (
    <>
      <section className="hero">
        <h1>Build a planet. Then invent the life that could survive there.</h1>
        <p className="muted" style={{ maxWidth: 640 }}>
          Choose a star, set the gravity and air, carve out regions, and design creatures that truly fit their world.
          The science mentor asks the hard questions. You make the calls.
        </p>
        <div className="row">
          {user ? <Link to="/planets/new" className="btn btn-primary">+ Create a new planet</Link> : null}
          <Link to="/how-it-works" className="btn btn-accent">How it works</Link>
        </div>
        {!user ? <p className="notice" style={{ marginTop: 12 }}>Sign in to create your own planets. Anyone can explore the ones below.</p> : null}
      </section>

      <h2>Worlds</h2>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p className="muted">Loading worlds…</p> : null}
      {!loading && planets.length === 0 ? <p className="muted">No planets yet. Be the first to make one.</p> : null}
      <div className="grid">
        {planets.map((p) => (
          <Link to={`/planets/${p.id}`} key={p.id} className="card card-link">
            <div className="row" style={{ alignItems: "flex-start" }}>
              <PlanetIcon planet={p} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3>{p.name}</h3>
                <div className="muted small">
                  {labelFor("star", p.config.star)} · {climateOf(p.config).label} · {labelFor("gravity", p.config.gravity).toLowerCase()}
                </div>
                <div className="muted small">
                  {counts[p.id] ?? 0} {counts[p.id] === 1 ? "species" : "species"} · by {owners[p.owner_id]?.display_name ?? "an explorer"}
                  {!p.is_public ? " · private" : ""}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
