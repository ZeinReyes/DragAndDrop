// src/utils/state.js
// updateVariableState manipulates the dimOverlay (adds/removes visible) like original script

export function updateVariableState(whiteboard, dimOverlay) {
  if (!whiteboard) return { variablePlaced: false, variableHasValue: false };

  const vars = [...whiteboard.querySelectorAll('.variable')];
  const variablePlaced = vars.length > 0;

  const variableHasValue = vars.every(v => {
    const slot = v.querySelector('.slot');
    return slot && slot.firstElementChild;
  });

  if (dimOverlay) {
    if (variablePlaced && !variableHasValue) dimOverlay.classList.add('visible');
    else dimOverlay.classList.remove('visible');
  }

  return { variablePlaced, variableHasValue };
}
