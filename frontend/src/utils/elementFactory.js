import { createVariableNode } from '../nodes/VariableNode';
import { createOperatorNode } from '../nodes/OperatorNode';
import { createConditionalNode } from '../nodes/ConditionalNode';
import { createPrintNode } from '../nodes/PrintNode';

export function createElement(type, whiteboard, codeArea, dimOverlay) {
  switch (type) {
    case 'variable':
      return createVariableNode(whiteboard, codeArea, dimOverlay);

    case 'add':
    case 'subtract':
    case 'multiply':
    case 'divide':
    case 'equal':
    case 'notequal':
    case 'less':
    case 'lessequal':
    case 'greater':
    case 'greaterequal':
      return createOperatorNode(type, whiteboard, codeArea, dimOverlay);

    case 'if':
    case 'elif':
    case 'else':
      return createConditionalNode(type, whiteboard, codeArea, dimOverlay);

    case 'print':
      return createPrintNode(whiteboard, codeArea, dimOverlay);

    default:
      console.warn(`Unknown element type: ${type}`);
      return null;
  }
}
