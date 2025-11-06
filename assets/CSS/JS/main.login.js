// main.auth.js — handles login & signup behavior
(function(){
  function initAuth() {
    const helpers = window.appHelpers || {};

    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email');
        const password = document.getElementById('login-password');
        let ok = true;
        helpers.setMessage('login-message','Signed in (demo) — redirecting...','success');
        setTimeout(() => { window.location.href = 'home.html'; }, 900);
      });
    }

    // Signup
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        helpers.clearErrors(['signup-name-error','signup-email-error','signup-password-error','signup-password-confirm-error','signup-terms-error','signup-message']);

        const name = document.getElementById('signup-name');
        const email = document.getElementById('signup-email');
        const pass = document.getElementById('signup-password');
        const passConfirm = document.getElementById('signup-password-confirm');
        const terms = document.getElementById('terms');

        
        helpers.setMessage('signup-message','Account created (demo) — taking you to login...','success');
        setTimeout(() => { window.location.href = 'login.html' }, 1100);
      });

      const emailInput = document.getElementById('signup-email');
      const passInput = document.getElementById('signup-password');
      const passConfirmInput = document.getElementById('signup-password-confirm');

  
    }
  }

  // initialize after includes are loaded
  document.addEventListener('includesLoaded', initAuth);
  // also init if includes are not used (fallback)
  document.addEventListener('DOMContentLoaded', initAuth);
})();
