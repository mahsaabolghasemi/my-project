
    if (typeof mockApi === 'undefined' || !mockApi.getBookById) {
      alert('افزودن به سبد ممکن نشد. دوباره تلاش کنید.');
      return;
    }

    mockApi.getBookById(bookId).then(function (book) {
      if (!book) {
        alert('کتاب یافت نشد.');
        return;
      }

      const st = book.stock != null && book.stock !== '' ? Number(book.stock) : null;
      if (st != null && Number.isFinite(st) && st <= 0) {
        alert('این محصول ناموجود است.');
        return;
      }

      if (typeof window.cart === 'undefined' || !window.cart.getItems || !window.cart.add) {
        alert('سبد خرید در دسترس نیست.');
        return;
      }

      var cartItems = window.cart.getItems();
      var line = cartItems.find(function (i) {
        return String(i.id) === String(book.id);
      });
      var curQty = line ? line.quantity : 0;
      if (st != null && Number.isFinite(st) && curQty + 1 > st) {
        alert('تعداد درخواستی بیشتر از موجودی انبار است.');
        return;
      }

      window.cart.add(book, 1).then(function () {
        if (typeof header !== 'undefined' && header.updateBadge) {
          header.updateBadge();
        }
        window.location.href = 'cart.html';
      }).catch(function (err) {
        alert(err && err.message ? err.message : 'افزودن به سبد ناموفق بود.');
      });
    });
  }

  function handleRemoveFromCart(bookId) {
    if (!isLoggedIn()) {