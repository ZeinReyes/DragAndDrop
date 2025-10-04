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
    // Detect if this element is from palette or from board
    if (el.closest('#palette') || el.dataset.source === 'palette') {
      // Palette element — new type
      const type = el.dataset.type || el.id?.replace('-template', '') || 'unknown';
      _dragType = type;
      _dragSource = null;
    } else {
      // Element from whiteboard
      _dragSource = el;
      _dragType = null;
    }

    try {
      e.dataTransfer.setData('text/plain', el.id || '');
    } catch {}
  });

  el.addEventListener('dragend', () => {
    _dragSource = null;
    _dragType = null;
  });
}
