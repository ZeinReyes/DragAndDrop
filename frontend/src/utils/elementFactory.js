// src/utils/elementFactory.js
import { createSlot } from './slot';
import { makeDraggable } from './draggable';
import { makeMovable } from './movable';
import { attachTooltip } from './helpers';
import { updateCode, updateVariableTooltips } from './codeGen';

export function createElementFromType(type, whiteboard, codeArea, dimOverlay) {
  const makeId = (prefix = 'node') =>
    `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  // ---------- VARIABLE ----------
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
    ifNode.id = makeId('if');

    const condSlot = createSlot(whiteboard, codeArea, dimOverlay);
    condSlot.classList.add('if-cond');

    const bodySlot = createSlot(whiteboard, codeArea, dimOverlay);
    bodySlot.classList.add('if-body');

    const labelIf = document.createElement('span');
    labelIf.textContent = 'if (';
    const labelArrow = document.createElement('span');
    labelArrow.textContent = '):';

    // container for elif/else connectors
    const connectors = document.createElement('div');
    connectors.className = 'if-connectors';
    connectors.textContent = 'Drop elif/else here';

    ifNode.appendChild(labelIf);
    ifNode.appendChild(condSlot);
    ifNode.appendChild(labelArrow);
    ifNode.appendChild(bodySlot);
    ifNode.appendChild(connectors);

    makeDraggable(ifNode);
    makeMovable(ifNode, whiteboard, codeArea, dimOverlay);
    attachTooltip(ifNode, "If statement: drag condition into first slot, action into second slot. Add elif/else below.");

    return ifNode;
  }

 // inside createElementFromType, for elif/else we modify drop logic:

// ---------- ELIF NODE ----------
if (type === 'elif') {
  const hasIf = whiteboard.querySelector('.if-node');
  if (!hasIf) {
    alert("You need an IF block first before adding ELIF!");
    return null;
  }

  const elifNode = document.createElement('div');
  elifNode.className = 'elif-node';
  elifNode.id = makeId('elif');

  const condSlot = createSlot(whiteboard, codeArea, dimOverlay);
  condSlot.classList.add('elif-cond');

  const bodySlot = createSlot(whiteboard, codeArea, dimOverlay);
  bodySlot.classList.add('elif-body');

  const labelElif = document.createElement('span');
  labelElif.textContent = 'elif (';
  const labelArrow = document.createElement('span');
  labelArrow.textContent = '):';

  elifNode.appendChild(labelElif);
  elifNode.appendChild(condSlot);
  elifNode.appendChild(labelArrow);
  elifNode.appendChild(bodySlot);

  makeDraggable(elifNode);
  makeMovable(elifNode, whiteboard, codeArea, dimOverlay);

  attachTooltip(elifNode, "Elif: drag under an IF node connector to add another condition.");

  // Ensure elif goes *before* else if it exists
  elifNode.addEventListener("DOMNodeInserted", () => {
    const parent = elifNode.parentNode;
    if (parent && parent.classList.contains("if-connectors")) {
      const elseNode = parent.querySelector(".else-node");
      if (elseNode && elifNode.nextSibling === null) {
        parent.insertBefore(elifNode, elseNode);
      }
    }
  });

  return elifNode;
}

// ---------- ELSE NODE ----------
if (type === 'else') {
  const hasIf = whiteboard.querySelector('.if-node');
  if (!hasIf) {
    alert("You need an IF block first before adding ELSE!");
    return null;
  }

  const elseNode = document.createElement('div');
  elseNode.className = 'else-node';
  elseNode.id = makeId('else');

  const bodySlot = createSlot(whiteboard, codeArea, dimOverlay);
  bodySlot.classList.add('else-body');

  const labelElse = document.createElement('span');
  labelElse.textContent = 'else:';

  elseNode.appendChild(labelElse);
  elseNode.appendChild(bodySlot);

  makeDraggable(elseNode);
  makeMovable(elseNode, whiteboard, codeArea, dimOverlay);

  attachTooltip(elseNode, "Else: drag under an IF node connector for the default branch.");

  // Ensure only one else and it is always last
  elseNode.addEventListener("DOMNodeInserted", () => {
    const parent = elseNode.parentNode;
    if (parent && parent.classList.contains("if-connectors")) {
      // if there’s already another else, remove this one
      const allElses = parent.querySelectorAll(".else-node");
      if (allElses.length > 1) {
        alert("Only one ELSE is allowed per IF!");
        elseNode.remove();
      } else {
        parent.appendChild(elseNode); // always push it to the bottom
      }
    }
  });

  return elseNode;
}


  // ---------- PRINT NODE ----------
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

  // ---------- OPERATORS ----------
  const op = document.createElement('div');
  op.className = 'operator';
  op.id = makeId('operator');
  op.dataset.op = type;

  const left = createSlot(whiteboard, codeArea, dimOverlay);
  const img = document.createElement('span');
  img.textContent = getOperatorSymbol(type);
  const right = createSlot(whiteboard, codeArea, dimOverlay);

  op.appendChild(left);
  op.appendChild(img);
  op.appendChild(right);

  makeDraggable(op);
  makeMovable(op, whiteboard, codeArea, dimOverlay);

  attachTooltip(op, operatorTooltip(type));
  return op;
}

function getOperatorSymbol(type) {
  const symbols = {
    add: '+',
    subtract: '-',
    multiply: '*',
    divide: '/',
    equal: '==',
    notequal: '!=',
    less: '<',
    lessequal: '<=',
    greater: '>',
    greaterequal: '>='
  };
  return symbols[type] || type;
}

function operatorTooltip(type) {
  const map = {
    add: "Addition (+): Combines two values.",
    subtract: "Subtraction (-): Finds the difference.",
    multiply: "Multiplication (*): Multiplies two values.",
    divide: "Division (/): Divides left by right.",
    equal: "Equality (==): True if both sides are equal.",
    notequal: "Not Equal (!=): True if sides differ.",
    less: "Less Than (<): True if left is smaller.",
    lessequal: "Less or Equal (<=): True if left ≤ right.",
    greater: "Greater Than (>): True if left is larger.",
    greaterequal: "Greater or Equal (>=): True if left ≥ right."
  };
  return map[type] || "Operator";
}
