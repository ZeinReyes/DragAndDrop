// src/utils/slot.js
import { updateVariableState } from './state';
import { updateCode, updateVariableTooltips } from './codeGen';
import { nestElement, isOperator } from './nesting';
import { createAutoResizeInput } from './helpers';
import { getDragState, setDragSource, clearDragSource, setDragType, clearDragType } from './draggable';
import { createElementFromType } from './elementFactory';

export function createSlot(whiteboard, codeArea, dimOverlay) {
  const slot = document.createElement('div');
  slot.className = 'slot empty';

  function ensureInput() {
    if (!slot.querySelector('input')) {
      const input = createAutoResizeInput();
      input.addEventListener('input', () => {
        updateCode(whiteboard, codeArea);
        updateVariableTooltips(whiteboard);
      });
      slot.appendChild(input);
    }
  }

  slot.addEventListener('dragover', e => { e.preventDefault(); slot.classList.add('over'); });
  slot.addEventListener('dragleave', () => slot.classList.remove('over'));

  slot.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    slot.classList.remove('over');

    const { _dragSource, _dragType } = getDragState();

    // existing element (from board)
    if (_dragSource) {
      if (slot.contains(_dragSource) || _dragSource.contains(slot)) return;

      const prevParent = _dragSource.parentElement;
      if (prevParent && prevParent.classList.contains('slot')) {
        prevParent.classList.add('empty');
        if (prevParent.children.length === 0) {
          ensureInput();
        }
      }

      nestElement(_dragSource);
      slot.replaceChildren(_dragSource);
      clearDragSource();
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
      return;
    }

    // from palette (new node)
    if (_dragType) {
      const newEl = createElementFromType(_dragType, whiteboard, codeArea, dimOverlay);
      const existing = slot.firstElementChild;
      if (isOperator(newEl) && existing) {
        const leftSlot = newEl.querySelectorAll('.slot')[0];
        nestElement(existing);
        leftSlot.replaceChildren(existing);
      }
      nestElement(newEl);
      slot.replaceChildren(newEl);
      clearDragType();
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
    }
  });

  // always restore input if slot becomes empty
  const observer = new MutationObserver(() => {
    if (slot.children.length === 0) {
      ensureInput();
    }
  });
  observer.observe(slot, { childList: true });

  ensureInput();
  return slot;
}
