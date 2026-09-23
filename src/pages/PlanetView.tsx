import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreatureSprite } from "../components/CreatureSprite";
import { MentorPanel } from "../components/MentorPanel";
import { RegionScene } from "../components/RegionScene";
import { useAuth } from "../lib/auth";
import { deletePlanet, friendlyError, loadPlanet, updatePlanet, type PlanetBundle } from "../lib/data";
import { optLabel, DIET_OPTIONS, SIZE_OPTIONS } from "../lib/creatureOptions";
import { PLANET_STEPS, climateOf, labelFor, planetFacts } from "../lib/planetOptions";
import { regionInfo } from "../lib/regionOptions";
import { PlanetIcon } from "./Home";

export function PlanetView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bundle, setBundle] = useState<PlanetBundle | null>(null);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<"regions" | "species" | "facts" | "mentor">("regions");

  const reload = useCallback(() => {
    if (!id) return;
    loadPlanet(id).then((b) => { if (!b) setNotFound(true); else setBundle(b); }).catch((e) => setError(friendlyError(e)));
  }, [id]);

  useEffect(() => { reload(); }, [reload, user?.id]);

  if (notFound) return <p className="notice">This planet doesn't exist, or it's private.</p>;
  if (error) return <p className="error">{error}</p>;
  if (!bundle) return <p className="muted">Loading planet…</p>;

  const { planet, regions, organisms, owner } = bundle;
  const isOwner = user?.id === planet.owner_id;
  const homeless = organisms.filter((o) => !o.region_id || !regions.some((r) => r.id === o.region_id));

  async function togglePublic() {
    await updatePlanet(planet.id, { is_public: !planet.is_public }).catch((e) => setError(friendlyError(e)));
    reload();
  }

  async function remove() {
    if (!confirm(`Delete ${planet.name} and everything living on it? This cannot be undone.`)) return;
    try {
      await deletePlanet(planet.id);
      navigate("/");
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  return (
    <>
      <div className="row spread" style={{ alignItems: "flex-start", marginBottom: 16 }}>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <PlanetIcon planet={planet} size={72} />
          <div>
            <h1>{planet.name}</h1>
            <div className="muted small">Created by {owner?.display_name ?? "an explorer"} · {organisms.length} species · {regions.length} regions{!planet.is_public ? " · private" : ""}</div>
            {planet.description ? <p style={{ marginTop: 6 }}>{planet.description}</p> : null}
          </div>
        </div>
        {isOwner ? (
          <div className="row">
            <Link to={`/planets/${planet.id}/edit`} className="btn btn-ghost btn-sm">Edit planet</Link>
            <button className="btn btn-ghost btn-sm" onClick={togglePublic}>{planet.is_public ? "Make private" : "Make public"}</button>
            <button className="btn btn-danger btn-sm" onClick={remove}>Delete</button>
          </div>
        ) : null}
      </div>

      <div className="chips" style={{ marginBottom: 16 }}>
        {PLANET_STEPS.map((s) => <span key={s.key} className="chip accent">{labelFor(s.key, planet.config[s.key])}</span>)}
        <span className="chip">{climateOf(planet.config).label}</span>
      </div>

      <div className="row" style={{ marginBottom: 16 }}>
        {(["regions", "species", "facts", "mentor"] as const).map((t) => (
          <button key={t} className={`btn btn-sm ${tab === t ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab(t)}>
            {t === "regions" ? "Regions" : t === "species" ? "Species" : t === "facts" ? "Planet facts" : "Science mentor"}
          </button>
        ))}
      </div>

      {tab === "regions" ? (
        <div className="stack">
          {isOwner ? (
            <div className="row">
              <Link to={`/planets/${planet.id}/regions/new`} className="btn btn-primary btn-sm">+ Add a region</Link>
              {regions.length > 0 ? <Link to={`/planets/${planet.id}/organisms/new`} className="btn btn-accent btn-sm">+ Create a creature</Link> : null}
            </div>
          ) : null}
          {regions.length === 0 ? (
            <p className="notice">No regions yet. {isOwner ? "Add a region, like an ocean or a desert, to give life a place to live." : "The creator hasn't mapped this world yet."}</p>
          ) : null}
          {regions.map((r) => {
            const here = organisms.filter((o) => o.region_id === r.id);
            return (
              <section key={r.id} className="card">
                <div className="row spread" style={{ marginBottom: 10 }}>
                  <div>
                    <h2 style={{ marginBottom: 2 }}>{r.name}</h2>
                    <div className="muted small">{regionInfo(r.kind).label} · {here.length} {here.length === 1 ? "species" : "species"}</div>
                  </div>
                  {isOwner ? <Link to={`/planets/${planet.id}/regions/${r.id}/edit`} className="btn btn-ghost btn-sm">Edit region</Link> : null}
                </div>
                <RegionScene planet={planet.config} region={r} organisms={here} onSelect={(o) => navigate(`/planets/${planet.id}/organisms/${o.id}`)} />
                {r.description ? <p className="muted small" style={{ marginTop: 10 }}>{r.description}</p> : null}
                <p className="muted small" style={{ marginTop: 6 }}>Tap a creature to open its field guide page.</p>
              </section>
            );
          })}
          {homeless.length ? (
            <section className="card">
              <h2>Creatures without a home region</h2>
              <div className="grid">{homeless.map((o) => <OrganismCard key={o.id} planetId={planet.id} o={o} />)}</div>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === "species" ? (
        <div className="stack">
          {isOwner ? <div><Link to={`/planets/${planet.id}/organisms/new`} className="btn btn-accent btn-sm">+ Create a creature</Link></div> : null}
          {organisms.length === 0 ? <p className="notice">No life yet. {isOwner ? "Create your first organism." : ""}</p> : null}
          <div className="grid">{organisms.map((o) => <OrganismCard key={o.id} planetId={planet.id} o={o} />)}</div>
        </div>
      ) : null}

      {tab === "facts" ? (
        <div className="card">
          <h2>What life on {planet.name} must deal with</h2>
          <ul style={{ paddingLeft: 20 }}>{planetFacts(planet.config).map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      ) : null}

      {tab === "mentor" ? (
        <div className="card">
          <h2>Science mentor</h2>
          <MentorPanel
            planetId={planet.id}
            isOwner={isOwner}
            starters={["What kinds of life would evolve here first?", "Does my planet's setup make sense?", "What's missing from my food web?", "Give me three wild ideas for regions."]}
          />
        </div>
      ) : null}
    </>
  );
}

function OrganismCard({ planetId, o }: { planetId: string; o: PlanetBundle["organisms"][number] }) {
  return (
    <Link to={`/planets/${planetId}/organisms/${o.id}`} className="card card-link org-card">
      <div className="org-art"><CreatureSprite appearance={o.appearance} kind={o.kind} seed={o.id} size={88} /></div>
      <div style={{ minWidth: 0 }}>
        <h3 style={{ marginBottom: 2 }}>{o.name}</h3>
        <div className="muted small">{optLabel(SIZE_OPTIONS, o.traits.size)} {o.kind} · {optLabel(DIET_OPTIONS, o.traits.diet).toLowerCase()}</div>
      </div>
    </Link>
  );
}
