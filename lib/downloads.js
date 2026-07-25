const path = require('node:path');

// Hosted tab-web apps (Foxy Mode) can trigger ordinary browser downloads -
// e.g. Cove Meme Maker's "Export PNG" clicks an <a download>. Nexus picks the
// save path itself, so these helpers keep the chosen name inside the target
// directory and never clobber an existing file.

const MAX_SUFFIX_ATTEMPTS = 1000;

// Drop C0/C7F control characters. Written as a code-point filter rather than a
// regex range so the source file stays free of literal control bytes.
function stripControlChars(s) {
  let out = '';
  for (const ch of s) {
    const cp = ch.codePointAt(0);
    if (cp >= 0x20 && cp !== 0x7f) out += ch;
  }
  return out;
}

// Reduce an arbitrary, remote-influenced download name to a bare filename.
// Directory components and control characters are dropped so the result can
// only ever land directly inside the download directory.
function sanitizeDownloadName(name) {
  if (typeof name !== 'string') return 'download';
  const cleaned = stripControlChars(name).replace(/\\/g, '/');
  const base = path.posix.basename(cleaned).trim();
  if (!base || base === '.' || base === '..') return 'download';
  return base;
}

// Split "archive.tar.gz" into ["archive.tar", ".gz"]; a leading dot (".env")
// is part of the stem, not an extension, so dotfiles keep their name.
function splitExtension(base) {
  const ext = path.extname(base);
  if (!ext || ext === base) return [base, ''];
  return [base.slice(0, -ext.length), ext];
}

// Return a collision-free absolute path inside `dir` for `filename`.
// `exists` is injected so this stays pure and testable.
function uniqueDownloadPath(dir, filename, exists) {
  const base = sanitizeDownloadName(filename);
  const first = path.join(dir, base);
  if (!exists(first)) return first;

  const [stem, ext] = splitExtension(base);
  for (let n = 1; n <= MAX_SUFFIX_ATTEMPTS; n++) {
    const candidate = path.join(dir, `${stem} (${n})${ext}`);
    if (!exists(candidate)) return candidate;
  }
  // Pathological directory: fall back to a timestamped name rather than
  // returning a path that would overwrite someone's file.
  return path.join(dir, `${stem}-${Date.now()}${ext}`);
}

module.exports = { sanitizeDownloadName, uniqueDownloadPath };
