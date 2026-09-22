import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChoiceGrid } from "../components/ChoiceGrid";
import { useAuth } from "../lib/auth";
import { createPlanet, friendlyError, loadPlanet, updatePlanet } from "../lib/data";
import { DEFAULT_PLANET, PLANET_STEPS, climateOf, labelFor, planetFacts } from "../lib/planetOptions";
import type { PlanetConfig } from "../lib/types";

/** Step-by-step planet creation (and editing). */
export function PlanetBuilder() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [config, setConfig] = useState<PlanetConfig>(DEFAULT_PLANET);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(!editing);

  useEffect(() => {
    if (!id) return;
    loadPlanet(id).then((b) => {
      if (!b) { setError("Planet not found."); return; }
      setName(b.planet.name);
      setDescription(b.planet.description);
      setConfig(b.planet.config);
      setReady(true);
    }).catch((e) => setError(friendlyError(e)));
  }, [id]);

  const totalSteps = PLANET_STEPS.length + 2; // name + choices + summary
  const current = step === 0 ? null : step <= PLANET_STEPS.length ? PLANET_STEPS[step - 1] : null;
  const isSummary = step === PLANET_STEPS.length + 1;

  async function save() {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      if (id) {
        await updatePlanet(id, { name: name.trim(), description: description.trim(), config });
        navigate(`/planets/${id}`);
      } else {
        const p = await createPlanet(user.id, name.trim(), description.trim(), config);
        navigate(`/planets/${p.id}`);
      }
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  if (loading) return <p className="muted">Loading…</p>;
  if (!user) return <p className="notice">Sign in to build a planet.</p>;
  if (!ready) return error ? <p className="error">{error}</p> : <p className="muted">Loading planet…</p>;

  return (
    <div className="page-narrow" style={{ margin: "0 auto" }}>
      <div className="wizard-head">
        <h1>{editing ? `Edit ${name || "planet"}` : "New planet"}</h1>
        <span className="chip">Step {step + 1} of {totalSteps}</span>
      </div>
      <div className="progress"><div style={{ width: `${((step + 1) / totalSteps) * 100}%` }} /></div>

      <div className="card">
        {step === 0 ? (
          <div className="stack">
            <h2>Name your planet</h2>
            <p className="muted">Every world starts with a name. You can change it later.</p>
            <label className="field">Planet name
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Veyra Prime" autoFocus />
            </label>
            <label className="field">Short description (optional)
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} rows={3} placeholder="A stormy ocean world circling a dim red star…" />
            </label>
          </div>
        ) : null}

        {current ? (
          <div className="stack">
            <h2>{current.title}</h2>
            <p className="muted">{current.question}</p>
            <ChoiceGrid
              items={current.choices as { value: string; label: string; blurb: string }[]}
              value={config[current.key]}
              onChange={(v) => setConfig({ ...config, [current.key]: v })}
            />
          </div>
        ) : null}

        {isSummary ? (
          <div className="stack">
            <h2>{name || "Your planet"}: the facts</h2>
            <div className="chips">
              {PLANET_STEPS.map((s) => (
                <span key={s.key} className="chip accent">{labelFor(s.key, config[s.key])}</span>
              ))}
              <span className="chip">{climateOf(config).label}</span>
            </div>
            <p className="muted">These are the rules life on {name || "this planet"} has to live by. The mentor and the creature workshop will use them.</p>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {planetFacts(config).map((f) => <li key={f}>{f}</li>)}
            </ul>
            {error ? <p className="error">{error}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="wizard-actions">
        <button className="btn btn-ghost" onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))} disabled={busy}>
          {step === 0 ? "Cancel" : "Back"}
        </button>
        {isSummary ? (
          <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>{busy ? "Saving…" : editing ? "Save changes" : "Create planet"}</button>
        ) : (
          <button className="btn btn-primary" onClick={() => setStep(step + 1)} disabled={step === 0 && !name.trim()}>Next</button>
        )}
      </div>
    </div>
  );
}
