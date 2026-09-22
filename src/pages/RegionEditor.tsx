import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChoiceGrid } from "../components/ChoiceGrid";
import { RegionScene } from "../components/RegionScene";
import { useAuth } from "../lib/auth";
import { deleteRegion, friendlyError, loadPlanet, saveRegion, type PlanetBundle } from "../lib/data";
import { REGION_KINDS, suggestedRegionKinds } from "../lib/regionOptions";
import type { RegionKind } from "../lib/types";

export function RegionEditor() {
  const { id: planetId, regionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bundle, setBundle] = useState<PlanetBundle | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<RegionKind>("plains");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!planetId) return;
    loadPlanet(planetId).then((b) => {
      setBundle(b);
      const r = b?.regions.find((x) => x.id === regionId);
      if (r) { setName(r.name); setKind(r.kind); setDescription(r.description); }
      else if (b) {
        const s = suggestedRegionKinds(b.planet.config);
        if (s.length && !s.some((k) => k.value === "plains")) setKind(s[0].value);
      }
    }).catch((e) => setError(friendlyError(e)));
  }, [planetId, regionId]);

  if (!bundle) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;
  const isOwner = user?.id === bundle.planet.owner_id;
  if (!isOwner) return <p className="notice">Only the planet's creator can edit its regions.</p>;

  const suggested = suggestedRegionKinds(bundle.planet.config);
  const others = REGION_KINDS.filter((k) => !suggested.includes(k));
  const preview = { id: regionId ?? "preview", planet_id: bundle.planet.id, name: name || "New region", kind, description, traits: {}, sort_order: 0, created_at: "" };

  async function save() {
    if (!planetId) return;
    setBusy(true);
    setError("");
    try {
      await saveRegion({ id: regionId, planet_id: planetId, name: name.trim(), kind, description: description.trim(), sort_order: bundle?.regions.length ?? 0 });
      navigate(`/planets/${planetId}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  async function remove() {
    if (!regionId || !confirm("Delete this region? Creatures living here will become homeless (but not deleted).")) return;
    setBusy(true);
    try {
      await deleteRegion(regionId);
      navigate(`/planets/${planetId}`);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  }

  return (
    <div className="page-narrow" style={{ margin: "0 auto" }}>
      <h1>{regionId ? "Edit region" : "New region"} on {bundle.planet.name}</h1>
      <p className="muted">Regions are the neighborhoods of your planet. Each creature calls one of them home.</p>
      <div className="stack">
        <RegionScene planet={bundle.planet.config} region={preview} organisms={bundle.organisms.filter((o) => o.region_id === regionId)} height={220} />
        <div className="card stack">
          <label className="field">Region name
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="The Glass Shallows" />
          </label>
          <h3>What kind of place is it?</h3>
          <p className="muted small">These fit your planet best:</p>
          <ChoiceGrid items={suggested} value={kind} onChange={setKind} />
          {others.length ? (
            <details>
              <summary className="muted small" style={{ cursor: "pointer" }}>Other region types (these clash with your planet's settings, but it's your world)</summary>
              <div style={{ marginTop: 10 }}><ChoiceGrid items={others} value={kind} onChange={setKind} /></div>
            </details>
          ) : null}
          <label className="field">Describe it (optional)
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} maxLength={2000} placeholder="Warm, shallow water over pink sand. Storms every afternoon." />
          </label>
          {error ? <p className="error">{error}</p> : null}
        </div>
      </div>
      <div className="wizard-actions">
        <div className="row">
          <button className="btn btn-ghost" onClick={() => navigate(`/planets/${planetId}`)} disabled={busy}>Cancel</button>
          {regionId ? <button className="btn btn-danger" onClick={remove} disabled={busy}>Delete</button> : null}
        </div>
        <button className="btn btn-primary" onClick={save} disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save region"}</button>
      </div>
    </div>
  );
}
