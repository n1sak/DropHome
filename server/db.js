import fs from 'node:fs';
import path from 'node:path';

const empty = () => ({ house: null, files: {}, shares: {}, art: {}, dropToken: null });

/** One JSON file, written atomically (temp file + rename) and at most every 40 ms. */
export class Db {
  constructor(file) {
    this.file = file;
    this.timer = null;
    this.data = empty();
    try {
      this.data = { ...empty(), ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch {
      /* first run, or an unreadable file: start clean */
    }
  }

  save() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, 40);
  }

  flush() {
    const tmp = `${this.file}.${process.pid}.tmp`;
    fs.mkdirSync(path.dirname(this.file), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(this.data));
    fs.renameSync(tmp, this.file);
  }

  reset() {
    this.data = empty();
    this.flush();
  }
}
