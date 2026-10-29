// usage: dump_pack.cjs <srcDbDir> <outJson>  (srcDbDir should be a COPY); CL = path to classic-level
const path = require("path");
const { ClassicLevel } = require(process.env.CL);
(async () => {
  const db = new ClassicLevel(process.argv[2], { valueEncoding: "json" });
  const out = {};
  for await (const [k, v] of db.iterator()) out[k] = v;
  await db.close();
  require("fs").writeFileSync(process.argv[3], JSON.stringify(out));
  console.log(process.argv[3], Object.keys(out).length);
})().catch(e => { console.error(e.message); process.exit(1); });
