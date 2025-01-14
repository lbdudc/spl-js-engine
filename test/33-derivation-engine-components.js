import { DerivationEngine, readJsonFromFile } from "../src/index.js";
import {
  getTestPath as p,
  removeTmpFolder,
  assertEqualFilesInFolders,
} from "./test-utils.js";

suite("#DerivationEngine: UVL and Components");

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

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

test("Create a product with two components", async () => {
  
  const components = {
    "componentA": p("simpleSPLwithComponents/componentA"),
    "componentB": p("simpleSPLwithComponents/componentB")
  };

  const engine = await new DerivationEngine({
    featureModel: p("simpleSPLwithComponents/model.uvl"),
    components: components,
  });

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithComponents/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithComponents/expected"),
    p("tmp/simpleProduct")
  );
});

test("Create a product with three components", async () => {
  const components = {
    "componentA": p("simpleSPLwithComponents2/componentA"),
    "componentB": p("simpleSPLwithComponents2/componentB"),
    "componentC": p("simpleSPLwithComponents2/componentC")
  };

  const engine = await new DerivationEngine({
    featureModel: p("simpleSPLwithComponents2/model.uvl"),
    components: components,
  });

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithComponents2/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithComponents2/expected"),
    p("tmp/simpleProduct")
  );
});

test("Create a product with components with imports", async () => {
  const components = {
    "componentA": p("simpleSPLwithComponentsImport/componentA"),
    "componentB": p("simpleSPLwithComponentsImport/componentB")
  };

  const engine = await new DerivationEngine({
    featureModel: p("simpleSPLwithComponentsImport/model.uvl"),
    components: components,
  });

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithComponentsImport/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithComponentsImport/expected"),
    p("tmp/simpleProduct")
  );
});


test("Create a product with components with duplicate imports", async () => {
  const components = {
    "componentA": p("simpleSPLwithComponentsImportDuplicate/componentA"),
    "componentB": p("simpleSPLwithComponentsImportDuplicate/componentB")
  };

  const engine = await new DerivationEngine({
    featureModel: p("simpleSPLwithComponentsImportDuplicate/model.uvl"),
    components: components,
  });

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithComponentsImportDuplicate/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithComponentsImportDuplicate/expected"),
    p("tmp/simpleProduct")
  );
});


test("Create a product with components and different delimiters", async () => {
  const components = {
    "componentA": p("simpleSPLwithComponentsDelimiter/componentA"),
    "componentB": p("simpleSPLwithComponentsDelimiter/componentB"),
    "componentC": p("simpleSPLwithComponentsDelimiter/componentC")
  };

  const engine = await new DerivationEngine({
    featureModel: p("simpleSPLwithComponentsDelimiter/model.uvl"),
    components: components,
  });

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPLwithComponentsDelimiter/product.json"))
  );

  assertEqualFilesInFolders(
    p("simpleSPLwithComponentsDelimiter/expected"),
    p("tmp/simpleProduct")
  );
});
