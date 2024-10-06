import Processor from "./processor.js";
import Delimiter from "./delimiter.js";
import Analyser from "./analyser.js";
import FileGenerator from "./file-generator.js";

export default class TemplateEngine {
  constructor({ startDelimiter, endDelimiter } = {}, extraJS = "") {
    this.delimiters = {};
    if (startDelimiter && endDelimiter) {
      this.addDelimiter("default", startDelimiter, endDelimiter);
    }
    this.extraJS = extraJS;
  }

  createProcessor(features, data) {
    return new Processor(features, data, this.delimiters, this.extraJS);
  }

  createFileGenerator(features, data) {
    return new FileGenerator(features, data, this.delimiters, this.extraJS);
  }

  createAnalyser() {
    return new Analyser(this.delimiters);
  }

  addDelimiter(type, start, end) {
    this.delimiters[type] = new Delimiter(start, end);
  }

  addDelimiters(type, delimiters) {
    this.delimiters[type] = [];
    delimiters.forEach((del) => {
      this.delimiters[type].push(new Delimiter(del.start, del.end));
    });
  }

  appendDelimiter(type, start, end) {
    if (this.delimiters[type]) {
      if (Array.isArray(this.delimiters[type])) {
        this.delimiters[type].forEach((del) => {
          if (del.start == start && del.end == end) {
            return;
          }
        });
        this.delimiters[type].push(new Delimiter(start, end));
      } else {
        let oldStart = this.delimiters[type].start;
        let oldEnd = this.delimiters[type].end;
        if (oldStart == start && oldEnd == end) {
          return;
        } else {
          this.delimiters[type] = [];
          this.delimiters[type].push(new Delimiter(oldStart, oldEnd));
          this.delimiters[type].push(new Delimiter(start, end));
        }
      }
    } else {
      this.delimiters[type] = new Delimiter(start, end);
    }
  }

  delimiterFor(extension) {
    return this.delimiters[extension];
  }
}
