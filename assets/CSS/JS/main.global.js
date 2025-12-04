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
  
  // Get email before loading includes to prevent flash
  const email = sessionStorage.getItem('sb_user_email');
  
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
  
  // Attach sign-out handlers to any page-level sign-out controls
  try {
    const signButtons = document.querySelectorAll('#sign-out, .sign-out, [data-signout]');
    signButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        try { sessionStorage.removeItem('sb_user_email'); } catch (e) {}
        try { sessionStorage.removeItem('sb_user_id'); } catch (e) {}
        window.location.href = 'main.html';
      });
    });
  } catch (e) { /* ignore */ }

  // Set email immediately to prevent flash
  try {
    if (email) {
      const emailBtn = document.getElementById('user-email-btn');
      if (emailBtn && !emailBtn.textContent.includes('@')) {
        emailBtn.textContent = email;
      }
    }
  } catch (e) { }
}

function highlightActiveTab() {
  try {
    const tabs = document.querySelectorAll('.tab');
    const url = window.location.pathname.split('/').pop();
    tabs.forEach(t => {
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
  // Redirect to login if not logged in and not on public page
  try {
    const publicPages = ['login.html', 'onboarding.html', 'index.html', ''];
    const raw = window.location.pathname.split('/').pop() || '';
    const page = raw.split('?')[0];
    const isPublic = publicPages.includes(page);
    const loggedIn = !!sessionStorage.getItem('sb_user_email');
    if (!isPublic && !loggedIn) {
      window.location.href = 'login.html';
      return;
    }
  } catch (e) { }

  await loadHtmlIncludes();
  highlightActiveTab();
  
  document.dispatchEvent(new CustomEvent('includesLoaded'));
});

window.appHelpers = {
  validateEmail,
  validatePassword,
  setError,
  clearErrors,
  setMessage,
  loadHtmlIncludes,
  highlightActiveTab
};
