import fs from "fs";
import { DerivationEngine, readJsonFromFile, readFile } from "../src/index.js";
import {
  getTestPath as p,
  removeTmpFolder,
  assertEqualFilesInFolders,
} from "./test-utils.js";
import assert from "assert";

suite("#DerivationEngine");

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("Create a product without feature selection or any custom data", async () => {
  const engine = await new DerivationEngine(p("simpleSPL/code"));

  engine.generateProduct(p("tmp/simpleProduct"));

  assertEqualFilesInFolders(p("simpleSPL/code"), p("tmp/simpleProduct"));
});

test("Create a product", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPL/code"),
    readJsonFromFile(p("simpleSPL/model.json")),
    readJsonFromFile(p("simpleSPL/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPL/product.json"))
  );

  assertEqualFilesInFolders(p("simpleSPL/expected"), p("tmp/simpleProduct"));
});

test("Create a product with data", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithData/code"),
    readJsonFromFile(p("simpleSPLwithData/model.json")),
    readJsonFromFile(p("simpleSPLwithData/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithData/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithData/expected"),
    p("tmp/simpleProduct")
  );
});

test("Create a product and use some extra js function", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithExtraJS/code"),
    readJsonFromFile(p("simpleSPLwithExtraJS/model.json")),
    readJsonFromFile(p("simpleSPLwithExtraJS/config.json")),
    readFile(p("simpleSPLwithExtraJS/js.js"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithExtraJS/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithExtraJS/expected"),
    p("tmp/simpleProduct")
  );
});

test("Create a product with data parameters at several levels", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithDataComplex/code"),
    readJsonFromFile(p("simpleSPLwithDataComplex/model.json")),
    readJsonFromFile(p("simpleSPLwithDataComplex/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithDataComplex/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithDataComplex/expected"),
    p("tmp/simpleProduct")
  );
});

test("Model transformation", (done) => {
  new DerivationEngine(
    p("simpleSPLwithTransformation/code"),
    readJsonFromFile(p("simpleSPLwithTransformation/model.json")),
    readJsonFromFile(p("simpleSPLwithTransformation/config.json")),
    "",
    readFile(p("simpleSPLwithTransformation/transformation.js"))
  ).then((engine) => {
    engine.generateProduct(
      p("tmp/simpleProduct"),
      readJsonFromFile(p("simpleSPLwithTransformation/product.json"))
    );

    assertEqualFilesInFolders(
      p("simpleSPLwithTransformation/expected"),
      p("tmp/simpleProduct")
    );
    done();
  });
});

suite("#DerivationEngine: Binay files and no extension files");

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test('Checking "binarity" of unknown extensions not in config', async () => {
  const engine = await new DerivationEngine(
    p("checkBinary/code"),
    readJsonFromFile(p("checkBinary/model.json")),
    readJsonFromFile(p("checkBinary/config.json"))
  );
  // g4 extension is binary if asking isTextOrBinary
  engine.generateProduct(
    p("tmp/checkBinary"),
    readJsonFromFile(p("checkBinary/product.json"))
  );

  // therefore not generated so delimiters still appear in the generated version
  assertEqualFilesInFolders(p("checkBinary/expected"), p("tmp/checkBinary"));
});

test('Avoid checking "binarity" of extensions in config', async () => {
  const engine = await new DerivationEngine(
    p("checkBinary/code"),
    readJsonFromFile(p("checkBinary/model.json")),
    readJsonFromFile(p("checkBinary/config-including.json"))
  );

  // g4 extension is in the list of delimiters, so it should be considered text
  engine.generateProduct(
    p("tmp/checkBinary"),
    readJsonFromFile(p("checkBinary/product.json"))
  );

  assertEqualFilesInFolders(
    p("checkBinary/expected-including"),
    p("tmp/checkBinary")
  );
});

