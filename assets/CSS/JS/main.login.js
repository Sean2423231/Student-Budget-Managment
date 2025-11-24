(function(){
  function initAuth() {
    const helpers = window.appHelpers || {};

    // Login
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        helpers.clearErrors(['login-message']);
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        if (!helpers.validateEmail(email)) {
          helpers.setMessage('login-message', 'Please enter a valid email.', 'error');
          return;
        }
        if (!password) {
          helpers.setMessage('login-message', 'Please enter your password.', 'error');
          return;
        }

        try {
          const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            helpers.setMessage('login-message', data.error || 'Login failed', 'error');
            return;
          }

            if (data.user && data.user.email) {
              try { sessionStorage.setItem('sb_user_email', data.user.email); } catch (e) {}
            }
            helpers.setMessage('login-message','Signed in — redirecting...','success');
          setTimeout(() => { window.location.href = 'home.html'; }, 700);
        } catch (err) {
          console.error('Login request failed', err);
          helpers.setMessage('login-message','Server error during login','error');
        }
      });
    }

    // Signup
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        helpers.clearErrors(['signup-name-error','signup-email-error','signup-password-error','signup-password-confirm-error','signup-terms-error','signup-message']);

        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const pass = document.getElementById('signup-password').value;
        const passConfirm = document.getElementById('signup-password-confirm').value;

        if (!name) helpers.setError('signup-name-error','Please enter your name');
        if (!helpers.validateEmail(email)) helpers.setError('signup-email-error','Please enter a valid email');
        if (!pass || pass.length < 4) helpers.setError('signup-password-error','Password must be at least 4 chars');
        if (pass !== passConfirm) helpers.setError('signup-password-confirm-error','Passwords do not match');
        const errors = ['signup-name-error','signup-email-error','signup-password-error','signup-password-confirm-error'].some(id => document.getElementById(id).textContent.trim() !== '');
        if (errors) return;

        try {
          const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password: pass })
          });
          const data = await res.json();
          if (!res.ok || !data.ok) {
            helpers.setMessage('signup-message', data.error || 'Registration failed', 'error');
            return;
          }

            if (data.user && data.user.email) {
              try { sessionStorage.setItem('sb_user_email', data.user.email); } catch (e) {}
            }
            helpers.setMessage('signup-message','Account created — taking you to onboarding...','success');
          setTimeout(() => { window.location.href = 'onboarding.html?onboard=true' }, 900);
        } catch (err) {
          console.error('Register request failed', err);
          helpers.setMessage('signup-message','Server error during registration','error');
        }
      });
    }
  }

  document.addEventListener('includesLoaded', initAuth);

  document.addEventListener('DOMContentLoaded', initAuth);
})();
