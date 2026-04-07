/**
 * Login: با API توکن از سرور؛ بدون API whitelist. اگر قبلاً وارد شده‌اید، ورود مجدد ممکن نیست.
 */
(function () {
  if (typeof userState !== 'undefined' && userState.isLoggedIn && userState.isLoggedIn()) {
    var ru = new URLSearchParams(window.location.search).get('return') || 'index.html';
    window.location.replace(ru);
    return;
  }

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');
  if (!form) return;

  function showError(msg) {
    if (!errorEl) return;
    errorEl.textContent = msg || '';
    errorEl.classList.toggle('is-visible', !!msg);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    showError('');

    const username = form.querySelector('#username').value.trim();
    const password = form.querySelector('#password').value;

    if (!username || !password) {
      showError('نام کاربری و رمز عبور الزامی است.');
      return;
    }

    const submitBtn = form.querySelector('.btn-login');
    submitBtn.disabled = true;
    submitBtn.textContent = 'در حال ورود…';

    if (typeof userState === 'undefined' || !userState.login) {
      showError('سرویس ورود در دسترس نیست.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'ورود';
      return;
    }

    userState.login(username, password).then(function (result) {
      if (result.success) {
        const returnUrl = new URLSearchParams(window.location.search).get('return') || 'index.html';
        window.location.href = returnUrl;
      } else {
        showError(result.error || 'ورود ناموفق بود.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'ورود';
      }
    });
  });
})();
