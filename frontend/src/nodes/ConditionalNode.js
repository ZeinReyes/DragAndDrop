import { createSlot } from '../utils/slot';
import { makeDraggable } from '../utils/draggable';
import { makeMovable } from '../utils/movable';
import { attachTooltip } from '../utils/helpers';
import { makeId } from '../utils/id';

export function createConditionalNode(type, whiteboard, codeArea, dimOverlay) {
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
    attachTooltip(ifNode, "If statement: condition slot + body slot. Add elif/else below.");
    return ifNode;
  }

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

    elseNode.addEventListener("DOMNodeInserted", () => {
      const parent = elseNode.parentNode;
      if (parent && parent.classList.contains("if-connectors")) {
        const allElses = parent.querySelectorAll(".else-node");
        if (allElses.length > 1) {
          alert("Only one ELSE is allowed per IF!");
          elseNode.remove();
        } else {
          parent.appendChild(elseNode);
        }
      }
    });

    return elseNode;
  }
}