test("Create a product with a file without extension", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithDockerfile/code"),
    readJsonFromFile(p("simpleSPLwithDockerfile/model.json")),
    readJsonFromFile(p("simpleSPLwithDockerfile/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithDockerfile/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithDockerfile/expected"),
    p("tmp/simpleProduct")
  );
});

suite("#DerivationEngine: Generation of files");

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("From list of strings with nesting", async () => {
  const engine = await new DerivationEngine(
    p("spl-generate/code"),
    readJsonFromFile(p("spl-generate/model.json")),
    readJsonFromFile(p("spl-generate/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("spl-generate/product.json"))
  );

  assertEqualFilesInFolders(p("spl-generate/expected"), p("tmp/simpleProduct"));
});

test("Create folder", async () => {
  const engine = await new DerivationEngine(
    p("spl-generate-folder/code"),
    readJsonFromFile(p("spl-generate-folder/model.json")),
    readJsonFromFile(p("spl-generate-folder/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("spl-generate-folder/product.json"))
  );

  assertEqualFilesInFolders(
    p("spl-generate-folder/expected"),
    p("tmp/simpleProduct")
  );
});

test("Using first character of end delimiter in the filename of generated files", async () => {
  const engine = await new DerivationEngine(
    p("spl-generate-escape/code"),
    readJsonFromFile(p("spl-generate-escape/model.json")),
    readJsonFromFile(p("spl-generate-escape/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("spl-generate-escape/product.json"))
  );

  assertEqualFilesInFolders(
    p("spl-generate-escape/expected"),
    p("tmp/simpleProduct")
  );
});

test("Omitting empty files", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithEmptyFiles/code"),
    readJsonFromFile(p("simpleSPLwithEmptyFiles/model.json")),
    readJsonFromFile(p("simpleSPLwithEmptyFiles/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithEmptyFiles/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithEmptyFiles/expected"),
    p("tmp/simpleProduct")
  );
});

test("Omitting empty files with double annotation", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithEmptyFiles2/code"),
    readJsonFromFile(p("simpleSPLwithEmptyFiles2/model.json")),
    readJsonFromFile(p("simpleSPLwithEmptyFiles2/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithEmptyFiles2/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithEmptyFiles2/expected"),
    p("tmp/simpleProduct")
  );
});

suite("#DerivationEngine: Includes in the product specification");

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("Create a product with includes", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithIncludes/code"),
    readJsonFromFile(p("simpleSPLwithIncludes/model.json")),
    readJsonFromFile(p("simpleSPLwithIncludes/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithIncludes/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithIncludes/expected"),
    p("tmp/simpleProduct")
  );
});

test("Check if @includes with absolute path works", async () => {
  const originalFile = readFile(p("simpleSPLwithIncludes/product.json"));
  const fullPath = `${process.cwd()}/${p("simpleSPLwithIncludes/includes")}`;
  const newFileContent = originalFile.replaceAll(
    "@include:includes",
    `@include:${fullPath}`
  );

  fs.mkdirSync(p("tmp"));
  fs.writeFileSync(
    p("tmp/productWithAbslutePathIncludes.json"),
    newFileContent,
    "utf8"
  );

  const originalJsonFile = readJsonFromFile(
    p("simpleSPLwithIncludes/product.json")
  );
  const newJsonFile = readJsonFromFile(
    p("tmp/productWithAbslutePathIncludes.json")
  );

  assert.deepEqual(originalJsonFile, newJsonFile);
});

test("Provide an exception if there is a problem with @includes", async () => {
  assert.throws(() => {
    readJsonFromFile(p("simpleSPLwithIncludes/productWithErrors.json"));
  }, /@includes directive pointing a not existing path/);
});

test("Create a product with UVL format", async () => {
  const engine = await new DerivationEngine(
    p("simpleSPLwithUVL/code"),
    p("simpleSPLwithUVL/model.uvl"),
    readJsonFromFile(p("simpleSPLwithUVL/config.json"))
  );

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithUVL/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithUVL/expected"),
    p("tmp/simpleProduct")
  );
});
