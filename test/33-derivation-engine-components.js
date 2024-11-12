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

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("Create a product with two components", async () => {
  const components = [
    {
      name: "componentA",
      nameProject: "componentA",
      main: true,
    },
    {
      name: "componentB",
      nameProject: "componentB",
    },
  ].map((component) => {
    return {
      name: component.name,
      codePath: p("simpleSPLwithComponents/" + component.name + "/code"),
      featureModel: p(
        "simpleSPLwithComponents/" + component.name + "/model.uvl"
      ),
      config: p("simpleSPLwithComponents/" + component.name + "/config.json"),
      path: p("simpleSPLwithComponents/" + component.name),
      main: component.main ? component.main : false,
    };
  });

  const engine = await new DerivationEngine({
    codePath: p("simpleSPLwithComponents/code"),
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

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("Create a product with three components", async () => {
  const components = [
    {
      name: "componentA",
      nameProject: "componentA",
      main: true,
    },
    {
      name: "componentB",
      nameProject: "componentB",
    },
    {
      name: "componentC",
      nameProject: "componentC",
    },
  ].map((component) => {
    return {
      name: component.name,
      codePath: p("simpleSPLwithComponents2/" + component.name + "/code"),
      featureModel: p(
        "simpleSPLwithComponents2/" + component.name + "/model.uvl"
      ),
      config: p("simpleSPLwithComponents2/" + component.name + "/config.json"),
      path: p("simpleSPLwithComponents2/" + component.name),
      main: component.main ? component.main : false,
    };
  });

  const engine = await new DerivationEngine({
    codePath: p("simpleSPLwithComponents2/code"),
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

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("Create a product with components and different delimiters", async () => {
  const components = [
    {
      name: "componentA",
      nameProject: "componentA",
      main: true,
    },
    {
      name: "componentB",
      nameProject: "componentB",
    },
  ].map((component) => {
    return {
      name: component.name,
      codePath: p(
        "simpleSPLwithComponentsDelimiter/" + component.name + "/code"
      ),
      featureModel: p(
        "simpleSPLwithComponentsDelimiter/" + component.name + "/model.uvl"
      ),
      config: p(
        "simpleSPLwithComponentsDelimiter/" + component.name + "/config.json"
      ),
      path: p("simpleSPLwithComponentsDelimiter/" + component.name),
      main: component.main ? component.main : false,
    };
  });

  const engine = await new DerivationEngine({
    codePath: p("simpleSPLwithComponentsDelimiter/code"),
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
