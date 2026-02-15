/**
 * Login page: handle user login.
 */
(function () {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;

    if (!email || !password) {
      alert('Please enter both email and password.');
      return;
    }

    const submitBtn = form.querySelector('.btn-login');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in…';

    if (typeof userState === 'undefined' || !userState.login) {
      alert('Login service is not available.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
      return;
    }

    userState.login(email, password).then(function (result) {
      if (result.success) {
        // Redirect to home or previous page
        const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
        window.location.href = returnUrl;
      } else {
        alert(result.error || 'Login failed. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      }
    });
  });
})();
