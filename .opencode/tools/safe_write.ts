// .opencode/tools/safe_write.ts
import * as fs from "fs";
import * as path from "path";

export default async function safe_write(args: { file: string; content: string }) {
  const filePath = path.normalize(args.file);
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${filePath}.opencode_tmp_${Date.now()}`;
  fs.writeFileSync(tmp, args.content, { encoding: "utf8" });
  fs.renameSync(tmp, filePath);
  return { ok: true, file: filePath };
}
