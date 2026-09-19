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
    } catch (e) {
      if (e.code !== 'ENOENT') {
        // never overwrite a database we could not read: set it aside and say so
        const aside = `${file}.unreadable-${Date.now()}`;
        try {
          fs.renameSync(file, aside);
        } catch {
          /* nothing more we can do */
        }
        console.error(`Could not read ${file} (${e.message}). It was moved to ${aside} and a fresh house was started.`);
      }
    }
  }

  save() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      try {
        this.flush();
      } catch (e) {
        console.error(`Could not save ${this.file}: ${e.message}`); // a full disk must not take the server down
      }
    }, 40);
  }

  /** Write immediately if a save is pending. Used on shutdown. */
  flushNow() {
    if (!this.timer) return;
    clearTimeout(this.timer);
    this.timer = null;
    try {
      this.flush();
    } catch (e) {
      console.error(`Could not save ${this.file}: ${e.message}`);
    }
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
