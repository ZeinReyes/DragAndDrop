// src/utils/movable.js
import { freeElement, nestElement, isOperator } from './nesting';
import { updateVariableState } from './state';
import { updateCode, updateVariableTooltips } from './codeGen';

export function makeMovable(el, whiteboard, codeArea, dimOverlay) {
  if (!el) return;
  let moving = false, dx = 0, dy = 0;

  function stopMoving() {
    if (!moving) return;
    moving = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  }

  function onMouseDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.closest('.slot')) return;
    if (el.dataset.nested === 'true') return;
    moving = true;
    const rect = el.getBoundingClientRect();
    dx = e.clientX - rect.left;
    dy = e.clientY - rect.top;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  function onMouseMove(e) {
    if (!moving) return;
    const wb = whiteboard.getBoundingClientRect();
    const x = e.clientX - wb.left - dx;
    const y = e.clientY - wb.top - dy;
    freeElement(el, x, y);
  }

  function onMouseUp(e) {
    if (!moving) return stopMoving();
    stopMoving();

    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    el.style.visibility = 'hidden';
    const underneath = document.elementFromPoint(cx, cy);
    el.style.visibility = '';

    const slot = underneath ? underneath.closest('.slot') : null;
    if (slot && whiteboard.contains(slot)) {
      if (slot.contains(el) || el.contains(slot)) return;
      const prevParent = el.parentElement;
      if (prevParent && prevParent.classList.contains('slot')) prevParent.classList.add('empty');

      const existing = slot.firstElementChild;
      if (isOperator(el) && existing) {
        const leftSlot = el.querySelectorAll('.slot')[0];
        nestElement(existing);
        leftSlot.replaceChildren(existing);
      }

      nestElement(el);
      slot.replaceChildren(el);
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
    }
  }

  el.addEventListener('mousedown', onMouseDown);
  el.addEventListener('dragend', stopMoving);
}
