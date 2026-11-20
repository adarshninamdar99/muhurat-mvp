import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Every test file gets its own in-memory database and temporary storage folder.
process.env.AI_PROVIDER = "mock";
process.env.DATABASE_PATH = ":memory:";
process.env.STORAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "muhurat-test-"));
process.env.MOCK_DELAY_MS = "0";
