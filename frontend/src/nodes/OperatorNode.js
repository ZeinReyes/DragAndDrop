import { createSlot } from '../utils/slot';
import { makeDraggable } from '../utils/draggable';
import { makeMovable } from '../utils/movable';
import { attachTooltip } from '../utils/helpers';
import { makeId } from '../utils/id';   // ✅ unique ID generator

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

export function createOperatorNode(type, whiteboard, codeArea, dimOverlay) {
  const op = document.createElement('div');
  op.className = 'operator';
  op.id = makeId(`operator-${type}`);
  op.dataset.op = type;
  op.dataset.type = 'operator';

  // ✅ Each time we create slots, give them fresh unique IDs
  const left = createSlot(whiteboard, codeArea, dimOverlay);
  left.id = makeId(`slot-left-${type}`);

  const img = document.createElement('span');
  img.textContent = getOperatorSymbol(type);

  const right = createSlot(whiteboard, codeArea, dimOverlay);
  right.id = makeId(`slot-right-${type}`);

  op.appendChild(left);
  op.appendChild(img);
  op.appendChild(right);

  makeDraggable(op);
  makeMovable(op, whiteboard, codeArea, dimOverlay);
  attachTooltip(op, operatorTooltip(type));

  return op;
}
