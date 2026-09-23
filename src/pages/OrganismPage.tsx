import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CreatureArt } from "../components/CreatureArt";
import { CreatureSprite } from "../components/CreatureSprite";
import { Findings } from "../components/Findings";
import { MentorPanel } from "../components/MentorPanel";
import { useAuth } from "../lib/auth";
import { deleteOrganism, drawingUrl, friendlyError, loadPlanet, type PlanetBundle } from "../lib/data";
import {
  ACTIVITY_OPTIONS, BREATHING_OPTIONS, DEFENSE_OPTIONS, DIET_OPTIONS, LOCOMOTION_OPTIONS, REPRODUCTION_OPTIONS,
  SENSE_OPTIONS, SIZE_OPTIONS, SOCIAL_OPTIONS, optLabel,
} from "../lib/creatureOptions";
import { regionInfo } from "../lib/regionOptions";
import { checkOrganism } from "../lib/rules";

/** The field guide page for one organism. */
export function OrganismPage() {
  const { id: planetId, orgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bundle, setBundle] = useState<PlanetBundle | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planetId) return;
    loadPlanet(planetId).then(setBundle).catch((e) => setError(friendlyError(e)));
  }, [planetId, user?.id]);

  if (error) return <p className="error">{error}</p>;
  if (!bundle) return <p className="muted">Loading…</p>;
  const o = bundle.organisms.find((x) => x.id === orgId);
  if (!o) return <p className="notice">This creature doesn't exist here.</p>;
  const { planet, regions, organisms } = bundle;
  const isOwner = user?.id === planet.owner_id;
  const region = regions.find((r) => r.id === o.region_id);
  const eats = organisms.filter((x) => o.traits.eats.includes(x.id));
  const eatenBy = organisms.filter((x) => x.traits.eats.includes(o.id));
  const findings = checkOrganism({ kind: o.kind, traits: o.traits, appearance: o.appearance, regionId: o.region_id }, planet.config, regions, organisms, o.id);
  const open = findings.filter((f) => !o.traits.acknowledged.includes(f.id));

  async function remove() {
    if (!confirm(`Remove ${o!.name} from ${planet.name}?`)) return;
    try {
      await deleteOrganism(o!.id, planet.id);
      navigate(`/planets/${planet.id}`);
    } catch (e) {
      setError(friendlyError(e));
    }
  }

  return (
    <>
      <p className="small"><Link to={`/planets/${planet.id}`}>← Back to {planet.name}</Link></p>
      <div className="grid-2" style={{ alignItems: "start" }}>
        <div className="stack">
          <div className="art-frame" style={{ minHeight: 280 }}>
            <CreatureSprite appearance={o.appearance} kind={o.kind} seed={o.id} size={260} />
          </div>
          {o.appearance.drawing?.cutoutPath ? (
            <div className="row small" style={{ justifyContent: "space-between" }}>
              <span className="muted">Drawn by the creator</span>
              <a href={drawingUrl(o.appearance.drawing.originalPath)} target="_blank" rel="noreferrer">View original picture</a>
              <span className="row" style={{ gap: 6 }}><span className="muted">App version:</span><CreatureArt appearance={o.appearance} kind={o.kind} seed={o.id} size={48} /></span>
            </div>
          ) : null}
          {isOwner ? (
            <div className="row">
              <Link to={`/planets/${planet.id}/organisms/${o.id}/edit`} className="btn btn-primary btn-sm">Edit creature</Link>
              <button className="btn btn-danger btn-sm" onClick={remove}>Remove</button>
            </div>
          ) : null}
        </div>
        <div className="stack">
          <div>
            <div className="muted small">Field guide entry</div>
            <h1>{o.name}</h1>
            <div className="chips">
              <span className="chip accent">{optLabel(SIZE_OPTIONS, o.traits.size)} {o.kind}</span>
              {region ? <span className="chip">Lives in {region.name} ({regionInfo(region.kind).label.toLowerCase()})</span> : <span className="chip">No home region yet</span>}
            </div>
          </div>
          {o.description ? <p>{o.description}</p> : null}
          <div className="stats">
            <div className="stat"><b>Diet</b>{optLabel(DIET_OPTIONS, o.traits.diet)}</div>
            <div className="stat"><b>Moves by</b>{optLabel(LOCOMOTION_OPTIONS, o.traits.locomotion)}</div>
            <div className="stat"><b>Breathes with</b>{optLabel(BREATHING_OPTIONS, o.traits.breathing)}</div>
            <div className="stat"><b>Senses</b>{o.traits.senses.map((s) => optLabel(SENSE_OPTIONS, s)).join(", ") || "None"}</div>
            <div className="stat"><b>Reproduction</b>{optLabel(REPRODUCTION_OPTIONS, o.traits.reproduction)}</div>
            <div className="stat"><b>Defense</b>{optLabel(DEFENSE_OPTIONS, o.traits.defense)}</div>
            <div className="stat"><b>Active</b>{optLabel(ACTIVITY_OPTIONS, o.traits.activity)}</div>
            <div className="stat"><b>Social life</b>{optLabel(SOCIAL_OPTIONS, o.traits.social)}</div>
          </div>
          {o.traits.behavior ? <div><h3>Behavior</h3><p>{o.traits.behavior}</p></div> : null}
          {o.traits.anatomy ? <div><h3>Anatomy</h3><p>{o.traits.anatomy}</p></div> : null}
          {o.traits.notes ? <div><h3>How it works</h3><p>{o.traits.notes}</p></div> : null}
          <div>
            <h3>Food web</h3>
            {eats.length ? <p>Eats: {eats.map((x) => <Link key={x.id} to={`/planets/${planet.id}/organisms/${x.id}`}>{x.name}</Link>).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), [])}</p> : <p className="muted">Doesn't eat any other known species.</p>}
            {eatenBy.length ? <p>Eaten by: {eatenBy.map((x) => <Link key={x.id} to={`/planets/${planet.id}/organisms/${x.id}`}>{x.name}</Link>).reduce<React.ReactNode[]>((acc, el, i) => (i ? [...acc, ", ", el] : [el]), [])}</p> : <p className="muted">Nothing is known to eat it.</p>}
          </div>
        </div>
      </div>

      <section className="card" style={{ marginTop: 16 }}>
        <h2>How it fits {planet.name}</h2>
        {open.length === 0 && findings.length > 0 ? <p className="notice">The creator has answered every question about this creature.</p> : null}
        <Findings findings={open} acknowledged={o.traits.acknowledged} />
      </section>

      {isOwner ? (
        <section className="card" style={{ marginTop: 16 }}>
          <h2>Ask the mentor about {o.name}</h2>
          <MentorPanel planetId={planet.id} organismId={o.id} isOwner={isOwner} starters={["What would this creature's day look like?", "What might it evolve into after a million years?", "What would hunt it, and how would it cope?"]} />
        </section>
      ) : null}
    </>
  );
}
