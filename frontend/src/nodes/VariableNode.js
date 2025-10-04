import { makeDraggable } from '../utils/draggable';
import { makeMovable } from '../utils/movable';
import { attachTooltip } from '../utils/helpers';
import { makeId } from '../utils/id';
import { canNest, nestElement, showNestNotification } from '../utils/nesting.js';

// ✅ Global counter for variable naming
let variableCounter = 1;

export function createVariableNode(whiteboard, codeArea, dimOverlay) {
  const v = document.createElement('div');
  v.className = 'variable-node variable card-style';
  v.id = makeId('variable');

  // ✅ Generate unique variable name
  const defaultName = `var${variableCounter++}`;

  // ✅ Store initial data
  v.dataset.varName = defaultName;
  v.dataset.value = '';

  // Variable Name Label
  const nameLabel = document.createElement('div');
  nameLabel.className = 'variable-name';
  nameLabel.textContent = v.dataset.varName;
  v.appendChild(nameLabel);

  const lid = document.createElement('img');
  lid.src = '/images/lid.png';
  lid.alt = 'Variable Lid';
  lid.className = 'variable-lid';
  v.appendChild(lid);

  // ✅ Create inner slot
  const slot = document.createElement('div');
  slot.className = 'variable-slot slot hidden empty';
  slot.textContent = 'No content yet';
  slot.dataset.type = 'slot';
  v.appendChild(slot);

  const container = document.createElement('img');
  container.src = '/images/container.png';
  container.alt = 'Variable Container';
  container.className = 'variable-container';
  v.appendChild(container);

  let editing = false;
  let dragOver = false;
  let hovering = false;

  // ✅ Update slot visibility
  function updateSlotVisibility() {
  // Check for any active inputs inside slot (including nested)
  const hasActiveInput = slot.querySelector('input');
  const isFocusedInside = slot.contains(document.activeElement);
  
  // Only keep visible if truly hovering, dragging, or actively editing at this level
  if (hovering || dragOver || editing) {
    slot.classList.remove('hidden');
  } else if (hasActiveInput && isFocusedInside) {
    // Keep visible only if there's an actual focused input
    slot.classList.remove('hidden');
  } else {
    slot.classList.add('hidden');
  }
}

  v.addEventListener('mouseenter', () => {
    hovering = true;
    updateSlotVisibility();
  });

  v.addEventListener('mouseleave', () => {
    hovering = false;
    updateSlotVisibility();
  });

  // ✅ Editable Variable Name (Double-click)
  nameLabel.addEventListener('dblclick', e => {
    e.stopPropagation();
    if (nameLabel.querySelector('input')) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = v.dataset.varName;
    input.className = 'varname-input';
    nameLabel.replaceChildren(input);
    input.focus();

    function finishNameEdit(save = true) {
      if (save) {
        v.dataset.varName = input.value.trim() || defaultName;
      }
      nameLabel.textContent = v.dataset.varName;
    }

    input.addEventListener('blur', () => finishNameEdit(true), { once: true });
    input.addEventListener('keydown', ev => {
      if (ev.key === 'Enter') finishNameEdit(true);
      if (ev.key === 'Escape') finishNameEdit(false);
    });
  });

  // ✅ Manual typing in slot (value)
  function enableTyping() {
  if (editing) return;

  // Only allow typing if no nested node exists
  if (slot.querySelector('.node') || slot.querySelector('.operator')) return;

  editing = true;
  slot.classList.add('editing');

  const input = document.createElement('input');
  input.type = 'text';
  input.value = v.dataset.value || '';
  input.className = 'slot-input';
  slot.replaceChildren(input);
  input.focus();

  function finish(save = true) {
    if (save) {
      v.dataset.value = input.value.trim();
    }

    // ✅ Keep existing nodes/operators if present
    if (!slot.querySelector('.node') && !slot.querySelector('.operator')) {
      // Show placeholder text only if empty
      slot.textContent = v.dataset.value || 'No content yet';
      slot.classList.add('empty');
    }

    editing = false;
    slot.classList.remove('editing');
    updateSlotVisibility();

    // Remove global click listener
    document.removeEventListener('click', handleClickOutside, true);
  }

  // ✅ Click outside handler
  function handleClickOutside(e) {
    if (!v.contains(e.target)) {
      finish(true);
    }
  }

  // Listen for clicks outside
  setTimeout(() => { // Avoid immediate trigger
    document.addEventListener('click', handleClickOutside, true);
  });

  input.addEventListener('keydown', ev => {
    if (ev.key === 'Enter') finish(true);
    if (ev.key === 'Escape') finish(false);
  });
}


// ✅ Click slot to type (only if empty)
slot.addEventListener('click', e => {
  e.stopPropagation();
  enableTyping();
});

// ✅ Allow dropping of operators / variables / values
slot.addEventListener('dragover', e => {
  e.preventDefault();
  dragOver = true;
  updateSlotVisibility();
});

slot.addEventListener('dragleave', () => {
  dragOver = false;
  updateSlotVisibility();
});

slot.addEventListener('drop', e => {
  e.preventDefault();
  dragOver = false;
  updateSlotVisibility();

  const nodeId = e.dataTransfer.getData('text/plain');
  const node = document.getElementById(nodeId);
  if (!node) return;

  // ✅ Check if allowed
  if (!canNest(slot, node)) {
    showNestNotification("You can’t drop that here!");
    return;
  }

  // ✅ Clear slot text if typing was present
  v.dataset.value = '';
  slot.textContent = '';
  slot.classList.remove('empty');

  // Append dropped node
  slot.appendChild(node);
  nestElement(node);
});


  // ✅ Enable dragging and moving
  makeDraggable(v);
  makeMovable(v, whiteboard, codeArea);

  attachTooltip(v,
    'Variable: Double-click name to rename, hover to show slot, click slot to type or drop nodes.'
  );

  return v;
}
