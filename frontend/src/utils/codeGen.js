// src/utils/codeGen.js
import { isOperator } from './nesting';
import { slotToCode } from './helpers';

export function detectTypeAndFormat(value) {
  if (value == null || value === "") return { code: "None", type: "unknown" };
  if (/^-?\d+$/.test(value)) return { code: value, type: "int" };
  if (/^-?\d*\.\d+$/.test(value)) return { code: value, type: "float" };
  if (value.length === 1) return { code: `'${value}'`, type: "char" };
  if (value.toLowerCase() === "true" || value.toLowerCase() === "false") {
    return { code: value.toLowerCase() === "true" ? "True" : "False", type: "bool" };
  }
  return { code: `"${value}"`, type: "string" };
}

function formatCondition(expr) {
  if (!expr || !expr.code) return "False";
  switch (expr.type) {
    case "int":
    case "float":
      return `${expr.code} != 0`;
    case "string":
    case "char":
      return `${expr.code} != ""`;
    case "bool":
      return expr.code;
    default:
      return expr.code;
  }
}

export function exprFromSlot(slot) {
  if (!slot) return { code: "0", type: "unknown" };
  const child = slot.querySelector(".operator, .variable, .print-node, .if-node, .elif-node, .else-node");
  if (child) return generateNodeCode(child);
  const input = slot.querySelector("input");
  if (input) return detectTypeAndFormat(input.value.trim());
  return { code: "0", type: "unknown" };
}

export function generateNodeCode(node) {
  if (!node) return { code: "", type: "unknown" };

  // ---------- Operator ----------
  if (node.classList.contains("operator")) {
    const op = node.dataset.op;
    const slots = node.querySelectorAll(".slot");
    const left = exprFromSlot(slots[0]);
    const right = exprFromSlot(slots[1]);
    const opMap = { add: "+", subtract: "-", multiply: "*", divide: "/", equal: "==", notequal: "!=", less: "<", lessequal: "<=", greater: ">", greaterequal: ">=" };
    const pyOp = opMap[op] || "+";
    return { code: `${left.code} ${pyOp} ${right.code}`, type: (op in opMap && !["add","subtract","multiply","divide"].includes(op)) ? "bool" : (left.type === right.type ? left.type : "mixed") };
  }

  // ---------- Variable ----------
  if (node.classList.contains("variable")) {
    let name = "result";
    const label = node.querySelector(".var-label");
    const renameInput = node.querySelector(".var-name-input");
    if (label) name = label.textContent.trim() || "result";
    else if (renameInput) name = renameInput.value.trim() || "result";
    const slot = node.querySelector(".variable-slot");
    const rhs = exprFromSlot(slot);
    return { code: `${name} = ${rhs.code}  # ${rhs.type}`, type: rhs.type };
  }

  // ---------- Print ----------
  if (node.classList.contains("print-node")) {
    const slot = node.querySelector(".print-slot");
    const arg = exprFromSlot(slot);
    return { code: `print(${arg.code})`, type: "print" };
  }

// inside generateNodeCode for if/elif/else:

if (node.classList.contains("if-node")) {
  const cond = exprFromSlot(node.querySelector('.if-cond'));
  const bodySlot = node.querySelector('.if-body');
  const body = bodySlot && bodySlot.children.length > 0 
    ? slotToCode(bodySlot) 
    : "pass";

  let code = `if ${formatCondition(cond)}:\n${body.replace(/^/gm, '    ')}`;

  const connectors = node.querySelectorAll('.if-connectors > .elif-node, .if-connectors > .else-node');
  connectors.forEach(c => {
    if (c.classList.contains('elif-node')) {
      const elifCond = exprFromSlot(c.querySelector('.elif-cond'));
      const elifBodySlot = c.querySelector('.elif-body');
      const elifBody = elifBodySlot && elifBodySlot.children.length > 0
        ? slotToCode(elifBodySlot)
        : "pass";
      code += `\nelif ${formatCondition(elifCond)}:\n${elifBody.replace(/^/gm, '    ')}`;
    }
    if (c.classList.contains('else-node')) {
      const elseBodySlot = c.querySelector('.else-body');
      const elseBody = elseBodySlot && elseBodySlot.children.length > 0
        ? slotToCode(elseBodySlot)
        : "pass";
      code += `\nelse:\n${elseBody.replace(/^/gm, '    ')}`;
    }
  });
  return { code, type: "conditional" };
}



  // ---------- Input (fallback) ----------
  if (node.tagName === "INPUT") {
    return detectTypeAndFormat(node.value.trim());
  }

  return { code: "", type: "unknown" };
}

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

export function updateCode(whiteboard, codeArea) {
  const nodes = Array.from(whiteboard.children).filter(child =>
    child.classList.contains("variable") ||
    child.classList.contains("print-node") ||
    child.classList.contains("operator") ||
    child.classList.contains("if-node") ||
    child.classList.contains("elif-node") ||
    child.classList.contains("else-node")
  );
  let code = "";
  nodes.forEach(n => {
    const { code: line } = generateNodeCode(n);
    if (line.trim()) code += line + "\n";
  });
  codeArea.textContent = code.trim() || "# Drag elements to build code";
  updateVariableTooltips(whiteboard);
}
