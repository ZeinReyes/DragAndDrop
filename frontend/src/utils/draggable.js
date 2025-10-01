// src/utils/draggable.js
let _dragSource = null;
let _dragType = null;

export function getDragState() {
  return { _dragSource, _dragType };
}

export function setDragSource(el) {
  _dragSource = el;
}

export function clearDragSource() {
  _dragSource = null;
}

export function setDragType(type) {
  _dragType = type;
}

export function clearDragType() {
  _dragType = null;
}

export function makeDraggable(el) {
  if (!el) return;
  el.setAttribute('draggable', 'true');
  el.addEventListener('dragstart', (e) => {
    _dragSource = el;
    try { e.dataTransfer.setData('text/plain', el.id || ''); } catch {}
  });
  el.addEventListener('dragend', () => { _dragSource = null; });
}
