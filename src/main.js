import { supabase, isConfigured } from "./supabase.js";

const statusEl = document.getElementById("status");
const entriesEl = document.getElementById("entries");
const form = document.getElementById("guestbook-form");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");

function setStatus(kind, text) {
  statusEl.className = `status status-${kind}`;
  statusEl.textContent = text;
}

function formatDate(iso) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function renderEntries(rows) {
  entriesEl.replaceChildren();
  if (!rows.length) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No entries yet. Be the first to sign!";
    entriesEl.append(li);
    return;
  }
  for (const row of rows) {
    const li = document.createElement("li");
    li.className = "entry";

    const meta = document.createElement("div");
    meta.className = "entry-meta";
    const name = document.createElement("span");
    name.className = "entry-name";
    name.textContent = row.name;
    const time = document.createElement("time");
    time.dateTime = row.created_at;
    time.textContent = formatDate(row.created_at);
    meta.append(name, time);

    const msg = document.createElement("p");
    msg.className = "entry-message";
    msg.textContent = row.message;

    li.append(meta, msg);
    entriesEl.append(li);
  }
}

async function loadEntries() {
  const { data, error } = await supabase
    .from("guestbook")
    .select("id, name, message, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) {
    setStatus("bad", `Supabase error: ${error.message}`);
    entriesEl.replaceChildren();
    return;
  }
  setStatus("ok", "Connected to Supabase");
  renderEntries(data);
}

async function handleSubmit(event) {
  event.preventDefault();
  formError.hidden = true;
  submitBtn.disabled = true;

  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const message = String(formData.get("message") || "").trim();

  const { error } = await supabase.from("guestbook").insert({ name, message });

  submitBtn.disabled = false;
  if (error) {
    formError.textContent = `Could not post: ${error.message}`;
    formError.hidden = false;
    return;
  }
  form.reset();
  await loadEntries();
}

if (!isConfigured) {
  setStatus("bad", "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  entriesEl.replaceChildren();
  submitBtn.disabled = true;
} else {
  form.addEventListener("submit", handleSubmit);
  loadEntries();
}
