#!/usr/bin/env node

import meow from "meow";
import fs from "fs";
import path from "path";
import { DerivationEngine, readJsonFromFile, readFile } from "./index.js";
import JSZip from "jszip";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usage = fs.readFileSync(path.join(__dirname, "../usage.txt"), "utf8");

export function cli() {
  const cli = meow(usage, { importMeta: import.meta });
  const {
    featureModel,
    product,
    config,
    code,
    extra,
    output = "output",
    modelTransformation = null,
    verbose = false,
    zip,
    outputType = "folder",
  } = cli.flags;
  const validation = cli.input.indexOf("validate") != -1;

  if (!(code && featureModel) && !zip) {
    cli.showHelp();
  }

  const enginePromise = zip
    ? JSZip.loadAsync(fs.readFileSync(zip)).then((zipFile) =>
        cliZip(
          zipFile,
          code,
          featureModel,
          config,
          extra,
          modelTransformation,
          verbose
        )
      )
    : cliLocal(code, featureModel, config, extra, modelTransformation, verbose);

  enginePromise.then((engine) => {
    let productJson = {};
    if (product) {
      productJson = readJsonFromFile(product);
    }

    if (validation) {
      validate(engine, productJson);
    }

    if (outputType == "folder") {
      engine.generateProduct(output, productJson).then(finish);
    } else if (outputType == "zip") {
      let outputZip = output;
      if (!outputZip.endsWith(".zip")) outputZip += ".zip";

      fs.mkdirSync(path.dirname(outputZip), { recursive: true });
      engine.generateZip(productJson).then((zip) => {
        zip
          .generateNodeStream({ type: "nodebuffer", streamFiles: true })
          .pipe(fs.createWriteStream(outputZip))
          .on("finish", () => finish(outputZip));
      });
    } else {
      this.showHelp();
    }
  });
}

function finish(outputZip) {
  console.log(`Product generated at ${outputZip}`);
  process.exit(0);
}

function cliZip(
  zip,
  code,
  featureModel,
  config,
  extra,
  modelTransformation,
  verbose
) {
  return new DerivationEngine({
    zip,
    codePath: code,
    featureModel,
    config,
    extraJS: extra,
    modelTransformation,
    verbose,
  });
}

function cliLocal(
  code,
  featureModel,
  config,
  extra,
  modelTransformation,
  verbose
) {
  let configJson = {};
  if (config) {
    configJson = readJsonFromFile(config);
  }

  let mt = null;
  if (modelTransformation) {
    mt = readFile(modelTransformation);
  }

  if (!featureModel.endsWith("uvl")) {
    featureModel = readFile(featureModel)
  }

  return new DerivationEngine(
    code,
    featureModel,
    configJson,
    extra ? readFile(extra) : null,
    mt,
    verbose
  );
}

function validate(engine, productJson) {
  const report = engine.analyseAnnotations();
  const featuresConsistency = report.checkAnnotatedFeaturesConsistency();
  const dataConsistency = report.checkAnnotatedDataConsistency(productJson);

  if (featuresConsistency.errors || dataConsistency.errors) {
    console.log("Inconsistency errors!");
    console.log("============================");
    console.log("Features consistency:");
    console.log(featuresConsistency);
    console.log("============================");
    console.log("Data parameters consistency:");
    console.log(dataConsistency);
    console.log("============================");
    return;
  } else if (featuresConsistency.warnings || dataConsistency.warnings) {
    console.log("Inconsistency warnings!");
    console.log("============================");
    console.log("Features consistency:");
    console.log(featuresConsistency);
    console.log("============================");
    console.log("Data parameters consistency:");
    console.log(dataConsistency);
    console.log("============================");
  }
}

cli();
