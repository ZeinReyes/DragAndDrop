// src/utils/dragAndDrop.js
import { updateVariableState } from './state';
import { updateCode, updateVariableTooltips} from './codeGen';
import { nestElement, freeElement, isOperator } from './nesting';

// Module-level drag state
let _dragSource = null;
let _dragType = null;

/* ---------- Small helpers ---------- */
function attachTooltip(el, defaultText) {
  if (!el) return;
  const globalTooltip = document.getElementById("globalTooltip");

  el.dataset.tooltip = defaultText; // store default

  el.addEventListener("mouseenter", () => {
    if (!globalTooltip) return;
    globalTooltip.textContent = el.dataset.tooltip || defaultText;
    globalTooltip.style.display = "block";
  });
  el.addEventListener("mousemove", (e) => {
    if (!globalTooltip) return;
    globalTooltip.style.left = e.pageX + 12 + "px";
    globalTooltip.style.top = e.pageY - 28 + "px";
  });
  el.addEventListener("mouseleave", () => {
    if (!globalTooltip) return;
    globalTooltip.style.display = "none";
  });
}

/* ---------- Draggable (HTML5) ---------- */
export function makeDraggable(el) {
  if (!el) return;
  el.setAttribute('draggable', 'true');
  el.addEventListener('dragstart', (e) => {
    _dragSource = el;
    try { e.dataTransfer.setData('text/plain', el.id || ''); } catch {}
  });
  el.addEventListener('dragend', () => { _dragSource = null; });
}

function createAutoResizeInput() {
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter value';
  input.className = 'typed-input';

  input.style.width = '78px';
  input.style.minWidth = '38px';

  input.addEventListener('input', () => {
    input.style.width = '70px'; 
    input.style.width = Math.max(38, input.scrollWidth + 8) + 'px';
  });

  return input;
}

