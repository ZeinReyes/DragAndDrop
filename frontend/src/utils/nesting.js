// src/utils/nesting.js
export function nestElement(el) {
  if (!el) return;
  el.dataset.nested = 'true';
  el.style.position = 'static';
  el.style.removeProperty('left');
  el.style.removeProperty('top');
  const parentSlot = el.parentElement;
  if (parentSlot && parentSlot.classList.contains('slot')) parentSlot.classList.remove('empty');
}

export function freeElement(el, x = 24, y = 24) {
  if (!el) return;
  el.dataset.nested = 'false';
  el.style.position = 'absolute';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  const prevParent = el.parentElement;
  if (prevParent && prevParent.classList.contains('slot')) {
    prevParent.classList.add('empty');
  }
}

export function isOperator(el) { return el && el.classList.contains('operator'); }
export function isVariable(el) { return el && el.classList.contains('variable'); }
