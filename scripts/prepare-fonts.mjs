import { mkdir, writeFile } from 'node:fs/promises';
const directory = new URL('../src/assets/fonts/', import.meta.url);
await mkdir(directory, { recursive: true });
const agent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
async function download(url) { const r = await fetch(url, { headers: { 'User-Agent': agent } }); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r; }
const queries = [
  { query: 'family=Cormorant+Garamond:ital,wght@0,400..600;1,400..500&family=Inter:wght@400..600&family=JetBrains+Mono:wght@400..500&display=swap', latin: true },
  { query: 'family=Caveat:wght@500&family=Barlow+Condensed:wght@700&text=EmailPhone0123456789%40.com163&display=swap', latin: false },
];
let output = '';
for (const { query, latin } of queries) {
  const css = await (await download(`https://fonts.googleapis.com/css2?${query}`)).text();
  const rules = latin ? [...css.matchAll(/\/\* latin \*\/\s*(@font-face\s*\{[^}]+\})/g)].map(m => m[1]) : [...css.matchAll(/@font-face\s*\{[^}]+\}/g)].map(m => m[0]);
  if (!rules.length) throw new Error('No font faces found');
  for (let i=0; i<rules.length; i++) {
    let rule = rules[i]; const remote = rule.match(/url\(([^)]+)\)/)[1];
    const family = rule.match(/font-family:\s*'([^']+)'/)[1];
    const style = rule.match(/font-style:\s*([^;]+);/)[1];
    const buffer = Buffer.from(await (await download(remote)).arrayBuffer());
    if (buffer.toString('ascii',0,4) !== 'wOF2') throw new Error(`${family} is not WOFF2`);
    const name = `${family.toLowerCase().replaceAll(' ','-')}-${style}-${i}.woff2`;
    await writeFile(new URL(name,directory), buffer);
    rule = rule.replace(remote, `./${name}`).replace("'Caveat'", "'Contact Hand'").replace("'Barlow Condensed'", "'Contact Display'");
    output += `${rule}\n`;
    console.log(`${name}: ${buffer.length} bytes`);
  }
}
await writeFile(new URL('fonts.css',directory), output);
for (const family of ['cormorantgaramond','inter','jetbrainsmono']) {
  const license = await (await download(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`)).text();
  await writeFile(new URL(`${family}-OFL.txt`,directory),license);
}
