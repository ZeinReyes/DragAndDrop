// src/utils/codeGen.js
import { isOperator } from './nesting';

/**
 * Detect type and also return a Python-safe representation
 */
export function detectTypeAndFormat(value) {
  if (value == null || value === "") {
    return { code: "None", type: "unknown" };
  }

  // int
  if (/^-?\d+$/.test(value)) {
    return { code: value, type: "int" };
  }

  // float
  if (/^-?\d*\.\d+$/.test(value)) {
    return { code: value, type: "float" };
  }

  // char (1 character, no quotes in input)
  if (value.length === 1) {
    return { code: `'${value}'`, type: "char" };
  }

  // boolean
  if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
    return {
      code: value.toLowerCase() === "true" ? "True" : "False",
      type: "bool"
    };
  }

  // fallback → string
  return { code: `"${value}"`, type: "string" };
}

/**
 * Extract expression from a slot (recursive)
 */
export function exprFromSlot(slot) {
  if (!slot) return { code: "0", type: "unknown" };

  // check if an operator, variable, or print node is inside this slot
  const child = slot.querySelector(".operator, .variable, .print-node, .if-node, .if-else-node, .if-elif-else-node");
  if (child) {
    return generateNodeCode(child);  // recurse properly
  }

  // otherwise look for an input field
  const input = slot.querySelector("input");
  if (input) {
    return detectTypeAndFormat(input.value.trim());
  }

  return { code: "0", type: "unknown" };
}

/**
 * Convert a DOM node into Python code
 */
export function generateNodeCode(node) {
  if (!node) return { code: "", type: "unknown" };

  // ---------- Operator ----------
  if (node.classList.contains("operator")) {
    const op = node.dataset.op;
    const slots = node.querySelectorAll(".slot");

    const left = exprFromSlot(slots[0]);
    const right = exprFromSlot(slots[1]);

    let pyOp = "+";
    if (op === "subtract") pyOp = "-";
    else if (op === "multiply") pyOp = "*";
    else if (op === "divide") pyOp = "/";

    return {
      code: `${left.code} ${pyOp} ${right.code}`,
      type: left.type === right.type ? left.type : "mixed"
    };
  }

  // ---------- Variable ----------
  if (node.classList.contains("variable")) {
    let name = "result";
    const label = node.querySelector(".var-label");
    const renameInput = node.querySelector(".var-name-input");

    if (label) {
      name = label.textContent.trim() || "result";
    } else if (renameInput) {
      name = renameInput.value.trim() || "result";
    }

    const slot = node.querySelector(".variable-slot");
    const rhs = exprFromSlot(slot);

    return {
      code: `${name} = ${rhs.code}  # ${rhs.type}`,
      type: rhs.type
    };
  }

  // ---------- Print Node ----------
  if (node.classList.contains("print-node")) {
    const slot = node.querySelector(".print-slot");
    const arg = exprFromSlot(slot);
    return {
      code: `print(${arg.code})`,
      type: "print"
    };
  }

  // ---------- IF Node ----------
  if (node.classList.contains("if-node")) {
    const cond = exprFromSlot(node.querySelector('.if-cond'));
    const body = exprFromSlot(node.querySelector('.if-body'));
    const bodyCode = body.code.replace(/^/gm, '  '); // indent
    const code = `if ${cond.code}:\n${bodyCode}`;
    return { code, type: "conditional" };
  }

  // ---------- IF-ELSE Node ----------
  if (node.classList.contains("if-else-node")) {
    const cond = exprFromSlot(node.querySelector('.if-cond'));
    const body = exprFromSlot(node.querySelector('.if-body'));
    const elseBody = exprFromSlot(node.querySelector('.else-body'));

    const bodyCode = body.code.replace(/^/gm, '  ');
    const elseCode = elseBody.code.replace(/^/gm, '  ');

    let code = `if ${cond.code}:\n${bodyCode}`;
    if (elseBody.code && elseBody.code !== '0') {
      code += `\nelse:\n${elseCode}`;
    }
    return { code, type: "conditional" };
  }

  // ---------- IF-ELIF-ELSE Node ----------
  if (node.classList.contains("if-elif-else-node")) {
    const cond = exprFromSlot(node.querySelector('.if-cond'));
    const body = exprFromSlot(node.querySelector('.if-body'));
    const elifCond = exprFromSlot(node.querySelector('.elif-cond'));
    const elifBody = exprFromSlot(node.querySelector('.elif-body'));
    const elseBody = exprFromSlot(node.querySelector('.else-body'));

    const bodyCode = body.code.replace(/^/gm, '  ');
    const elifBodyCode = elifBody.code.replace(/^/gm, '  ');
    const elseBodyCode = elseBody.code.replace(/^/gm, '  ');

    let code = `if ${cond.code}:\n${bodyCode}`;
    if (elifCond.code && elifCond.code !== '0') {
      code += `\nelif ${elifCond.code}:\n${elifBodyCode}`;
    }
    if (elseBody.code && elseBody.code !== '0') {
      code += `\nelse:\n${elseBodyCode}`;
    }

    return { code, type: "conditional" };
  }

  // ---------- Input ----------
  if (node.tagName === "INPUT") {
    return detectTypeAndFormat(node.value.trim());
  }

  // Fallback
  return { code: "", type: "unknown" };
}

/**
 * Updates tooltips for all variables
 */
export function updateVariableTooltips(whiteboard) {
  const vars = whiteboard.querySelectorAll(".variable");

  vars.forEach(v => {
    const slot = v.querySelector(".variable-slot");
    const rhs = exprFromSlot(slot);

    let tooltipText = "Empty variable";
    if (rhs.code !== "0" && rhs.code !== "" && rhs.type !== "unknown") {
      tooltipText = `This variable contains: ${rhs.type}`;
    }

    v.setAttribute("title", tooltipText);
  });
}

/**
 * Updates the source code preview
 */
export function updateCode(whiteboard, codeArea) {
  // Only top-level nodes (direct children of whiteboard)
  const nodes = Array.from(whiteboard.children).filter(child =>
    child.classList.contains("variable") ||
    child.classList.contains("print-node") ||
    child.classList.contains("operator") ||
    child.classList.contains("if-node") ||
    child.classList.contains("if-else-node") ||
    child.classList.contains("if-elif-else-node")
  );

  let code = "";

  nodes.forEach(n => {
    const { code: line } = generateNodeCode(n);
    if (line.trim()) code += line + "\n";
  });

  codeArea.textContent = code.trim() || "# Drag elements to build code";
  updateVariableTooltips(whiteboard);
}
