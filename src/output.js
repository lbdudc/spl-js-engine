import { writeFile, existsFile, appendFile } from "./file-utils.js";
import JSZip from "jszip";
import path from "path";

class Output {
  constructor() {}

  // eslint-disable-next-line no-unused-vars
  add(fPath, fContent, bin) {}
  get() {}
}

export class ZipOutput extends Output {
  constructor() {
    super();
    this.zip = JSZip();
  }

  add(fPath, fContent) {
    this.zip.file(fPath, fContent);
  }

  get() {
    return this.zip;
  }
}

export class LocalOutput extends Output {
  constructor(outputPath) {
    super();
    this.outputPath = outputPath;
  }

  add(fPath, fContent, bin = false) {
    writeFile(this.outputPath + path.sep + fPath, fContent, bin);
  }

  get() {
    return this.outputPath;
  }

  append(fPath, fContent, bin = false) {
    appendFile(this.outputPath + path.sep + fPath, fContent, bin);
  }

  fileExists(fileName) {
    const stats = existsFile(this.outputPath + "/" + fileName);
    try {
      if (stats.isFile()) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  }
}
