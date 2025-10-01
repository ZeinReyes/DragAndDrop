// src/utils/helpers.js
export function attachTooltip(el, defaultText) {
  if (!el) return;
  const globalTooltip = document.getElementById("globalTooltip");

  el.dataset.tooltip = defaultText;

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

export function createAutoResizeInput() {
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

export function slotToCode(slot) {
  if (!slot) return "None";
  if (!slot.children || slot.children.length === 0) {
    return slot.textContent && slot.textContent.trim() !== "" 
      ? slot.textContent.trim()
      : "None";
  }
  const child = slot.children[0];
  if (child.dataset && child.dataset.op) {
    const left = slotToCode(child.children[0]);
    const op = child.children[1].textContent;
    const right = slotToCode(child.children[2]);
    return `${left} ${op} ${right}`;
  }
  if (child.classList.contains("variable")) {
    const label = child.querySelector(".var-label");
    return label ? label.textContent.trim() : "result";
  }
  if (child.classList.contains("if-node")) {
    const cond = slotToCode(child.querySelector(".if-cond"));
    const body = slotToCode(child.querySelector(".if-body"));
    let code = `if ${cond}:\n  ${body}`;
    const connectors = child.querySelector(".if-connectors");
    if (connectors) {
      for (let sub of connectors.children) {
        if (sub.classList.contains("elif-node")) {
          const elifCond = slotToCode(sub.querySelector(".elif-cond"));
          const elifBody = slotToCode(sub.querySelector(".elif-body"));
          code += `\nelif ${elifCond}:\n  ${elifBody}`;
        } else if (sub.classList.contains("else-node")) {
          const elseBody = slotToCode(sub.querySelector(".else-body"));
          code += `\nelse:\n  ${elseBody}`;
        }
      }
    }
    return code;
  }
  if (child.classList.contains("elif-node")) {
    const cond = slotToCode(child.querySelector(".elif-cond"));
    const body = slotToCode(child.querySelector(".elif-body"));
    return `elif ${cond}:\n  ${body}`;
  }
  if (child.classList.contains("else-node")) {
    const body = slotToCode(child.querySelector(".else-body"));
    return `else:\n  ${body}`;
  }
  if (child.classList.contains("print-node")) {
    const inner = slotToCode(child.querySelector(".print-slot"));
    return `print(${inner})`;
  }
  return child.textContent.trim() || "None";
}

// 💡 Child-friendly notifications
export function showNestNotification(message) {
  const notif = document.createElement('div');
  notif.textContent = message;
  notif.className = 'nest-notif';
  notif.style.position = 'fixed';
  notif.style.bottom = '20px';
  notif.style.left = '50%';
  notif.style.transform = 'translateX(-50%)';
  notif.style.background = '#fffae6';
  notif.style.color = '#333';
  notif.style.border = '1px solid #f2c94c';
  notif.style.padding = '8px 12px';
  notif.style.borderRadius = '8px';
  notif.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  notif.style.fontSize = '14px';
  notif.style.zIndex = 9999;

  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 2500);
}
