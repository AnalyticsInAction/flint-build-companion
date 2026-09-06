import {readdirSync,readFileSync,existsSync} from 'node:fs';
import assert from 'node:assert/strict';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(`${dir}/${e.name}`):[`${dir}/${e.name}`]);}
const files=walk('dist-pages');
assert.ok(existsSync('dist-pages/index.html'));
assert.ok(files.some(f=>f.endsWith('.js')));
assert.ok(files.some(f=>f.endsWith('.css')));
for(const f of files)assert.doesNotMatch(f,/\.(pdf|dxf|zip|gif|map)$/i,`Private source or debug asset in public build: ${f}`);
assert.ok(!files.some(f=>f.includes('/sources/')),'Source documents must stay local');
const html=readFileSync('dist-pages/index.html','utf8');
assert.doesNotMatch(html,/(src|href)="\/assets\//,'Assets must work under the GitHub Pages repository path');
for(const match of html.matchAll(/(?:src|href)="\.\/([^"#?]+)"/g))assert.ok(existsSync(`dist-pages/${match[1]}`),`Missing ${match[1]}`);
console.log(`Public build verified: ${files.length} static files; no original source documents.`);
