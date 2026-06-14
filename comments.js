import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const config = window.ROBOROLL_SUPABASE || {};
const configured =
  config.url &&
  config.anonKey &&
  !config.url.includes("YOUR_SUPABASE") &&
  !config.anonKey.includes("YOUR_SUPABASE");
const client = configured ? createClient(config.url, config.anonKey) : null;
const formatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function escapeHtml(value = "") {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function commentMarkup(comment) {
  const reply = comment.admin_reply
    ? `<div class="team-reply">
        <span>RoboRoll team</span>
        <p>${escapeHtml(comment.admin_reply)}</p>
      </div>`
    : "";

  return `<article class="comment-card">
      <header>
        <strong>${escapeHtml(comment.name)}</strong>
        <time datetime="${comment.created_at}">${formatter.format(new Date(comment.created_at))}</time>
      </header>
      <p>${escapeHtml(comment.message)}</p>
      ${reply}
    </article>`;
}

function showMessage(container, message, className = "comment-empty") {
  if (container) container.innerHTML = `<p class="${className}">${escapeHtml(message)}</p>`;
}

async function loadComments(container, { limit, featured = false } = {}) {
  if (!container) return;
  if (!client) {
    showMessage(container, "The community board is being connected. Please check back soon.");
    return;
  }

  let query = client
    .from("feedback")
    .select("id,name,message,admin_reply,created_at,replied_at,featured")
    .eq("visible", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (limit) query = query.limit(limit);
  const { data, error } = await query;

  if (error) {
    showMessage(container, "Messages could not be loaded. Please try again later.");
    return;
  }
  if (!data.length) {
    showMessage(container, "Be the first to share an idea with the RoboRoll team.");
    return;
  }

  const ordered = featured
    ? [...data].sort((a, b) => Number(b.featured) - Number(a.featured))
    : data;
  container.innerHTML = ordered.map(commentMarkup).join("");
}

async function submitComment(form, status, list) {
  if (!client) {
    status.textContent = "The message board still needs its database connection.";
    status.dataset.state = "error";
    return;
  }

  const values = new FormData(form);
  const name = String(values.get("name") || "").trim();
  const message = String(values.get("message") || "").trim();
  const trap = String(values.get("company") || "").trim();

  if (trap) return;
  if (name.length < 2 || name.length > 40) {
    status.textContent = "Please enter a name between 2 and 40 characters.";
    status.dataset.state = "error";
    return;
  }
  if (message.length < 5 || message.length > 800) {
    status.textContent = "Please enter a suggestion between 5 and 800 characters.";
    status.dataset.state = "error";
    return;
  }

  const button = form.querySelector("button[type='submit']");
  button.disabled = true;
  status.textContent = "Posting your suggestion…";
  status.dataset.state = "loading";

  const { error } = await client.from("feedback").insert({ name, message });
  button.disabled = false;

  if (error) {
    status.textContent = "We could not post your message. Please try again.";
    status.dataset.state = "error";
    return;
  }

  form.reset();
  document.querySelector("#feedback-count").textContent = "0";
  status.textContent = "Thank you. Your suggestion is now on the community board.";
  status.dataset.state = "success";
  await loadComments(list, { limit: 3, featured: true });
}

const featuredList = document.querySelector("#featured-comments");
const fullList = document.querySelector("#all-comments");
const form = document.querySelector("#feedback-form");
const status = document.querySelector("#feedback-status");
const textarea = document.querySelector("#feedback-message");

if (featuredList) loadComments(featuredList, { limit: 3, featured: true });
if (fullList) loadComments(fullList);
if (form && status) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    submitComment(form, status, featuredList);
  });
}
if (textarea) {
  textarea.addEventListener("input", () => {
    document.querySelector("#feedback-count").textContent = String(textarea.value.length);
  });
}
