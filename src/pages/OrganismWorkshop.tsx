import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChoiceGrid } from "../components/ChoiceGrid";
import { CreatureSprite } from "../components/CreatureSprite";
import { DrawingEditor } from "../components/DrawingEditor";
import { Findings } from "../components/Findings";
import { MentorPanel } from "../components/MentorPanel";
import { useAuth } from "../lib/auth";
import { friendlyError, loadPlanet, saveOrganism, type PlanetBundle } from "../lib/data";
import {
  ACTIVITY_OPTIONS, BODY_OPTIONS, BREATHING_OPTIONS, COVERING_OPTIONS, DEFAULT_APPEARANCE, DEFAULT_TRAITS,
  DEFENSE_OPTIONS, DIET_OPTIONS, KIND_OPTIONS, LIMB_OPTIONS, LOCOMOTION_OPTIONS, PALETTE, PATTERN_OPTIONS,
  REPRODUCTION_OPTIONS, SENSE_OPTIONS, SIZE_OPTIONS, SOCIAL_OPTIONS,
} from "../lib/creatureOptions";
import { checkOrganism } from "../lib/rules";
import { regionInfo } from "../lib/regionOptions";
import type { Appearance, OrganismKind, OrganismTraits, Sense } from "../lib/types";

const STEPS = ["Name", "Home", "Food & size", "Moving & breathing", "Senses", "Life cycle", "Defense & behavior", "Appearance", "Check"] as const;

