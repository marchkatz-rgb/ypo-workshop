import { useState } from "react";
import { Link } from "react-router-dom";
import { CreatureArt } from "../components/CreatureArt";
import { Findings } from "../components/Findings";
import { RegionScene } from "../components/RegionScene";
import { useAuth } from "../lib/auth";
import { DEFAULT_APPEARANCE, DEFAULT_TRAITS } from "../lib/creatureOptions";
import { DEFAULT_PLANET, planetFacts } from "../lib/planetOptions";
import type { Organism, PlanetConfig, Region } from "../lib/types";

// A small sample world used only for the tutorial pictures.
const SAMPLE_PLANET: PlanetConfig = { ...DEFAULT_PLANET, star: "red_dwarf", gravity: "high", atmosphere: "thick", day: "tidally_locked" };

const region: Region = { id: "tut-dusk", planet_id: "tut", name: "The Dusklands", kind: "twilight", description: "", traits: {}, sort_order: 0, created_at: "" };

function make(id: string, name: string, kind: Organism["kind"], traits: Partial<Organism["traits"]>, appearance: Partial<Organism["appearance"]>): Organism {
  return { id, planet_id: "tut", region_id: region.id, name, kind, description: "", traits: { ...DEFAULT_TRAITS, ...traits }, appearance: { ...DEFAULT_APPEARANCE, ...appearance }, created_at: "", updated_at: "" };
}

const emberleaf = make("tut-1", "Emberleaf", "plant", { diet: "photosynthesis", locomotion: "none", size: "medium" }, { bodyShape: "tree", limbType: "roots", limbCount: 6, eyes: 0, covering: "leaves", primary: "#8b5a2b", secondary: "#1c1c1c", tail: false });
const slabhorn = make("tut-2", "Slabhorn", "animal", { diet: "herbivore", locomotion: "walking", size: "large", eats: ["tut-1"] }, { bodyShape: "blob", limbType: "legs", limbCount: 6, covering: "shell", primary: "#8b5a2b", secondary: "#5a5a5a", horns: true });
const vanewing = make("tut-3", "Vanewing", "animal", { diet: "filter_feeder", locomotion: "gliding", size: "small" }, { bodyShape: "slender", limbType: "wings", limbCount: 4, covering: "smooth", primary: "#2fa88a", secondary: "#f5f0e6" });
const badFlyer = make("tut-4", "Skyhorse", "animal", { diet: "herbivore", locomotion: "flying", size: "giant", senses: ["sight"] }, { bodyShape: "blob", limbType: "wings", limbCount: 2, covering: "fur", primary: "#e05252", secondary: "#f2d02f" });

