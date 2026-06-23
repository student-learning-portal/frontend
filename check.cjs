const { readFileSync } = require('fs');
const ts = require('typescript');
const f = require('path').resolve('src/app/catalog/page.tsx');
const src = readFileSync(f, 'utf8');
const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
(sf.parseDiagnostics||[]).forEach(d => {
  const pos = sf.getLineAndCharacterOfPosition(d.start);
  console.log(`L${pos.line+1}:${pos.character+1}`, ts.flattenDiagnosticMessageText(d.messageText,'\n'));
});
// print char codes around suspicious lines
const lines = src.split('\n');
[129,130,131,132,133].forEach(n=>{
  const l = lines[n-1]||'';
  console.log(n, JSON.stringify(l));
});
