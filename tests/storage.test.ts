import { describe, expect, it } from "vitest";
import { fileUrl, readFile, resolveSafe, saveFile } from "@/server/storage/local";

describe("local storage", () => {
  it("refuses paths outside the storage folder", () => {
    expect(() => resolveSafe("../../etc/passwd")).toThrow(/outside/);
    expect(() => resolveSafe("/etc/passwd")).toThrow(/outside/);
  });

  it("saves and reads a file back", async () => {
    const rel = await saveFile("projects/test", "jpg", Buffer.from("hello"));
    expect(rel).toMatch(/^projects\/test\/[0-9a-f-]+\.jpg$/);
    expect((await readFile(rel)).toString()).toBe("hello");
    expect(fileUrl(rel)).toBe(`/api/files/${rel}`);
  });

  it("rejects unexpected file types", async () => {
    await expect(saveFile("x", "exe", Buffer.from(""))).rejects.toThrow(/not allowed/);
  });
});
