(function(){
  const CART_KEY='zoan_cart';
  const COUPON_KEY='zoan_coupon';
  const coupons={ DESCUENTO10:0.10, DESCUENTO20:0.20 };

  function getCart(){
    try {
      const raw = localStorage.getItem(CART_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch(e){
      return [];
    }
  }
  function setCart(cart){
    localStorage.setItem(CART_KEY, JSON.stringify(Array.isArray(cart)?cart:[]));
    updateCount();
    renderCart(); // re-render inmediato al cambiar el carrito
  }
  function updateCount(){
    const count=getCart().reduce((s,i)=>s+(Number(i?.qty)||0),0);
    document.querySelectorAll('#cart-count').forEach(el=> el.textContent=String(count));
  }

  function addItem({name, price, image}){
    if(!name || !price) return;
    const cart=getCart();
    const idx=cart.findIndex(i => i && i.name===name);
    if(idx>=0){ cart[idx].qty = (Number(cart[idx].qty)||0) + 1; }
    else { cart.push({name, price: Number(price)||0, qty:1, image: image || null}); }
    setCart(cart);
    renderCart(); // actualiza el panel y el resumen al instante
  }
  // Remueve solo una unidad; si queda en 0, elimina el ítem
  function removeItem(name){
    const cart = getCart();
    const idx = cart.findIndex(i => i && i.name === name);
    if (idx >= 0) {
        const current = Number(cart[idx].qty) || 0;
        const next = Math.max(current - 1, 0);
        if (next === 0) {
            cart.splice(idx, 1);
        } else {
            cart[idx].qty = next;
        }
        setCart(cart);
        renderCart();
    }
  }
  function clearCart(){
    setCart([]);
    renderCart();
  }
  function applyCoupon(code){
    code = (code||'').trim().toUpperCase();
    const pct = coupons[code] || 0;
    localStorage.setItem(COUPON_KEY, pct ? code : '');
    renderCart();
    return pct>0;
  }
  function getCouponPct(){
    const code = localStorage.getItem(COUPON_KEY)||'';
    return coupons[code]||0;
  }

  function formatCurrency(num){ return '$' + num.toLocaleString('es-AR'); }

  function calculateTotals(){
    const cart=getCart();
    const subtotal = cart.reduce((s,i)=> s + i.price*i.qty, 0);
    const pct=getCouponPct();
    const discount = Math.round(subtotal * pct);
    const total = subtotal - discount;
    return {subtotal, discount, total, pct};
  }

  function parsePriceText(text){
    const digits = String(text||'').replace(/[^\d]/g,'');
    return digits ? parseInt(digits, 10) : 0;
  }

  function attachAddToCartButtons(){
    document.querySelectorAll('li').forEach(li => {
      const nameEl = li.querySelector('h4');
      const priceEl = li.querySelector('.precio');
      if(!nameEl || !priceEl) return;
      if(li.querySelector('.add-to-cart')) return;

      const btn = document.createElement('button');
      btn.className = 'add-to-cart';
      btn.textContent = 'Agregar al carrito';
      btn.style.marginTop = '0.5rem';
      btn.style.padding = '0.4rem 0.8rem';
      btn.style.borderRadius = '0.6rem';
      btn.style.background = '#4CAF50';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.cursor = 'pointer';
      // Centrado horizontal del botón
      btn.style.display = 'block';
      btn.style.margin = '0.5rem auto';

      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const name = nameEl.textContent.trim();
        const price = parsePriceText(priceEl.textContent);
        const imgEl = li.querySelector('img');
        const img = imgEl ? imgEl.src : null;
        addItem({name, price, image: img});
        toast('Agregado: ' + name);
        openCartDrawer();
      });

      li.appendChild(btn);
    });
  }

  function toast(text){
    const el = document.createElement('div');
    el.textContent = text;
    el.style.position='fixed';
    el.style.bottom='1rem';
    el.style.right='1rem';
    el.style.background='rgba(0,0,0,0.8)';
    el.style.color='#fff';
    el.style.padding='0.6rem 0.8rem';
    el.style.borderRadius='0.6rem';
    el.style.zIndex='1300';
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 1500);
  }

  // Render dentro del panel del layout
  function renderCart(){
    const root = document.getElementById('cart-panel');
    const container = root ? root.querySelector('#cart-items') : null;
    const subtotalEl = root ? root.querySelector('#cart-subtotal') : null;
    const discountEl = root ? root.querySelector('#cart-discount') : null;
    const totalEl = root ? root.querySelector('#cart-total') : null;
    const emptyEl = root ? root.querySelector('#cart-empty') : null;

    if(!container) { updateCount(); return; }
    const cart = getCart();
    container.innerHTML = '';

    if(cart.length === 0){
      if(emptyEl) emptyEl.style.display = 'block';
    } else {
      if(emptyEl) emptyEl.style.display = 'none';
      cart.forEach(item => {
        const row = document.createElement('div');
        row.className = 'cart-row';
        row.style.display='flex';
        row.style.alignItems='center';
        row.style.justifyContent='space-between';
        row.style.gap='0.5rem';
        row.style.margin = '0.5rem 0';

        const info = document.createElement('div');
        info.style.display='flex';
        info.style.alignItems='center';
        info.style.gap='0.5rem';

        if(item.image){
          const img = document.createElement('img');
          img.src = item.image;
          img.style.width='40px';
          img.style.height='40px';
          img.style.objectFit='cover';
          img.style.borderRadius='0.4rem';
          info.appendChild(img);
        }

        const name = document.createElement('span');
        name.textContent = item.name + ' x' + item.qty;
        const price = document.createElement('span');
        price.textContent = formatCurrency(item.price * item.qty);
        price.style.fontWeight='bold';

        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remover';
        removeBtn.style.background='#c0392b';
        removeBtn.style.color='#fff';
        removeBtn.style.border='none';
        removeBtn.style.padding='0.3rem 0.6rem';
        removeBtn.style.borderRadius='0.4rem';
        removeBtn.style.cursor='pointer';
        removeBtn.addEventListener('click', () => removeItem(item.name));

        info.appendChild(name);
        row.appendChild(info);
        row.appendChild(price);
        row.appendChild(removeBtn);

        container.appendChild(row);
      });
    }

    const totals = calculateTotals();
    if(subtotalEl) subtotalEl.textContent = formatCurrency(totals.subtotal);
    if(discountEl) discountEl.textContent = totals.discount > 0
      ? `- ${formatCurrency(totals.discount)} (${Math.round(totals.pct*100)}%)`
      : formatCurrency(0);
    if(totalEl) totalEl.textContent = formatCurrency(totals.total);
    updateCount();
  }

  function openCartDrawer(){
    const drawer = document.getElementById('cart-drawer');
    if(drawer){ drawer.classList.add('open'); drawer.setAttribute('aria-hidden','false'); }
    renderCart(); // sincroniza al abrir el panel
  }
  function closeCartDrawer(){
    const drawer = document.getElementById('cart-drawer');
    if(drawer){ drawer.classList.remove('open'); drawer.setAttribute('aria-hidden','true'); }
  }

  function initCartUI(){
    const btn = document.getElementById('floating-cart-button');
    if(btn){ btn.addEventListener('click', openCartDrawer); }
    const close = document.getElementById('close-cart');
    if(close){ close.addEventListener('click', closeCartDrawer); }

    // Eventos de cupón y checkout dentro del panel
    const root = document.getElementById('cart-panel');
    if(root){
      const couponForm = root.querySelector('#coupon-form');
      if(couponForm){
        couponForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const codeInput = root.querySelector('#coupon-code');
          const code = codeInput ? codeInput.value : '';
          const ok = applyCoupon(code);
          alert(ok ? 'Cupón aplicado' : 'Cupón inválido');
        });
      }
      const checkoutBtn = root.querySelector('#checkout-btn');
      if(checkoutBtn){
        checkoutBtn.addEventListener('click', () => {
          const { total } = calculateTotals();
          if(total <= 0){ alert('Tu carrito está vacío'); return; }
          alert('Compra finalizada. Total: ' + formatCurrency(total));
          clearCart();
          closeCartDrawer();
        });
      }
    }
  }

  window.cart = { addItem, removeItem, getCart, setCart, applyCoupon, calculateTotals, renderCart, updateCount, openCartDrawer, closeCartDrawer };

  function initAll(){
    attachAddToCartButtons();
    renderCart();
    initCartUI();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll(); // el DOM ya está listo, inicializa de inmediato
  }
})();