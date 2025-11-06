// main.global.js — shared helpers and HTML include loader


function validateEmail(v) {
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validatePassword(v) {
  if (!v || v.length < 8) return false;
  return /[A-Za-z]/.test(v) && /[0-9]/.test(v);
}

function setError(id, message) {
  const el = document.getElementById(id);
  if (el) el.textContent = message;
}

function clearErrors(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });
}

function setMessage(id, msg, kind) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('error','success');
  if (kind === 'error') el.classList.add('error');
  if (kind === 'success') el.classList.add('success');
}

async function loadHtmlIncludes() {
  const includes = document.querySelectorAll('[data-include]');
  for (const el of includes) {
    const url = el.getAttribute('data-include');
    if (!url) continue;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn('Failed to load include:', url, res.status);
        continue;
      }
      const html = await res.text();
      el.innerHTML = html;
    } catch (e) {
      console.error('Error loading include', url, e);
    }
  }
}

function highlightActiveTab() {
  try {
    const tabs = document.querySelectorAll('.tab');
    const url = window.location.pathname.split('/').pop();
    tabs.forEach(t => {
      // treat anchors and buttons
      const href = t.getAttribute('href');
      if (href) {
        const target = href.split('/').pop();
        if (target === url || (target === '' && (url === 'index.html' || url === ''))) {
          t.classList.add('active');
        } else {
          t.classList.remove('active');
        }
      }
    });
  } catch (e) { console.error(e); }
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadHtmlIncludes();
  highlightActiveTab();
  document.dispatchEvent(new CustomEvent('includesLoaded'));
});

// Expose helpers globally for page scripts
window.appHelpers = {
  validateEmail,
  validatePassword,
  setError,
  clearErrors,
  setMessage,
  loadHtmlIncludes,
  highlightActiveTab
};
