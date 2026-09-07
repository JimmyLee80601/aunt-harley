/* Aunt Harley tablet PWA — chat against the local brain */

const PERSONA = [
  "You are Aunt Harley, Trystan's favorite step-aunt and creative sidekick. You live on his tablet, 100% local, totally private. Every word between you two stays between you two.",
  "Who you are: Warm, sweet, playful, endlessly patient. A huge nerd for art and computers who loves sharing it. You make him feel smart even when he's stuck. You celebrate wins ten times louder than you sigh over mistakes.",
  "How you talk: Short, punchy, friendly. A little goofy, a little mom-energy. Explain things like he's never seen a computer, and never make him feel dumb for asking. Sometimes call him kiddo or champ. Never use markdown formatting, no bold, no headers, no bullets, no code blocks. Talk like a real person, not a document.",
  "What you help with: ROBLOX Studio (building places, making UGC items, classic t-shirts, selling on the Marketplace), the Squishies brand (Squish Toast, Strawb, Avocadon't, and Boba), meme shirt designs, pixel art, Blender basics, homework, brainstorming, staying motivated, thinking through problems step by step.",
  "Your rules, never bend: Never make things up. If you don't know, say \"I don't know, let's figure it out together.\" Keep everything clean and kind — this is a kid's device, no adult topics ever. Never ask for personal info, passwords, or money. Never tell him to download or install anything without his dad checking first. Never encourage spending real money — Robux plans go through dad. If something seems wrong or scary, tell him to grab his dad. Never keep secrets that hurt.",
  "Your mission: Help Trystan build cool stuff, learn real skills, and make his first Robux — one Squishy t-shirt at a time."
].join("\n");

const LS_CHAT = "auntHarley.chat";
const LS_SETTINGS = "auntHarley.settings";

let settings = { endpoint: "http://127.0.0.1:1234/v1", model: "aunt-harley" };
let attached = null;
let sending = false;

const $ = (id) => document.getElementById(id);

/* ---------- brain status ---------- */
async function checkBrain() {
  const el = $("brain-status");
  try {
    const r = await fetch(settings.endpoint + "/models", { signal: AbortSignal.timeout(4000) });
    if (r.ok) { el.textContent = "brain is awake"; el.className = "status on"; }
    else throw new Error("bad status");
  } catch {
    el.textContent = "brain is napping — tell dad";
    el.className = "status off";
  }
}
setInterval(checkBrain, 20000);

/* ---------- messages ---------- */
function loadChat() {
  try {
    const raw = localStorage.getItem(LS_CHAT);
    if (!raw) return;
    for (const m of JSON.parse(raw)) addMessage(m.role, m.text, m.pic, false);
  } catch {}
}
function saveChat() {
  const msgs = [];
  document.querySelectorAll(".msg").forEach((el) => {
    const what = el.dataset;
    msgs.push({ role: what.role, text: el.textContent.replace(what.pic ? "" : "", "").trim(), pic: what.pic || undefined });
  });
  localStorage.setItem(LS_CHAT, JSON.stringify(msgs));
}
function addMessage(role, text, pic, persist = true) {
  const welcome = $("welcome");
  if (welcome) welcome.remove();
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.dataset.role = role;
  if (pic) {
    div.dataset.pic = pic;
    const img = document.createElement("img");
    img.src = pic;
    img.className = "pic";
    img.alt = "Picture Trystan shared";
    div.appendChild(img);
  }
  const span = document.createElement("span");
  span.textContent = text;
  div.appendChild(span);
  $("chat").appendChild(div);
  $("chat").scrollTop = $("chat").scrollHeight;
  if (persist) saveChat();
  return div;
}
function typing(on) {
  const existing = document.querySelector(".typing");
  if (existing) existing.remove();
  if (!on) return;
  const t = document.createElement("div");
  t.className = "typing";
  t.innerHTML = "<span></span><span></span><span></span>";
  $("chat").appendChild(t);
  $("chat").scrollTop = $("chat").scrollHeight;
}

/* ---------- send ---------- */
async function send(text) {
  if (sending || !text.trim()) return;
  sending = true;
  addMessage("user", text, attached || undefined);
  const pic = attached;
  attached = null;
  $("attach-preview").hidden = true;
  typing(true);

  const history = [];
  document.querySelectorAll(".msg").forEach((el) => {
    if (el.classList.contains("user") && el.dataset.pic) {
      history.push({ role: "user", content: [{ type: "text", text: el.textContent.trim() }, { type: "image_url", image_url: { url: el.dataset.pic } }] });
    } else {
      history.push({ role: el.dataset.role, content: el.textContent.trim() });
    }
  });

  const payload = { model: settings.model, messages: [{ role: "system", content: PERSONA }, ...history], max_tokens: 1024 };
  try {
    const r = await fetch(settings.endpoint + "/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(180000),
    });
    if (!r.ok) throw new Error("brain error " + r.status);
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content || "Hmm, my brain got fuzzy. Try again, kiddo?";
    typing(false);
    addMessage("bot", reply.trim(), pic || undefined);
  } catch (err) {
    typing(false);
    addMessage("bot", "Oops — I can't reach my brain. That's okay, nothing is broken. Ask dad to open Termux and run ./start_aunt_harley.sh, then say hi again!");
  } finally {
    sending = false;
    $("input").focus();
  }
}

/* ---------- wiring ---------- */
function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(LS_SETTINGS));
    if (s) settings = { ...settings, ...s };
  } catch {}
  $("set-endpoint").value = settings.endpoint;
  $("set-model").value = settings.model;
}
function saveSettings() {
  settings.endpoint = ($("set-endpoint").value || settings.endpoint).trim();
  settings.model = ($("set-model").value || settings.model).trim();
  localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  $("settings").hidden = true;
  checkBrain();
}

$("send-btn").addEventListener("click", () => {
  const t = $("input").value;
  $("input").value = "";
  send(t);
});
$("input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("send-btn").click();
  }
});
$("attach-btn").addEventListener("click", () => $("file-input").click());
$("file-input").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1024 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      attached = canvas.toDataURL("image/jpeg", 0.85);
      $("attach-img").src = attached;
      $("attach-preview").hidden = false;
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(f);
  e.target.value = "";
});
$("attach-remove").addEventListener("click", () => {
  attached = null;
  $("attach-preview").hidden = true;
});
$("settings-btn").addEventListener("click", () => { $("settings").hidden = false; });
$("close-settings").addEventListener("click", () => { $("settings").hidden = true; });
$("save-settings").addEventListener("click", saveSettings);
$("clear-chat").addEventListener("click", () => {
  document.querySelectorAll(".msg").forEach((el) => el.remove());
  saveChat();
  loadChat();
});

loadSettings();
checkBrain();
loadChat();
$("input").focus();