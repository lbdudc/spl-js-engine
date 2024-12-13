import assert from "assert";
import fs from "fs";
import { readFile, walkDir } from "../src/file-utils.js";

export const getTestFileContent = (path, bin = null) =>
  readFile(`test/files/${path}`, bin);

export const getTestPath = (aPath) => `test/files/${aPath}`;

export const removeTmpFolder = () => {
  walkDir("test/files/tmp", (file, isFolder) => {
    if (isFolder) {
      fs.rmdirSync(file);
    } else {
      fs.unlinkSync(file);
    }
  });
  walkDir("tmp", (file, isFolder) => {
    if (isFolder) {
      fs.rmdirSync(file);
    } else {
      fs.unlinkSync(file);
    }
  });
};

export const assertEqualFilesInFolders = (first, second) => {
  const firstFiles = [];
  const secondFiles = [];

  walkDir(first, (file, isFolder) => {
    if (!isFolder) firstFiles.push(file.replace(first, ""));
  });
  walkDir(second, (file, isFolder) => {
    if (!isFolder) secondFiles.push(file.replace(second, ""));
  });

  assert.deepEqual(firstFiles.sort(), secondFiles.sort());
  firstFiles.forEach((file) => {
    assert.strictEqual(
      readFile(`${first}${file}`),
      readFile(`${second}${file}`)
    );
  });
};
