// src/utils/nesting.js

const SLOT_RULES = {
  'if-cond':    ['variable', 'operator', 'literal'],
  'elif-cond':  ['variable', 'operator', 'literal'],

  'if-body':    ['print-node', 'variable', 'if-node'], 
  'elif-body':  ['print-node', 'variable', 'if-node'],
  'else-body':  ['print-node', 'variable', 'if-node'],

  'print-slot': ['variable', 'operator'],  
  'variable-slot': ['variable', 'operator', 'literal'],
  'operator-slot': ['variable', 'literal', 'operator'],
};

export function canNest(slot, child) {
  if (!slot || !child) return false;

  const slotType = Array.from(slot.classList).find(cls => SLOT_RULES[cls]);
  if (!slotType) return true;

  const allowed = SLOT_RULES[slotType] || [];
  const childType = getNodeType(child);

  if (!allowed.includes(childType)) {
    showNestNotification(
      `⚠️ You can't put a ${childType.replace('-', ' ')} inside a ${slotType.replace('-', ' ')}.`
    );
    return false;
  }
  return true;
}

function getNodeType(el) {
  if (el.classList.contains('operator')) return 'operator';
  if (el.classList.contains('variable')) return 'variable';
  if (el.classList.contains('print-node')) return 'print-node';
  if (el.classList.contains('if-node')) return 'if-node';
  if (el.classList.contains('elif-node')) return 'elif-node';
  if (el.classList.contains('else-node')) return 'else-node';
  if (el.tagName === 'INPUT') return 'literal';
  return 'unknown';
}


export function nestElement(el) {
  if (!el) return;
  el.dataset.nested = 'true';
  el.style.position = 'static';
  el.style.removeProperty('left');
  el.style.removeProperty('top');
  const parentSlot = el.parentElement;
  if (parentSlot && parentSlot.classList.contains('slot')) parentSlot.classList.remove('empty');
}

export function freeElement(el, x = 24, y = 24) {
  if (!el) return;
  el.dataset.nested = 'false';
  el.style.position = 'absolute';
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  const prevParent = el.parentElement;
  if (prevParent && prevParent.classList.contains('slot')) {
    prevParent.classList.add('empty');
  }
}

export function tryAttachConnectorToIf(el, whiteboard) {
  const ifNodes = Array.from(whiteboard.querySelectorAll('.if-node'));
  if (!ifNodes.length) return false;

  let targetIf = null;
  let minDist = Infinity;
  const elRect = el.getBoundingClientRect();

  ifNodes.forEach(ifNode => {
    const rect = ifNode.getBoundingClientRect();
    const dx = (rect.left + rect.width / 2) - (elRect.left + elRect.width / 2);
    const dy = (rect.top + rect.height / 2) - (elRect.top + elRect.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      targetIf = ifNode;
    }
  });

  if (!targetIf) return false;

  const connectors = targetIf.querySelector('.if-connectors');
  if (!connectors) return false;

  if (el.classList.contains('elif-node')) {
    const elseNode = connectors.querySelector('.else-node');
    if (elseNode) {
      connectors.insertBefore(el, elseNode);
    } else {
      connectors.appendChild(el);
    }
  } else if (el.classList.contains('else-node')) {
    if (connectors.querySelector('.else-node')) {
      showNestNotification("⚠️ Only one 'else' is allowed in Python.");
      return false;
    }
    connectors.appendChild(el);
  } else {
    connectors.appendChild(el);
  }

  el.dataset.nested = 'true';
  el.style.position = 'relative';
  el.style.left = '0px';
  el.style.top = '0px';

  return true;
}
function showNestNotification(message) {
  let notif = document.getElementById('nestNotif');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'nestNotif';
    notif.style.position = 'fixed';
    notif.style.bottom = '12px';
    notif.style.left = '50%';
    notif.style.transform = 'translateX(-50%)';
    notif.style.padding = '8px 14px';
    notif.style.background = '#ffcccc';
    notif.style.color = '#333';
    notif.style.border = '1px solid #ff6666';
    notif.style.borderRadius = '6px';
    notif.style.fontSize = '14px';
    notif.style.zIndex = '10000';
    notif.style.display = 'none';
    document.body.appendChild(notif);
  }

  notif.textContent = message;
  notif.style.display = 'block';

  clearTimeout(notif._hideTimer);
  notif._hideTimer = setTimeout(() => {
    notif.style.display = 'none';
  }, 3000);
}

export function isOperator(el) { return el && el.classList.contains('operator'); }
export function isVariable(el) { return el && el.classList.contains('variable'); }
