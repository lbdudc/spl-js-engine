import { DerivationEngine, readJsonFromFile, readFile } from "../src/index.js";
import {
  getTestPath as p,
  removeTmpFolder,
  assertEqualFilesInFolders,
} from "./test-utils.js";
import JSZip from "jszip";
import fs from "fs";
import path from "path";

suite("#FileGeneration - checks that using zip or local files is the sames");

beforeEach(removeTmpFolder);
afterEach(removeTmpFolder);

test("Destructuring parameters", async () => {
  const engine = await new DerivationEngine({
    codePath: p("simpleSPL/code"),
    featureModel: readJsonFromFile(p("simpleSPL/model.json")),
    config: readJsonFromFile(p("simpleSPL/config.json")),
  });

  engine.generateProduct(
    p("tmp/simpleProduct"),
    readJsonFromFile(p("simpleSPL/product.json"))
  );

  assertEqualFilesInFolders(p("simpleSPL/expected"), p("tmp/simpleProduct"));
});

test("Generate local from zip", (done) => {
  JSZip.loadAsync(readFile(p("simpleSPL.zip"), true))
    .then((zip) => {
      new DerivationEngine({
        zip,
        featureModel: "model.json",
      }).then((engine) => {
        engine
          .generateProduct(
            p("tmp/simpleProduct"),
            readJsonFromFile(p("simpleSPL/product.json"))
          )
          .then(() => {
            assertEqualFilesInFolders(
              p("simpleSPL/expected"),
              p("tmp/simpleProduct")
            );
            done();
          });
      });
    })
    .catch((e) => done(e));
});

test("Generate local from zip with a folder inside", (done) => {
  JSZip.loadAsync(readFile(p("simpleSPLwithFolder.zip"), true))
    .then((zip) => {
      return new DerivationEngine({
        zip,
        featureModel: "simpleSPL/model.json",
        codePath: "simpleSPL/code",
        config: "simpleSPL/config.json",
      }).then((engine) => {
        engine
          .generateProduct(
            p("tmp/simpleProduct"),
            readJsonFromFile(p("simpleSPL/product.json"))
          )
          .then(() => {
            assertEqualFilesInFolders(
              p("simpleSPL/expected"),
              p("tmp/simpleProduct")
            );
            done();
          });
      });
    })
    .catch((e) => done(e));
});

test("Generate zip from zip", (done) => {
  JSZip.loadAsync(readFile(p("simpleSPL.zip"), true))
    .then((zip) => {
      new DerivationEngine({ zip, featureModel: "model.json" }).then(
        (engine) => {
          engine
            .generateZip(readJsonFromFile(p("simpleSPL/product.json")))
            .then((outputZipFile) => {
              fs.mkdirSync(p("tmp/simpleProduct"), { recursive: true });
              const promises = [];
              Object.keys(outputZipFile.files)
                .filter((fPath) => !outputZipFile.files[fPath].dir)
                .forEach((fPath) => {
                  fs.mkdirSync(p("tmp/simpleProduct/" + path.dirname(fPath)), {
                    recursive: true,
                  });
                  promises.push(
                    outputZipFile.files[fPath]
                      .async("nodebuffer")
                      .then((fContent) => {
                        fs.writeFileSync(
                          p("tmp/simpleProduct/") + fPath,
                          fContent
                        );
                      })
                  );
                });
              Promise.all(promises).then(() => {
                assertEqualFilesInFolders(
                  p("simpleSPL/expected"),
                  p("tmp/simpleProduct")
                );
                done();
              });
            });
        }
      );
    })
    .catch((e) => done(e));
});

test("Generate zip from local", (done) => {
  new DerivationEngine({
    codePath: p("simpleSPL/code"),
    featureModel: readJsonFromFile(p("simpleSPL/model.json")),
    config: readJsonFromFile(p("simpleSPL/config.json")),
  })
    .then((engine) => {
      engine
        .generateZip(readJsonFromFile(p("simpleSPL/product.json")))
        .then((outputZipFile) => {
          fs.mkdirSync(p("tmp/simpleProduct"), { recursive: true });
          const promises = [];
          Object.keys(outputZipFile.files)
            .filter((fPath) => !outputZipFile.files[fPath].dir)
            .forEach((fPath) => {
              fs.mkdirSync(p("tmp/simpleProduct/" + path.dirname(fPath)), {
                recursive: true,
              });
              promises.push(
                outputZipFile.files[fPath]
                  .async("nodebuffer")
                  .then((fContent) => {
                    fs.writeFileSync(p("tmp/simpleProduct/") + fPath, fContent);
                  })
              );
            });
          Promise.all(promises).then(() => {
            assertEqualFilesInFolders(
              p("simpleSPL/expected"),
              p("tmp/simpleProduct")
            );
            done();
          });
        });
    })
    .catch((e) => done(e));
});

test("Generate local from zip extending JSON", (done) => {
  JSZip.loadAsync(readFile(p("simpleSPLwithIncludes.zip"), true))
    .then((zip) => {
      new DerivationEngine({
        zip,
        featureModel: "model.json",
      }).then((engine) => {
        engine
          .generateProduct(
            p("tmp/simpleSPLwithIncludes"),
            readJsonFromFile(p("simpleSPLwithIncludes/product.json"))
          )
          .then(() => {
            assertEqualFilesInFolders(
              p("simpleSPLwithIncludes/expected"),
              p("tmp/simpleSPLwithIncludes")
            );
            done();
          });
      });
    })
    .catch((e) => done(e));
});

test("Generate zip from zip extending JSON", (done) => {
  JSZip.loadAsync(readFile(p("simpleSPLwithIncludes.zip"), true))
    .then((zip) => {
      new DerivationEngine({ zip, featureModel: "model.json" }).then(
        (engine) => {
          engine
            .generateZip(
              readJsonFromFile(p("simpleSPLwithIncludes/product.json"))
            )
            .then((outputZipFile) => {
              fs.mkdirSync(p("tmp/simpleSPLwithIncludes"), { recursive: true });
              const promises = [];
              Object.keys(outputZipFile.files)
                .filter((fPath) => !outputZipFile.files[fPath].dir)
                .forEach((fPath) => {
                  fs.mkdirSync(
                    p("tmp/simpleSPLwithIncludes/" + path.dirname(fPath)),
                    { recursive: true }
                  );
                  promises.push(
                    outputZipFile.files[fPath]
                      .async("nodebuffer")
                      .then((fContent) => {
                        fs.writeFileSync(
                          p("tmp/simpleSPLwithIncludes/") + fPath,
                          fContent
                        );
                      })
                  );
                });
              Promise.all(promises).then(() => {
                assertEqualFilesInFolders(
                  p("simpleSPLwithIncludes/expected"),
                  p("tmp/simpleSPLwithIncludes")
                );
                done();
              });
            });
        }
      );
    })
    .catch((e) => done(e));
});