/* ---------- Slot factory ---------- */
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

    // existing element (from board)
    if (_dragSource) {
      if (slot.contains(_dragSource) || _dragSource.contains(slot)) return;

      const prevParent = _dragSource.parentElement;
      if (prevParent && prevParent.classList.contains('slot')) {
        prevParent.classList.add('empty');
        if (prevParent.children.length === 0) {
          const input = document.createElement('input');
          input.type = 'text';
          input.placeholder = 'value';
          input.className = 'typed-input';
          input.value = '';
          input.addEventListener('input', () => {
            updateCode(whiteboard, codeArea);
            updateVariableTooltips(whiteboard);
          });
          prevParent.appendChild(input);
        }
      }

      nestElement(_dragSource);
      slot.replaceChildren(_dragSource);
      _dragSource = null;
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
      _dragType = null;
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

/* ---------- Element factory ---------- */
export function createElementFromType(type, whiteboard, codeArea, dimOverlay) {
  const makeId = (prefix='node') => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;

  if (type === 'variable') {
  const v = document.createElement('div');
  v.className = 'variable';
  v.id = makeId('variable');

  const top = document.createElement('div');
  top.className = 'top';

  const label = document.createElement('div');
  label.className = 'var-label';
  label.textContent = 'result';

  const eq = document.createElement('div');
  eq.className = 'var-eq';
  eq.textContent = '=';

  // slot now goes INSIDE top (beside =)
  const slot = createSlot(whiteboard, codeArea, dimOverlay);
  slot.classList.add('variable-slot');

  top.appendChild(label);
  top.appendChild(eq);
  top.appendChild(slot);

  const editHint = document.createElement('div');
  editHint.className = 'var-edit';
  editHint.textContent = 'Double-click name to rename';

  label.addEventListener('dblclick', (ev) => {
    ev.stopPropagation();
    const inputBox = document.createElement('input');
    inputBox.type = 'text';
    inputBox.value = label.textContent;
    inputBox.className = 'var-name-input';
    label.replaceWith(inputBox);
    inputBox.focus();

    function finish() {
      const text = inputBox.value.trim() || 'result';
      label.textContent = text;
      inputBox.replaceWith(label);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
    }

    inputBox.addEventListener('blur', finish, { once: true });
    inputBox.addEventListener('keydown', (k) => {
      if (k.key === 'Enter') inputBox.blur();
    });
  });

  v.appendChild(top);
  v.appendChild(editHint);

  makeDraggable(v);
  makeMovable(v, whiteboard, codeArea, dimOverlay);
  attachTooltip(v, "Variable: Double-click name to edit. Type a value or drop an operator/variable.");
  return v;
}

// ---------- IF NODE ----------
if (type === 'if') {
  const ifNode = document.createElement('div');
  ifNode.className = 'if-node';
  ifNode.id = `if-${Date.now().toString(36)}`;

  // Condition slot
  const condSlot = createSlot(whiteboard, codeArea, dimOverlay);
  condSlot.classList.add('if-cond');

  // Action slot
  const bodySlot = createSlot(whiteboard, codeArea, dimOverlay);
  bodySlot.classList.add('if-body');

  // Labels
  const labelIf = document.createElement('span');
  labelIf.textContent = 'if (';
  const labelArrow = document.createElement('span');
  labelArrow.textContent = ') =>';

  ifNode.appendChild(labelIf);
  ifNode.appendChild(condSlot);
  ifNode.appendChild(labelArrow);
  ifNode.appendChild(bodySlot);

  makeDraggable(ifNode);
  makeMovable(ifNode, whiteboard, codeArea, dimOverlay);
  attachTooltip(ifNode, "If statement: drag condition into first slot, action into second slot.");

  return ifNode;
}

// ---------- IF-ELSE NODE ----------
if (type === 'if-else') {
  const ifElseNode = document.createElement('div');
  ifElseNode.className = 'if-else-node';
  ifElseNode.id = `ifelse-${Date.now().toString(36)}`;

  const condSlot = createSlot(whiteboard, codeArea, dimOverlay);
  condSlot.classList.add('if-cond');

  const bodySlot = createSlot(whiteboard, codeArea, dimOverlay);
  bodySlot.classList.add('if-body');

  const elseSlot = createSlot(whiteboard, codeArea, dimOverlay);
  elseSlot.classList.add('else-body');

  const labelIf = document.createElement('span');
  labelIf.textContent = 'if (';
  const labelArrow = document.createElement('span');
  labelArrow.textContent = ') =>';
  const labelElse = document.createElement('span');
  labelElse.textContent = ', else';

  ifElseNode.appendChild(labelIf);
  ifElseNode.appendChild(condSlot);
  ifElseNode.appendChild(labelArrow);
  ifElseNode.appendChild(bodySlot);
  ifElseNode.appendChild(labelElse);
  ifElseNode.appendChild(elseSlot);

  makeDraggable(ifElseNode);
  makeMovable(ifElseNode, whiteboard, codeArea, dimOverlay);
  attachTooltip(ifElseNode, "If-Else statement: first slot is condition, second is 'if' action, third is 'else' action.");

  return ifElseNode;
}


  if (type === 'print') {
  const p = document.createElement('div');
  p.className = 'print-node';
  p.id = makeId('print');

  const text = document.createElement('span');
  text.className = 'print-label';
  text.textContent = 'print ( ';

  const slot = createSlot(whiteboard, codeArea, dimOverlay);
  slot.classList.add('print-slot');

  const closeParen = document.createElement('span');
  closeParen.textContent = ' )';

  // keep everything inline
  p.style.display = 'inline-flex';
  p.style.alignItems = 'center';
  p.style.gap = '4px';

  p.appendChild(text);
  p.appendChild(slot);
  p.appendChild(closeParen);

  makeDraggable(p);
  makeMovable(p, whiteboard, codeArea, dimOverlay);
  attachTooltip(p, "Print: Displays the value or expression inside the parentheses.");
  return p;
}


  // operators
  const op = document.createElement('div');
  op.className = 'operator';
  op.id = makeId('operator');
  op.dataset.op = type;

  const left = createSlot(whiteboard, codeArea, dimOverlay);
  const leftInput = left.querySelector('input');
  leftInput.value = '';

  const img = document.createElement('img'); 
  img.src = `/assets/images/${type}.png`; 
  img.alt = type;

  const right = createSlot(whiteboard, codeArea, dimOverlay);
  const rightInput = right.querySelector('input');
  rightInput.value = '';

  op.appendChild(left);
  op.appendChild(img);
  op.appendChild(right);

  makeDraggable(op);
  makeMovable(op, whiteboard, codeArea, dimOverlay);

  const opMap = {
    add: "Addition (+): Combines two values.",
    subtract: "Subtraction (-): Finds the difference.",
    multiply: "Multiplication (*): Multiplies two values.",
    divide: "Division (/): Divides left by right."
  };
  attachTooltip(op, opMap[type] || "Operator");
  return op;
}


/* ---------- Movable (mouse-based dragging) ---------- */
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

/* ---------- Initialization ---------- */
export function initDragAndDrop({ paletteSelector = '.elements img', whiteboard, codeArea, dimOverlay, trashCan, notification }) {
  if (!whiteboard) throw new Error('initDragAndDrop requires a whiteboard element');

  // allow any palette item with data-type (img or div)
  const paletteItems = Array.from(document.querySelectorAll(paletteSelector + ', .elements [data-type]'));

  function onPaletteDragStart(e) {
    _dragType = (this && this.dataset && this.dataset.type) ? this.dataset.type : (e.target && e.target.dataset && e.target.dataset.type) || null;
    _dragSource = null;
    try { e.dataTransfer.setData('text/plain', _dragType || ''); } catch {}
  }
  function onPaletteDragEnd() { _dragType = null; }

  paletteItems.forEach(item => {
    item.addEventListener('dragstart', onPaletteDragStart);
    item.addEventListener('dragend', onPaletteDragEnd);
  });

  function onDocDragStart(e) {
    const el = e.target.closest('.variable, .operator, .print-node');
    if (!el) return;
    _dragSource = el;
    _dragType = null;
    try { e.dataTransfer.setData('text/plain', el.id || ''); } catch {}
  }
  function onDocDragEnd() { _dragSource = null; _dragType = null; }
  document.addEventListener('dragstart', onDocDragStart);
  document.addEventListener('dragend', onDocDragEnd);

  function onWhiteboardDragOver(e) { e.preventDefault(); }

  function onWhiteboardDrop(e) {
    if (e.target.closest('.slot') || e.target.closest('#trashCan')) return;
    e.preventDefault();

    const wbRect = whiteboard.getBoundingClientRect();
    const x = Math.max(8, e.clientX - wbRect.left - 40);
    const y = Math.max(8, e.clientY - wbRect.top - 16);

    // 🚨 removed restrictions (no need for variable first)

    if (_dragSource) {
      freeElement(_dragSource, x, y);
      whiteboard.appendChild(_dragSource);
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
      _dragSource = null;
      return;
    }

    if (_dragType) {
      const el = createElementFromType(_dragType, whiteboard, codeArea, dimOverlay);
      freeElement(el, x, y);
      whiteboard.appendChild(el);
      _dragType = null;
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
    }
  }
  whiteboard.addEventListener('dragover', onWhiteboardDragOver);
  whiteboard.addEventListener('drop', onWhiteboardDrop);

    // ---------- Trash Can ----------
  function onTrashDragOver(e){ 
    e.preventDefault(); 
    if (trashCan) trashCan.classList.add('over'); 
  }

  function onTrashDragLeave(){ 
    if (trashCan) trashCan.classList.remove('over'); 
  }

  function onTrashDrop(e) {
    e.preventDefault();
    if (trashCan) trashCan.classList.remove('over');

    if (_dragSource) {
      const prevParent = _dragSource.parentElement;
      _dragSource.remove();
      if (prevParent && prevParent.classList.contains('slot')) {
        prevParent.classList.add('empty');
      }

      const globalTooltip = document.getElementById('globalTooltip');
      if (globalTooltip) {
        globalTooltip.style.display = 'none';
        globalTooltip.textContent = '';
      }

      if (notification) {
        notification.textContent = "Element deleted 🗑️";
        notification.style.display = 'block';
        setTimeout(() => notification.style.display = 'none', 3200);
      }

      _dragSource = null; 
      _dragType = null;
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
    }
  }

  if (trashCan) {
    trashCan.addEventListener('dragover', onTrashDragOver);
    trashCan.addEventListener('dragleave', onTrashDragLeave);
    trashCan.addEventListener('drop', onTrashDrop);
  }


  function onWhiteboardDblClick(e) {
    const clicked = e.target.closest('.operator, .variable, .print-node');
    if (!clicked) return;
    if (clicked.dataset.nested === 'true') {
      const wbRect = whiteboard.getBoundingClientRect();
      const x = Math.max(12, e.clientX - wbRect.left - 30);
      const y = Math.max(12, e.clientY - wbRect.top - 12);
      freeElement(clicked, x, y);
      whiteboard.appendChild(clicked);
      updateVariableState(whiteboard, dimOverlay);
      updateCode(whiteboard, codeArea);
      updateVariableTooltips(whiteboard);
    }
  }
  whiteboard.addEventListener('dblclick', onWhiteboardDblClick);

  return function destroy() {
    paletteItems.forEach(item => {
      item.removeEventListener('dragstart', onPaletteDragStart);
      item.removeEventListener('dragend', onPaletteDragEnd);
    });
    document.removeEventListener('dragstart', onDocDragStart);
    document.removeEventListener('dragend', onDocDragEnd);
    whiteboard.removeEventListener('dragover', onWhiteboardDragOver);
    whiteboard.removeEventListener('drop', onWhiteboardDrop);
    if (trashCan) {
      trashCan.removeEventListener('dragover', onTrashDragOver);
      trashCan.removeEventListener('dragleave', onTrashDragLeave);
      trashCan.removeEventListener('drop', onTrashDrop);
    }
    whiteboard.removeEventListener('dblclick', onWhiteboardDblClick);
  };
}
