  import { makeDraggable, getDragState, clearDragSource } from '../utils/draggable';
  import { makeMovable } from '../utils/movable';
  import { attachTooltip } from '../utils/helpers';
  import { makeId } from '../utils/id';
  import { updateVariableState } from '../utils/state';
  import { updateCode } from '../utils/codeGen';
  import { initDragAndDrop } from '../utils/dragAndDrop';

  // ---------------- Helper: Extract Expression Recursively ----------------
  function extractExpression(node) {
    if (!node) return "0";

    // Direct input (number or variable)
    if (node.tagName === "INPUT") {
      const val = node.value.trim();
      return val !== "" ? val : "0";
    }

    // Dataset value (variable name or numeric literal)
    if (node.dataset?.value && node.dataset.value.trim() !== "") {
      return node.dataset.value.trim();
    }

    // Operator node
    if (node.classList.contains("operator-node")) {
      const op = node.dataset.op || node.textContent.match(/[+\-*/]/)?.[0] || "+";
      const children = Array.from(node.children).filter(
        (child) =>
          child.tagName === "INPUT" || child.classList.contains("operator-node")
      );

      let left = children[0] ? extractExpression(children[0]) : "0";
      let right = children[1] ? extractExpression(children[1]) : "0";

      // Wrap only nested operators to preserve order
      if (children[0]?.classList?.contains("operator-node")) left = `(${left})`;
      if (children[1]?.classList?.contains("operator-node")) right = `(${right})`;

      return `${left} ${op} ${right}`;
    }

    // Recursively handle child nodes
    const childNodes = Array.from(node.children);
    if (childNodes.length > 0) return childNodes.map(extractExpression).join(" ");

    return node.textContent.trim();
  }


  // ---------------- Local reusable delete function ----------------
  function deleteElement(element) {
  if (!element) return;
  const prevParent = element.parentElement;
  element.remove();
  if (prevParent && prevParent.classList.contains("slot")) {
    prevParent.classList.add("empty");
  }
}

  // ---------------- Modal Utility ----------------
  function createModal(contentBuilder) {
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const modal = document.createElement("div");
    modal.className = "modal";

    const header = document.createElement("div");
    header.className = "modal-header";
    header.textContent = "Printing Paper";

    const body = document.createElement("div");
    body.className = "modal-body";

    const footer = document.createElement("div");
    footer.className = "modal-footer";

    contentBuilder(body, footer, () => document.body.removeChild(overlay));

    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  }

  // ---------------- Print Node ----------------
  export function createPrintNode(whiteboard, codeArea, dimOverlay) {
    const p = document.createElement("div");
    p.className = "print-node";
    p.id = makeId("print");

    const printer = document.createElement("img");
    printer.src = "/assets/images/printer.png";
    printer.alt = "Printer";
    printer.className = "printer-img";
    p.appendChild(printer);

    const paperSlot = document.createElement("div");
    paperSlot.className = "print-slot paperSlot empty";
    paperSlot.textContent = "[ Empty printer ]";
    p.appendChild(paperSlot);

    let paperText = "";
    let containedNode = null;

    // ---------------- Drag Events ----------------
    paperSlot.ondragover = (e) => {
      e.preventDefault();
      paperSlot.classList.add("drag-over");
    };

    paperSlot.ondragleave = () => {
      paperSlot.classList.remove("drag-over");
    };

 paperSlot.ondrop = (e) => {
  e.preventDefault();
  paperSlot.classList.remove("drag-over");

  const { _dragSource, _dragType } = getDragState();
  let draggedNode = null;

  if (_dragSource) {
    // Came from board
    draggedNode = _dragSource;
  } else {
    // Came from palette — create a fresh element (if you support that)
    const nodeId = e.dataTransfer.getData("text/plain");
    draggedNode = document.getElementById(nodeId);
  }

  if (!draggedNode) return;

  // Extract expression and save it
  const expr = extractExpression(draggedNode);
  paperSlot.dataset.value = expr;
  paperSlot.textContent = "View printer content";
  paperSlot.classList.remove("empty");

  // ✅ Only delete if it came from board
  if (_dragSource) {
    deleteElement(draggedNode);
  }

  clearDragSource();
};



    // ---------------- Click to Open Modal ----------------
    paperSlot.onclick = (e) => {
      e.stopPropagation();

      createModal((body, footer, closeModal) => {
        const input = document.createElement("input");
        input.type = "text";
        input.className = "modal-input";
        input.value = paperSlot.dataset.value || "";
        body.appendChild(input);

        const cancelBtn = document.createElement("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.className = "modal-btn secondary";
        cancelBtn.onclick = closeModal;

        const saveBtn = document.createElement("button");
        saveBtn.textContent = "Save";
        saveBtn.className = "modal-btn primary";
        saveBtn.onclick = () => {
  paperText = input.value.trim();
  paperSlot.dataset.value = paperText;

  if (paperText === "") {
    paperSlot.textContent = "[ Empty printer ]";
    paperSlot.classList.add("empty");
  } else {
    paperSlot.textContent = "View printer content";   // <-- keep consistent
    paperSlot.classList.remove("empty");
  }

  closeModal();
};



        footer.appendChild(cancelBtn);
        footer.appendChild(saveBtn);
      });
    };

    paperSlot.onmousedown = (e) => e.stopPropagation();

    // ---------------- Make Node Draggable & Movable ----------------
    makeDraggable(p);
    makeMovable(p, whiteboard, codeArea, dimOverlay);
    attachTooltip(
      p,
      "Print: Drop an operator or click paper slot to open modal and edit expression."
    );

    return p;
  }