const STEPS = [
  {
    title: "Welcome, world-builder",
    body: (
      <>
        <p>Scientists call this <b>speculative evolution</b>: imagining how life might evolve on a world that isn't Earth, and making it believable. That's what this app is for.</p>
        <p>You build a planet. You decide what lives there. The app asks the questions a scientist would ask, and you decide the answers. Nothing is ever locked; it's your world.</p>
        <div className="row" style={{ justifyContent: "center", gap: 20, marginTop: 8 }}>
          <CreatureArt appearance={vanewing.appearance} kind="animal" seed="tut-3" size={110} />
          <CreatureArt appearance={slabhorn.appearance} kind="animal" seed="tut-2" size={130} />
          <CreatureArt appearance={emberleaf.appearance} kind="plant" seed="tut-1" size={110} />
        </div>
      </>
    ),
  },
  {
    title: "Step 1: Build a planet",
    body: (
      <>
        <p>You make ten choices: the star, how far away it is, the planet's size and gravity, how fast it spins, its air, water, seasons, and moons. Each choice tells you what it means for life.</p>
        <p>Pick a red dwarf star, high gravity, thick air, and a planet that never turns, and here's what your creatures will have to live with:</p>
        <ul style={{ paddingLeft: 20 }}>
          {planetFacts(SAMPLE_PLANET).slice(0, 4).map((f) => <li key={f}>{f}</li>)}
        </ul>
        <p className="muted small">These facts follow your planet everywhere. The creature workshop and the science mentor both use them.</p>
      </>
    ),
  },
  {
    title: "Step 2: Map out regions",
    body: (
      <>
        <p>A planet is made of places: shallow seas, deserts, caves, ice caps, even the open sky. You name each one. The app suggests the kinds that make sense for your planet, and draws each region as a living scene.</p>
        <RegionScene planet={SAMPLE_PLANET} region={region} organisms={[]} height={200} />
        <p className="muted small">This is a twilight region on a planet that never turns: the sun sits on the horizon forever.</p>
      </>
    ),
  },
  {
    title: "Step 3: Invent creatures",
    body: (
      <>
        <p>The creature workshop walks you through the questions that matter: Where does it live? What does it eat? How does it move, breathe, and sense the world? How does it reproduce, defend itself, and behave?</p>
        <p>Then you design how it looks, from body shape and limbs to colors and patterns, and watch it appear as you choose. Or upload your own drawing, and the app will use that instead.</p>
        <div className="row" style={{ justifyContent: "center", gap: 16 }}>
          <div className="art-frame"><CreatureArt appearance={slabhorn.appearance} kind="animal" seed="tut-2" size={150} /></div>
          <div style={{ maxWidth: 260 }}>
            <p><b>Slabhorn</b></p>
            <p className="small muted">Large plant-eater. Six legs, armored back, two horns. Lives in the Dusklands and eats Emberleaf.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Step 4: Does it fit?",
    body: (
      <>
        <p>Before you save a creature, the app checks it against your planet, its home region, and the other species. It doesn't say no. It asks questions.</p>
        <p>Here's what it says about a giant flying plant-eater on a high-gravity planet with no plants yet:</p>
        <Findings
          findings={[
            { id: "a", level: "warn", text: "High gravity plus a big body makes powered flight nearly impossible.", question: "Would gliding from cliffs work better, or should it be smaller?" },
            { id: "b", level: "warn", text: "It eats plants, but no plants or producers exist here yet.", question: "What does it eat? You could add a plant next." },
          ]}
          acknowledged={[]}
        />
        <p className="muted small">You can change the creature, or tap "I have an answer" and explain how it works. Your explanation becomes part of its field guide page.</p>
      </>
    ),
  },
  {
    title: "Step 5: Watch your world",
    body: (
      <>
        <p>Every region shows the creatures that live there, moving the way they move. Tap any creature to open its field guide: anatomy, diet, behavior, who eats whom, and the questions you answered.</p>
        <RegionScene planet={SAMPLE_PLANET} region={region} organisms={[emberleaf, slabhorn, vanewing]} height={220} />
      </>
    ),
  },
  {
    title: "Step 6: Use your own drawings",
    body: (
      <>
        <p>Draw a creature on paper or in a drawing app, then add a photo of it in the Appearance step. Crop it, erase the paper with the slider, and flip it to face the right way.</p>
        <p>Your drawing becomes the main picture on the creature's field guide page, and the science mentor can look at it. Then tap <b>Illustrate my drawing</b>: the app redraws your creature in its own cartoon style, keeping the same body, limbs, and colors, and that illustration is what walks, swims, or flies in the region scenes.</p>
        <p className="muted small">Tip: photograph drawings in even light. Shadows across the page are the one thing the eraser struggles with.</p>
      </>
    ),
  },
  {
    title: "Step 7: Ask the science mentor",
    body: (
      <>
        <p>Every planet and every creature has a mentor tab. Ask it anything: whether an idea makes sense, what would evolve first, what's missing from your food web. It knows your planet's facts and all your species.</p>
        <div className="mentor-log" style={{ maxHeight: "none" }}>
          <div className="msg user">Could my Skyhorse fly here if I made it smaller?</div>
          <div className="msg assistant">Smaller helps a lot. Under high gravity, weight is the enemy, and the thick air actually gives plenty of lift, so a dog-sized Skyhorse with wide wings could work. What would it eat up there, and where would it land to rest?</div>
        </div>
        <p className="muted small">The mentor asks questions back. It never builds the creature for you.</p>
      </>
    ),
  },
  {
    title: "Ready?",
    body: (
      <>
        <p>Anyone can explore the worlds on the home page. To build your own, sign in, tap <b>Create a new planet</b>, and start with a name.</p>
        <p>On an iPad, open the site in Safari, tap the Share button, and choose <b>Add to Home Screen</b> to get it as an app with its own icon.</p>
        <div className="row" style={{ justifyContent: "center", gap: 20, marginTop: 8 }}>
          <CreatureArt appearance={badFlyer.appearance} kind="animal" seed="tut-4" size={120} />
        </div>
      </>
    ),
  },
];

/** A click-through tour of the app for first-time users. */
export function HowItWorks() {
  const [i, setI] = useState(0);
  const { user } = useAuth();
  const step = STEPS[i];
  const last = i === STEPS.length - 1;
  return (
    <div className="page-narrow" style={{ margin: "0 auto" }}>
      <div className="wizard-head">
        <h1>How it works</h1>
        <span className="chip">{i + 1} of {STEPS.length}</span>
      </div>
      <div className="progress"><div style={{ width: `${((i + 1) / STEPS.length) * 100}%` }} /></div>
      <div className="card stack" key={i}>
        <h2>{step.title}</h2>
        {step.body}
      </div>
      <div className="wizard-actions">
        <div className="row">
          <Link to="/" className="btn btn-ghost">Exit</Link>
          {i > 0 ? <button className="btn btn-ghost" onClick={() => setI(i - 1)}>Back</button> : null}
        </div>
        <div className="row">
          <div className="dots" aria-hidden="true">{STEPS.map((_, k) => <button key={k} className={`dot ${k === i ? "on" : ""}`} onClick={() => setI(k)} aria-label={`Go to step ${k + 1}`} />)}</div>
          {last ? (
            user ? <Link to="/planets/new" className="btn btn-primary">Create a planet</Link> : <Link to="/" className="btn btn-primary">Explore the worlds</Link>
          ) : (
            <button className="btn btn-primary" onClick={() => setI(i + 1)}>Next</button>
          )}
        </div>
      </div>
    </div>
  );
}
