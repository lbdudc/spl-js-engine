import Engine from "./engine.js";

export default class FileGenerator extends Engine {
  constructor(features = {}, data = {}, delimiters = {}, extraJS = "") {
    super(delimiters, extraJS);
    this.features = features;
    this.data = data;
  }

  filesToCreate(fileContent, extension, fileName, basePath, context) {
    const delimiterExt = this.getDelimiter(extension);
    let delimiter = "";
    if (Array.isArray(delimiterExt)) {
      delimiter = delimiterExt[0].header;
    } else {
      delimiter = delimiterExt.header;
    }

    const match = delimiter.exec(fileContent);

    if (!match) {
      return [{ fileContent, fileName, basePath, context }];
    } else {
      const f = new Function(
        "feature",
        "data",
        "fileName",
        "basePath",
        "context",
        this.getTemplateHelperMethods() + match[1]
      );
      const fresults = f(this.features, this.data, fileName, basePath, context);
      const newFileContent = fileContent
        .replace(delimiter, "")
        .replace(/^[\n\r\t]/, "");
      return flatten(
        fresults.map((r) =>
          this.filesToCreate(
            newFileContent,
            extension,
            r.fileName,
            r.basePath,
            r.context
          )
        )
      );
    }
  }
}

function flatten(list) {
  return list.reduce(
    (a, b) => (Array.isArray(b) ? a.push(...flatten(b)) : a.push(b), a),
    []
  );
}
