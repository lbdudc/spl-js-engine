import fs from "fs";
import path from "path";
import stripBom from "strip-bom";

export const getExtension = (f) => {
  f = getFileName(f);
  return f.substring(f.lastIndexOf(".") + 1) || f;
};
export const getFileName = (f) => path.basename(f);
export const getFolder = (f) => path.dirname(f);
export const isNode = typeof window === "undefined";

export function existsFile(filePath) {
  try {
    return fs.statSync(filePath);
  } catch (e) {
    return false;
  }
}

export function readFile(filePath, bin = false) {
  if (bin) {
    return fs.readFileSync(filePath, null);
  } else {
    return stripBom(fs.readFileSync(filePath, "utf8")).replace(/\r\n/g, "\n");
  }
}

export function writeFile(filePath, data, bin = false) {
  if (!bin && (!data || !data.trim())) return;
  mkDirRecursively(path.dirname(filePath));
  fs.writeFileSync(filePath, data, bin ? null : "utf8");
}

function mkDirRecursively(folderPath) {
  const parentPath = path.dirname(folderPath);

  if (!existsFile(parentPath)) {
    mkDirRecursively(parentPath);
  }

  const stat = existsFile(folderPath);

  if (!stat) {
    fs.mkdirSync(folderPath);
  } else if (stat.isFile()) {
    throw `Found file on ${folderPath} while creating a folder`;
  }
}

export function walkDir(pathToWalk, cb, ignore = []) {
  let stat = existsFile(pathToWalk);

  if (!stat || stat.isFile()) return;

  fs.readdirSync(pathToWalk)
    .filter(function (path) {
      return ignore.indexOf(path) == -1;
    })
    .forEach((filePath) => {
      const fullFilePath = `${pathToWalk}${path.sep}${filePath}`;
      stat = fs.statSync(fullFilePath);

      if (stat.isFile()) {
        cb(fullFilePath, false);
      } else if (stat.isDirectory()) {
        walkDir(fullFilePath, cb, ignore);
      }
    });

  cb(pathToWalk, true);
}

export function readJsonFromFile(fPath) {
  const stat = existsFile(fPath);

  if (!stat || !stat.isFile()) {
    throw `${fPath} is not a file`;
  }

  const fileContent = readFile(fPath);

  return extendProductJson(JSON.parse(fileContent), path.dirname(fPath));
}

function _getPath(filePath, basepath) {
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  return basepath + path.sep + filePath;
}

function extendProductJson(json, basepath) {
  let auxIncludePath;
  Object.keys(json).forEach((k) => {
    if (json[k]) {
      if (typeof json[k] == "object") {
        json[k] = extendProductJson(json[k], basepath);
      } else if (
        typeof json[k] == "string" &&
        json[k].substr(0, 9) == "@include:"
      ) {
        auxIncludePath = _getPath(json[k].substr(9), basepath);
        if (!fs.existsSync(auxIncludePath)) {
          throw `@includes directive pointing a not existing path: ${auxIncludePath}`;
        }
        json[k] = readFile(auxIncludePath);
        try {
          // if it is a json, we parse it; otherwise, we will use the plain text
          json[k] = JSON.parse(json[k]);
        } catch (e) {
          // we remove the blank extra line of the file if it exists
          if (json[k].substr(-1) == "\n") {
            json[k] = json[k].slice(0, -1);
          }
        }
      }
    }
  });
  return json;
}
