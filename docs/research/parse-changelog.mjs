import fs from "node:fs";

const html = fs.readFileSync(process.env.CL_PAGE || "C:/Users/shoai/AppData/Local/Temp/cl_page", "utf8");

const decode = (s) =>
  s
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));

const strip = (s) => decode(s.replace(/<!--[^>]*-->/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ")).trim();

// Entry boundaries: each item is <li id="entry-<hash>" class="cl-item"> ... up to the next item or the closing </ul>
const starts = [...html.matchAll(/<li id="entry-([^"]+)" class="cl-item">/g)];
const items = [];

for (let i = 0; i < starts.length; i++) {
  const block = html.slice(starts[i].index + starts[i][0].length, i + 1 < starts.length ? starts[i + 1].index : html.indexOf("</ul>", starts[i].index));

  const body = block.match(/<div class="cl-body-text">([\s\S]*)$/)?.[1] ?? "";
  const bullets = [...body.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1])).filter(Boolean);
  const paragraphs = strip(body.replace(/<ul>[\s\S]*$/g, ""));

  items.push({
    id: items.length + 1,
    entryId: starts[i][1],
    iso: block.match(/<time dateTime="([^"]+)">/)?.[1] ?? "",
    when: `${strip(block.match(/<span class="cl-when-date">([^<]*)</)?.[1] ?? "")} ${strip(block.match(/<span class="cl-when-time">[\s\S]*?<\/span>/)?.[0]?.replace(/<[^>]+>/g, "") ?? "")}`.trim(),
    type: block.match(/aria-label="Type: ([^"]+)"/)?.[1] ?? "",
    kind: block.match(/class="cl-tag tag-([a-z]+)"/)?.[1] ?? "",
    scope: strip(block.match(/<span class="cl-scope">([^<]*)</)?.[1] ?? ""),
    slug: block.match(/href="\/changelog\/([^"]+)"/)?.[1] ?? "",
    title: strip(block.match(/<p class="cl-title">([\s\S]*?)<\/p>/)?.[1] ?? ""),
    summary: paragraphs,
    bullets,
  });
}

fs.writeFileSync(new URL("./changelog.json", import.meta.url), JSON.stringify(items, null, 2));

const tally = (key) => items.reduce((a, it) => ((a[it[key] || "?"] = (a[it[key] || "?"] ?? 0) + 1), a), {});
console.log(`entries: ${items.length}`);
console.log(`empty titles: ${items.filter((i) => !i.title).length} | empty bullets: ${items.filter((i) => !i.bullets.length).length}`);
console.log("types:", JSON.stringify(tally("type")));
console.log("scopes:", JSON.stringify(tally("scope")));
console.log("range:", items.at(-1)?.iso, "->", items[0]?.iso);
