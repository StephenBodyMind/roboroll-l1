import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.ROBOROLL_SUPABASE || {};
const configured = config.url && config.anonKey && !config.url.includes("YOUR_SUPABASE");
const client = configured ? createClient(config.url, config.anonKey) : null;
const loginSection = document.querySelector("#admin-login");
const boardSection = document.querySelector("#admin-board");
const loginForm = document.querySelector("#admin-login-form");
const loginStatus = document.querySelector("#admin-login-status");
const signoutButton = document.querySelector("#admin-signout");
const refreshButton = document.querySelector("#admin-refresh");
const list = document.querySelector("#admin-comments");

function escapeHtml(value = "") {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function setSignedIn(signedIn) {
  loginSection.hidden = signedIn;
  boardSection.hidden = !signedIn;
  signoutButton.hidden = !signedIn;
}

function adminCard(comment) {
  return `<article class="admin-comment-card" data-id="${comment.id}">
    <header>
      <div><strong>${escapeHtml(comment.name)}</strong><time>${new Date(comment.created_at).toLocaleString()}</time></div>
      <div class="admin-toggles">
        <label><input type="checkbox" data-field="featured" ${comment.featured ? "checked" : ""} /> Featured</label>
        <label><input type="checkbox" data-field="visible" ${comment.visible ? "checked" : ""} /> Visible</label>
      </div>
    </header>
    <p class="admin-original-message">${escapeHtml(comment.message)}</p>
    <label class="reply-field">Team reply
      <textarea maxlength="1200" rows="4">${escapeHtml(comment.admin_reply || "")}</textarea>
    </label>
    <div class="admin-card-actions">
      <button class="primary-button save-reply" type="button">Save changes</button>
      <span class="save-status" role="status"></span>
    </div>
  </article>`;
}

async function loadAdminComments() {
  list.innerHTML = '<p class="comment-loading">Loading messages…</p>';
  const { data, error } = await client.from("feedback").select("*").order("created_at", { ascending: false });
  if (error) {
    list.innerHTML = `<p class="comment-empty">${escapeHtml(error.message)}</p>`;
    return;
  }
  list.innerHTML = data.length ? data.map(adminCard).join("") : '<p class="comment-empty">No messages yet.</p>';
}

async function saveCard(card) {
  const reply = card.querySelector("textarea").value.trim();
  const status = card.querySelector(".save-status");
  status.textContent = "Saving…";
  const { error } = await client.from("feedback").update({
    admin_reply: reply || null,
    replied_at: reply ? new Date().toISOString() : null,
    featured: card.querySelector('[data-field="featured"]').checked,
    visible: card.querySelector('[data-field="visible"]').checked,
  }).eq("id", card.dataset.id);
  status.textContent = error ? error.message : "Saved";
  status.dataset.state = error ? "error" : "success";
}

if (!client) {
  loginStatus.textContent = "Add your Supabase project URL and anon key to supabase-config.js first.";
  loginStatus.dataset.state = "error";
} else {
  const { data } = await client.auth.getSession();
  setSignedIn(Boolean(data.session));
  if (data.session) await loadAdminComments();
  client.auth.onAuthStateChange(async (_event, session) => {
    setSignedIn(Boolean(session));
    if (session) await loadAdminComments();
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!client) return;
  loginStatus.textContent = "Signing in…";
  const { error } = await client.auth.signInWithPassword({
    email: document.querySelector("#admin-email").value.trim(),
    password: document.querySelector("#admin-password").value,
  });
  loginStatus.textContent = error ? error.message : "";
  loginStatus.dataset.state = error ? "error" : "success";
});
signoutButton.addEventListener("click", () => client?.auth.signOut());
refreshButton.addEventListener("click", loadAdminComments);
list.addEventListener("click", (event) => {
  const button = event.target.closest(".save-reply");
  if (button) saveCard(button.closest(".admin-comment-card"));
});
