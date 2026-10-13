import Delimiter from "./delimiter.js";

/**
 * Code insertion points (CIP). A `*.cipmain.*` file leaves markers between a pair of delimiters; the code for a marker sits, in
 * the `*.cip.*` files of the same path, between two markers of that name.
 *
 * Replaces each marker of `main` with the code the `fragments` give for it, in the order of the fragments. A marker no fragment
 * fills disappears, and a fragment marker `main` does not have is ignored.
 *
 * Pure: it reads no files. The texts are normalized (no BOM, LF line ends) as `readFile` does, so a marker alone in its line
 * matches whatever the checkout of the files is.
 *
 * @param {Object} opts
 * @param {String} opts.main - text of the main file
 * @param {String[]} opts.fragments - texts of the fragments, in the order they are spliced
 * @param {String} [opts.start] - start delimiter of a marker (the engine's default one when omitted)
 * @param {String} [opts.end] - end delimiter of a marker
 * @returns {String}
 */
export function spliceCip({ main, fragments, start, end }) {
  const { regular, start: from, end: to } = new Delimiter(start, end);
  const source = normalize(main);
  const parts = fragments.map(normalize);
  const nameOf = (marker) =>
    marker.substring(marker.indexOf(from) + from.length, marker.indexOf(to)).trim();

  let code = "";
  let cursor = 0;
  let match;
  while ((match = regular.exec(source)) !== null) {
    code += source.slice(cursor, match.index) + "\n";
    const insertion = nameOf(match[0]);
    for (const fragment of parts) {
      // a regular expression of its own: the one of `main` is in the middle of its scan
      const inFragment = new Delimiter(start, end).regular;
      let isFirst = true;
      let open = 0;
      let length = 0;
      let found;
      while ((found = inFragment.exec(fragment)) !== null) {
        if (nameOf(found[0]) === insertion) {
          if (isFirst) {
            isFirst = false;
            open = found.index;
            length = found[0].length;
            continue;
          }
          code += fragment.slice(open + length, found.index) + "\n";
        } else {
          isFirst = true;
        }
      }
    }
    cursor = match.index + match[0].length;
    regular.lastIndex = cursor;
  }
  return code + source.slice(cursor);
}

const normalize = (text) => text.replace(/^﻿/, "").replace(/\r\n/g, "\n");
