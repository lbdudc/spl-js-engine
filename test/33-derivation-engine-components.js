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
  const components = [
    {
      name: "componentA",
      codePath: p("simpleSPLwithComponents/componentA/code"),
      featureModel: p("simpleSPLwithComponents/componentA/model.uvl"),
      config: p("simpleSPLwithComponents/componentA/config.json"),
      path: p("simpleSPLwithComponents/componentA"),
      main: true,
    },
    {
      name: "componentB",
      codePath: p("simpleSPLwithComponents/componentB/code"),
      featureModel: p("simpleSPLwithComponents/componentB/model.uvl"),
      config: p("simpleSPLwithComponents/componentB/config.json"),
      path: p("simpleSPLwithComponents/componentB"),
    },
  ];

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
  const components = [
    {
      name: "componentA",
      codePath: p("simpleSPLwithComponents2/componentA/code"),
      featureModel: p("simpleSPLwithComponents2/componentA/model.uvl"),
      config: p("simpleSPLwithComponents2/componentA/config.json"),
      path: p("simpleSPLwithComponents2/componentA"),
      main: true,
    },
    {
      name: "componentB",
      codePath: p("simpleSPLwithComponents2/componentB/code"),
      featureModel: p("simpleSPLwithComponents2/componentB/model.uvl"),
      config: p("simpleSPLwithComponents2/componentB/config.json"),
      path: p("simpleSPLwithComponents2/componentB"),
    },
    {
      name: "componentC",
      codePath: p("simpleSPLwithComponents2/componentC/code"),
      featureModel: p("simpleSPLwithComponents2/componentC/model.uvl"),
      config: p("simpleSPLwithComponents2/componentC/config.json"),
      path: p("simpleSPLwithComponents2/componentC"),
    },
  ];

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

test("Create a product with components and different delimiters", async () => {
  const components = [
    {
      name: "componentA",
      codePath: p("simpleSPLwithComponents/componentA/code"),
      featureModel: p("simpleSPLwithComponents/componentA/model.uvl"),
      config: p("simpleSPLwithComponents/componentA/config.json"),
      path: p("simpleSPLwithComponents/componentA"),
      main: true,
    },
    {
      name: "componentB",
      codePath: p("simpleSPLwithComponents/componentB/code"),
      featureModel: p("simpleSPLwithComponents/componentB/model.uvl"),
      config: p("simpleSPLwithComponents/componentB/config.json"),
      path: p("simpleSPLwithComponents/componentB"),
    },
  ];

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
