// PROTOTIPO AP-002a. Tooltip accesible para indicadores técnicos: [data-tip] con ratón (hover) y teclado (focus).
// Un único nodo role="tooltip", enlazado con aria-describedby mientras está visible; Esc lo oculta.
export function initTooltips() {
  const tip = document.createElement('div');
  tip.id = 'tip'; tip.className = 'tip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
  document.body.append(tip);
  let owner = null, timer;
  const show = (el) => {
    clearTimeout(timer);
    owner?.removeAttribute('aria-describedby');
    owner = el;
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    el.setAttribute('aria-describedby', 'tip');
    const r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const left = Math.min(window.innerWidth - t.width - 8, Math.max(8, r.left + r.width / 2 - t.width / 2));
    const top = r.bottom + 8 + t.height > window.innerHeight ? r.top - t.height - 8 : r.bottom + 8;
    tip.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
  };
  const hide = () => { clearTimeout(timer); owner?.removeAttribute('aria-describedby'); owner = null; tip.hidden = true; };
  document.addEventListener('pointerover', (e) => { const el = e.target.closest?.('[data-tip]'); if (el && el !== owner) { clearTimeout(timer); timer = setTimeout(() => show(el), 280); } else if (!el && owner) hide(); });
  document.addEventListener('focusin', (e) => { const el = e.target.closest?.('[data-tip]'); el ? show(el) : hide(); });
  document.addEventListener('focusout', hide);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && owner) hide(); });
  document.addEventListener('scroll', hide, true);
}