/** Guided creature creation and editing. */
export function OrganismWorkshop() {
  const { id: planetId, orgId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bundle, setBundle] = useState<PlanetBundle | null>(null);
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<OrganismKind>("animal");
  const [regionId, setRegionId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [traits, setTraits] = useState<OrganismTraits>(DEFAULT_TRAITS);
  const [appearance, setAppearance] = useState<Appearance>(DEFAULT_APPEARANCE);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showMentor, setShowMentor] = useState(false);
  // New creatures get their id up front so drawings can be stored under it before saving.
  const [draftId] = useState(() => orgId ?? crypto.randomUUID());

  useEffect(() => {
    if (!planetId) return;
    loadPlanet(planetId).then((b) => {
      setBundle(b);
      if (!b) return;
      const o = b.organisms.find((x) => x.id === orgId);
      if (o) {
        setName(o.name); setKind(o.kind); setRegionId(o.region_id); setDescription(o.description);
        setTraits(o.traits); setAppearance(o.appearance);
      } else if (b.regions.length) {
        setRegionId(b.regions[0].id);
      }
    }).catch((e) => setError(friendlyError(e)));
  }, [planetId, orgId]);

  const findings = useMemo(
    () => (bundle ? checkOrganism({ kind, traits, appearance, regionId }, bundle.planet.config, bundle.regions, bundle.organisms, orgId) : []),
    [bundle, kind, traits, appearance, regionId, orgId],
  );

  if (!bundle) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
  const isOwner = user?.id === bundle.planet.owner_id;
  if (!isOwner) return <p className="notice">Only the planet's creator can add or change its creatures.</p>;

  const t = (patch: Partial<OrganismTraits>) => setTraits({ ...traits, ...patch });
  const ap = (patch: Partial<Appearance>) => setAppearance({ ...appearance, ...patch });
  const toggleSense = (s: Sense) => t({ senses: traits.senses.includes(s) ? traits.senses.filter((x) => x !== s) : [...traits.senses, s] });
  const toggleEats = (id: string) => t({ eats: traits.eats.includes(id) ? traits.eats.filter((x) => x !== id) : [...traits.eats, id] });
  const others = bundle.organisms.filter((o) => o.id !== orgId);
  const seed = draftId;
  const draft = { name, kind, region: bundle.regions.find((r) => r.id === regionId)?.name ?? null, description, traits, appearance, openQuestions: findings.filter((f) => !traits.acknowledged.includes(f.id)).map((f) => f.text) };

  async function save() {
    if (!planetId) return;
    setBusy(true);
    setError("");
    try {
      const saved = await saveOrganism({ id: draftId, planet_id: planetId, region_id: regionId, name: name.trim(), kind, description: description.trim(), traits, appearance }, orgId ? "update" : "create");
      navigate(`/planets/${planetId}/organisms/${saved.id}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  const preview = (
    <div className="art-frame" style={{ minHeight: 220 }}>
      <CreatureSprite appearance={appearance} kind={kind} seed={seed} size={200} />
    </div>
  );

  return (
    <div className="page-narrow" style={{ margin: "0 auto" }}>
      <div className="wizard-head">
        <h1>{orgId ? `Edit ${name || "creature"}` : "New creature"}</h1>
        <span className="chip">{STEPS[step]} · {step + 1}/{STEPS.length}</span>
      </div>
      <div className="progress"><div style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      <div className="card stack">
        {step === 0 ? (
          <>
            <h2>What is it called, and what is it?</h2>
            <label className="field">Species name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Glasswing skimmer" autoFocus />
            </label>
            <ChoiceGrid items={KIND_OPTIONS} value={kind} onChange={(k) => { setKind(k); if (k === "plant") t({ locomotion: "none", diet: "photosynthesis", breathing: "none", reproduction: "seeds", senses: ["touch"] }); if (k === "microbe") t({ size: "tiny", reproduction: "budding", breathing: "none", senses: ["touch"] }); if (k === "fungus") t({ locomotion: "none", diet: "scavenger", breathing: "none", reproduction: "spores", senses: ["touch"] }); }} />
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2>Where does it live?</h2>
            {bundle.regions.length === 0 ? <p className="notice">This planet has no regions yet. You can still create the creature and give it a home later.</p> : null}
            <ChoiceGrid items={bundle.regions.map((r) => ({ value: r.id, label: r.name, blurb: regionInfo(r.kind).blurb }))} value={regionId ?? undefined} onChange={setRegionId} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2>How big is it, and what does it eat?</h2>
            <h3>Size</h3>
            <ChoiceGrid items={SIZE_OPTIONS} value={traits.size} onChange={(v) => t({ size: v })} compact />
            <h3>Food</h3>
            <ChoiceGrid items={DIET_OPTIONS} value={traits.diet} onChange={(v) => t({ diet: v })} />
            {others.length && ["herbivore", "carnivore", "omnivore", "scavenger", "parasite"].includes(traits.diet) ? (
              <>
                <h3>Which creatures on this planet does it eat or live on?</h3>
                <ChoiceGrid items={others.map((o) => ({ value: o.id, label: o.name, blurb: `${o.kind}` }))} value={traits.eats} onChange={toggleEats} compact />
              </>
            ) : null}
          </>
        ) : null}

        {step === 3 ? (
          <>
            <h2>How does it move and breathe?</h2>
            <h3>Movement</h3>
            <ChoiceGrid items={LOCOMOTION_OPTIONS} value={traits.locomotion} onChange={(v) => t({ locomotion: v })} />
            <h3>Breathing</h3>
            <ChoiceGrid items={BREATHING_OPTIONS} value={traits.breathing} onChange={(v) => t({ breathing: v })} />
          </>
        ) : null}

        {step === 4 ? (
          <>
            <h2>How does it sense the world?</h2>
            <p className="muted">Pick as many as you like.</p>
            <ChoiceGrid items={SENSE_OPTIONS} value={traits.senses} onChange={toggleSense} />
          </>
        ) : null}

        {step === 5 ? (
          <>
            <h2>How does it make more of itself?</h2>
            <ChoiceGrid items={REPRODUCTION_OPTIONS} value={traits.reproduction} onChange={(v) => t({ reproduction: v })} />
            <h3>When is it active?</h3>
            <ChoiceGrid items={ACTIVITY_OPTIONS} value={traits.activity} onChange={(v) => t({ activity: v })} compact />
          </>
        ) : null}

        {step === 6 ? (
          <>
            <h2>How does it stay alive, and how does it act?</h2>
            <h3>Main defense</h3>
            <ChoiceGrid items={DEFENSE_OPTIONS} value={traits.defense} onChange={(v) => t({ defense: v })} />
            <h3>Social life</h3>
            <ChoiceGrid items={SOCIAL_OPTIONS} value={traits.social} onChange={(v) => t({ social: v })} compact />
            <label className="field">Behavior (optional)
              <textarea rows={3} maxLength={2000} value={traits.behavior} onChange={(e) => t({ behavior: e.target.value })} placeholder="Hunts at dusk in packs of three. Sings to claim territory." />
            </label>
            <label className="field">Anatomy notes (optional)
              <textarea rows={3} maxLength={2000} value={traits.anatomy} onChange={(e) => t({ anatomy: e.target.value })} placeholder="Two hearts. Hollow bones filled with light gas." />
            </label>
          </>
        ) : null}

        {step === 7 ? (
          <div className="stack">
            <div className="card" style={{ background: "var(--bg-2)" }}>
              <h3>Your own drawing (optional)</h3>
              <DrawingEditor
                planetId={bundle.planet.id}
                organismId={draftId}
                value={appearance.drawing}
                illustration={appearance.illustration}
                creature={{ name, kind, description, traits: { size: traits.size, locomotion: traits.locomotion, diet: traits.diet } }}
                onChange={(patch) => ap(patch)}
              />
            </div>
            {appearance.drawing?.cutoutPath ? <p className="muted small">The choices below still describe the creature for the app, and they draw the fallback picture used until an illustration exists.</p> : null}
          <div className="grid-2">
            <div className="stack">
              {preview}
              <div className="row">
                <label className="row small"><input type="checkbox" checked={appearance.horns} onChange={(e) => ap({ horns: e.target.checked })} /> Horns</label>
                <label className="row small"><input type="checkbox" checked={appearance.tail} onChange={(e) => ap({ tail: e.target.checked })} /> Tail</label>
                <label className="row small"><input type="checkbox" checked={appearance.glow} onChange={(e) => ap({ glow: e.target.checked })} /> Glows</label>
              </div>
            </div>
            <div className="stack">
              <h3>Body</h3>
              <ChoiceGrid items={BODY_OPTIONS} value={appearance.bodyShape} onChange={(v) => ap({ bodyShape: v })} compact />
              <h3>Limbs</h3>
              <ChoiceGrid items={LIMB_OPTIONS} value={appearance.limbType} onChange={(v) => ap({ limbType: v })} compact />
              <label className="field">How many limbs: {appearance.limbCount}
                <input type="range" min={0} max={8} value={appearance.limbCount} onChange={(e) => ap({ limbCount: Number(e.target.value) })} />
              </label>
              <label className="field">How many eyes: {appearance.eyes}
                <input type="range" min={0} max={8} value={appearance.eyes} onChange={(e) => ap({ eyes: Number(e.target.value) })} />
              </label>
              <h3>Covering</h3>
              <ChoiceGrid items={COVERING_OPTIONS} value={appearance.covering} onChange={(v) => ap({ covering: v })} compact />
              <h3>Pattern</h3>
              <ChoiceGrid items={PATTERN_OPTIONS} value={appearance.pattern} onChange={(v) => ap({ pattern: v })} compact />
              <h3>Main color</h3>
              <div className="swatches">{PALETTE.map((c) => <button type="button" key={c} className={`swatch ${appearance.primary === c ? "selected" : ""}`} style={{ background: c }} onClick={() => ap({ primary: c })} aria-label={c} />)}</div>
              <h3>Second color</h3>
              <div className="swatches">{PALETTE.map((c) => <button type="button" key={c} className={`swatch ${appearance.secondary === c ? "selected" : ""}`} style={{ background: c }} onClick={() => ap({ secondary: c })} aria-label={c} />)}</div>
            </div>
          </div>
          </div>
        ) : null}

        {step === 8 ? (
          <>
            <h2>Does {name || "it"} fit {bundle.planet.name}?</h2>
            <div className="grid-2">
              {preview}
              <div className="stack">
                <Findings findings={findings} acknowledged={traits.acknowledged} onAcknowledge={(id) => t({ acknowledged: traits.acknowledged.includes(id) ? traits.acknowledged.filter((x) => x !== id) : [...traits.acknowledged, id] })} />
              </div>
            </div>
            <label className="field">Your notes: how does it work? (optional)
              <textarea rows={3} maxLength={2000} value={traits.notes} onChange={(e) => t({ notes: e.target.value })} placeholder="It flies in the thin air because its bones are hollow and its wings are ten meters wide." />
            </label>
            <label className="field">Field guide description (optional)
              <textarea rows={3} maxLength={4000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="A cautious grazer that never strays far from the reef edge." />
            </label>
            <div>
              <button type="button" className="btn btn-accent btn-sm" onClick={() => setShowMentor(!showMentor)}>{showMentor ? "Hide the mentor" : "Ask the science mentor about this creature"}</button>
            </div>
            {showMentor ? (
              <MentorPanel planetId={bundle.planet.id} organismId={orgId ?? null} isOwner draft={draft} compact starters={["Does this creature make sense on my planet?", "What would its biggest survival problem be?", "How could I make it fit better without changing the idea?"]} />
            ) : null}
            {error ? <p className="error">{error}</p> : null}
          </>
        ) : null}
      </div>

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))} disabled={busy}>{step === 0 ? "Cancel" : "Back"}</button>
        <div className="row">
          {step > 0 && step < STEPS.length - 1 ? <button className="btn btn-ghost" onClick={() => setStep(STEPS.length - 1)}>Skip to check</button> : null}
          {step === STEPS.length - 1 ? (
            <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>{busy ? "Saving…" : orgId ? "Save changes" : "Add to planet"}</button>
          ) : (
            <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={step === 0 && !name.trim()}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
