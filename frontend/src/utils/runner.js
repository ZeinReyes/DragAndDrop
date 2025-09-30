// src/utils/runner.js
export function runProgram(codeArea, outputArea) {
  if (!codeArea || !outputArea) return;
  const code = codeArea.textContent.trim();

  if (!code || code.startsWith('/*')) {
    outputArea.textContent = "⚠ No program to run.";
    return;
  }

  try {
    // demo transform: convert "x = expr;" -> "let x = expr; x" for JS eval demo
    const transformed = code.replace(/(\\w+)\\s*=\\s*([^;]+);/, "let $1 = $2; $1");
    // caution: eval is used only for demo/prototyping. Replace with Pyodide or safe backend in production.
    // eslint-disable-next-line no-eval
    let result = eval(transformed);
    outputArea.textContent = "✅ Result: " + result;
  } catch (err) {
    outputArea.textContent = "❌ Error: " + (err && err.message ? err.message : String(err));
  }
}
