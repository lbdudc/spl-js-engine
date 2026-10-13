import assert from "assert";
import { TemplateEngine, spliceCip } from "../src/index.js";

suite("#Code insertion points (spliceCip)");

const marker = (name) => `/*→ ${name} ←*/`;
const options = { start: "/*→", end: "←*/" };

test("puts the code between the two markers of a fragment where main has the marker", () => {
  const main = `before\n${marker("tip_1")}\nafter\n`;
  const fragment = `${marker("tip_1")}\ninserted();\n${marker("tip_1")}\n`;
  assert.strictEqual(
    spliceCip({ main, fragments: [fragment], ...options }),
    "before\ninserted();\nafter\n"
  );
});

test("takes the fragments in order, and only the code of the marker it fills", () => {
  const main = `${marker("a")}\n${marker("b")}\n`;
  const first = `${marker("a")}\nA1\n${marker("a")}\n${marker("b")}\nB1\n${marker("b")}\n`;
  const second = `${marker("b")}\nB2\n${marker("b")}\n`;
  const result = spliceCip({ main, fragments: [first, second], ...options });
  assert.ok(result.indexOf("A1") < result.indexOf("B1"));
  assert.ok(result.indexOf("B1") < result.indexOf("B2"));
  assert.ok(!result.includes("→"));
});

test("drops a marker no fragment fills and ignores a fragment marker main does not have", () => {
  assert.strictEqual(
    spliceCip({ main: `x\n${marker("nobody")}\ny\n`, fragments: [], ...options }),
    "x\ny\n"
  );
  const unrelated = `${marker("other")}\nZ\n${marker("other")}\n`;
  assert.strictEqual(
    spliceCip({ main: `x\n${marker("tip")}\ny\n`, fragments: [unrelated], ...options }),
    "x\ny\n"
  );
});

test("matches a marker alone in its line whatever the line ends and BOM are", () => {
  const lf = spliceCip({
    main: `a\n${marker("t")}\nb\n`,
    fragments: [`${marker("t")}\nX\n${marker("t")}\n`],
    ...options,
  });
  const crlf = spliceCip({
    main: `﻿a\r\n${marker("t")}\r\nb\r\n`,
    fragments: [`${marker("t")}\r\nX\r\n${marker("t")}\r\n`],
    ...options,
  });
  assert.strictEqual(crlf, lf);
});

test("uses the delimiters it is given", () => {
  const result = spliceCip({
    main: "a\n<<tip>>\nb\n",
    fragments: ["<<tip>>\nX\n<<tip>>\n"],
    start: "<<",
    end: ">>",
  });
  assert.strictEqual(result, "a\nX\nb\n");
});

test("uses the engine's default delimiters when none are given", () => {
  const result = spliceCip({
    main: "a\n/*% tip %*/\nb\n",
    fragments: ["/*% tip %*/\nX\n/*% tip %*/\n"],
  });
  assert.strictEqual(result, "a\nX\nb\n");
});

test("the processor's process_cpi gives what spliceCip gives, with the delimiters of the extension", () => {
  const engine = new TemplateEngine();
  engine.addDelimiter("cip", "/*→", "←*/");
  const processor = engine.createProcessor();
  const main = `a
${marker("tip")}
b
`;
  const fragment = `${marker("tip")}
X
${marker("tip")}
`;
  assert.strictEqual(
    processor.process_cpi(main, "cip", {}, [fragment]),
    spliceCip({ main, fragments: [fragment], ...options })
  );
});
