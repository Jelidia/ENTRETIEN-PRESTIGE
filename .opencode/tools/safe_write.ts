// .opencode/tools/safe_write.ts
import * as fs from "fs";
import * as path from "path";

async function safe_write(args: { file: string; content: string }) {
  const filePath = path.normalize(args.file);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.opencode_tmp_${Date.now()}`;
  fs.writeFileSync(tmp, args.content, { encoding: "utf8" });
  fs.renameSync(tmp, filePath);
  return { ok: true, file: filePath };
}

const tool = safe_write as typeof safe_write & { execute?: typeof safe_write };
tool.execute = safe_write;

export default tool;
