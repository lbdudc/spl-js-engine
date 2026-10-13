import Engine from "./engine.js";
import { spliceCip } from "./cip.js";

export default class Processor extends Engine {
  constructor(features = {}, data = {}, delimiters = {}, extraJS = "") {
    super(delimiters, extraJS);
    this.features = features;
    this.data = data;
  }

  process(str, ext, context) {
    let code = this.getTemplateHelperMethods() + "var lines = [];\n";
    let cursor = 0;
    let match;
    const delimiterExt = this.getDelimiter(ext);

    if (Array.isArray(delimiterExt)) {
      let arrayMatchs = [];
      delimiterExt.forEach((del) => {
        while ((match = del.regular.exec(str)) !== null) {
          arrayMatchs.push(match);
        }
      });
      arrayMatchs.sort(function (a, b) {
        return a.index - b.index;
      });
      arrayMatchs.forEach((match) => {
        code += _newLine(str.slice(cursor, match.index));
        if (match[1] === "\n") {
          // javascriptExpression is 'full-line' and starts at
          // beginning of line, we should add the newline taken by regexp
          code += 'lines.push("\\n");\n';
        }
        code += _newLine(match.slice(1).join(""), true);
        cursor = match.index + match[0].length;
      });
      code += _newLine(str.substr(cursor, str.length - cursor));
    } else {
      const delimiter = this.getDelimiter(ext).regular;

      while ((match = delimiter.exec(str)) !== null) {
        code += _newLine(str.slice(cursor, match.index));
        if (match[1] === "\n") {
          // javascriptExpression is 'full-line' and starts at
          // beginning of line, we should add the newline taken by regexp
          code += 'lines.push("\\n");\n';
        }
        code += _newLine(match.slice(1).join(""), true);
        cursor = match.index + match[0].length;
      }
      code += _newLine(str.substr(cursor, str.length - cursor));
    }
    // eliminating superfluous spaces
    code = (code + 'return lines.join("");').replace(/[\r\t\n]/g, "");

    return new Function("feature", "data", "context", code)(
      this.features,
      this.data,
      context
    );
  }

  process_cpi(str, ext, context, contentCipList) {
    const { start, end } = this.getDelimiter(ext);
    return spliceCip({ main: str, fragments: contentCipList, start, end });
  }
}

// first we escape the \ symbols in the text. Then we focus on special cases
// that need to be escaped.
const _textLine = (line) =>
  'lines.push("'.concat(
    line
      .replace(/\\/g, "\\\\") // \ -> \\
      .replace(/\n/g, "\\n") // line feed \n -> \n
      .replace(/\r/g, "\\r") // carriage return \r -> \r
      .replace(/\t/g, "\\t") // new tab \t -> \t
      .replace(/"/g, '\\"'), // " -> \"
    '");\n'
  );

const _jsLine = (line) =>
  line
    .trim()
    .replace(/\n/g, "")
    .replace(/[ ]{2,}/g, " ")
    .concat("\n");

const _isInterpolatedValue = (line) => line.trim().charAt(0) === "=";

const _interpolatedValue = (line) => `lines.push(${line.trim().substr(1)});\n`;

const _newLine = (line, isJavascript) =>
  isJavascript
    ? _isInterpolatedValue(line)
      ? _interpolatedValue(line)
      : _jsLine(line)
    : _textLine(line);
