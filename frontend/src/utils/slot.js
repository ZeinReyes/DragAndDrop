import { updateVariableState } from './state';
import { updateCode, updateVariableTooltips } from './codeGen';
import { nestElement, canNest, showNestNotification, isOperator } from './nesting';
import { createAutoResizeInput } from './helpers';
import { getDragState, clearDragSource, clearDragType } from './draggable';
import { createElement } from './elementFactory';
import { makeId } from './id';   // ✅ import id generator

export function createSlot(whiteboard, codeArea, dimOverlay) {
  const slot = document.createElement('div');
  slot.className = 'slot empty';
  slot.dataset.type = 'slot';
  slot.id = makeId('slot');    // ✅ unique slot id

  function ensureInput() {
    // Only add input if truly empty (no children)
    if (!slot.querySelector('input') && slot.children.length === 0) {
      const input = createAutoResizeInput();
      input.id = makeId('input'); // ✅ unique input id
      input.dataset.type = 'value';
      input.dataset.source = 'input';

      input.addEventListener('input', () => {
        // keep slot dataset updated
        slot.dataset.value = input.value.trim();
        updateCode(whiteboard, codeArea);
        updateVariableTooltips(whiteboard);
      });

      slot.appendChild(input);
    }
  }

  // 🧠 Prevent clicking from reverting to input if already filled
  slot.addEventListener('click', () => {
    const hasChild = slot.querySelector('.operator, .variable');
    if (hasChild) return; // don’t show input again
    const input = slot.querySelector('input');
    if (input) input.focus();
  });

  slot.addEventListener('dragover', e => {
    e.preventDefault();
    slot.classList.add('over');
  });

  slot.addEventListener('dragleave', () => slot.classList.remove('over'));

  slot.addEventListener('drop', e => {
    e.preventDefault();
    e.stopPropagation();
    slot.classList.remove('over');

    const { _dragSource, _dragType } = getDragState();

    // ✅ Case 1: Moving existing element
    if (_dragSource) {
      if (!canNest(slot, _dragSource)) {
        showNestNotification("You can’t drop that here!");
        return;
      }

      if (slot.contains(_dragSource) || _dragSource.contains(slot)) return;

      const prevParent = _dragSource.parentElement;
      if (prevParent && prevParent.classList.contains('slot')) {
        prevParent.classList.add('empty');
        if (prevParent.children.length === 0) ensureInput();
      }

      nestElement(_dragSource);
      slot.replaceChildren(_dragSource);

      // ✅ Mark slot as filled
      slot.classList.remove('empty');

      clearDragSource();
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
      return;
    }

    // ✅ Case 2: Creating new element from palette
    // ✅ Case 2: Creating new element from palette
if (_dragType) {
  const newEl = createElement(_dragType, whiteboard, codeArea, dimOverlay);

  if (!canNest(slot, newEl)) {
    showNestNotification("You can’t drop that here!");
    return;
  }

  const existing = slot.firstElementChild;

  if (isOperator(newEl) && existing) {
  const leftSlot = newEl.querySelectorAll('.slot')[0];

  // Recreate fresh element for the existing one
  const type = existing.dataset?.type || "value";
  const fresh = createElement(type, whiteboard, codeArea, dimOverlay);

  if (fresh) {
    // only copy input if both sides actually have one
    const oldInput = existing.querySelector?.('input');
    const newInput = fresh.querySelector?.('input');
    if (oldInput && newInput) {
      newInput.value = oldInput.value;
      fresh.dataset.value = oldInput.value;
    }

    nestElement(fresh);
    leftSlot.replaceChildren(fresh);
  }

  nestElement(newEl);
  slot.replaceChildren(newEl);
} else {
    // Normal case: just drop in
    nestElement(newEl);
    slot.replaceChildren(newEl);
  }

  slot.classList.remove('empty');

  clearDragType();
  updateVariableState(whiteboard, dimOverlay);
  updateCode(whiteboard, codeArea);
  updateVariableTooltips(whiteboard);
}
  });

  const observer = new MutationObserver(() => {
    // Restore input only if truly empty (no operators/variables)
    const hasChild = slot.querySelector('.operator, .variable');
    if (!hasChild && slot.children.length === 0) ensureInput();
  });
  observer.observe(slot, { childList: true });

  ensureInput();
  return slot;
}
