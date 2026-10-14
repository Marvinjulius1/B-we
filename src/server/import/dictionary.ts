import { readFile } from "node:fs/promises";
import path from "node:path";
import type { AttributeDictionary } from "./normalize";

export async function loadAttributeDictionary(
  file = path.join(process.cwd(), "data/attributes.json"),
): Promise<AttributeDictionary> {
  const json = JSON.parse(await readFile(file, "utf8")) as { attributes: AttributeDictionary };
  return json.attributes;
}
