import FeatureModel from "./feature-model/feature-model.js";
import TemplateEngine from "./template-engine/template-engine.js";
import AnalysisReport from "./template-engine/analysis-report.js";
import { LocalOutput, ZipOutput } from "./output.js";
import { LocalInput, ZipInput } from "./input.js";
import {
  getExtension,
  getFolder,
  getFileName,
  readJsonFromFile,
} from "./file-utils.js";
import _eval from "eval";
import UVLFeatureModel from "./feature-model/feature-model-uvl.js";

export default class DerivationEngine {
  constructor(
    codePath,
    featureModel,
    config,
    extraJS,
    modelTransformation,
    verbose,
    components = []
  ) {
    const promises = [];

    if (typeof codePath === "object" && codePath.zip) {
      // codePath is in fact an object with all the params
      /**
       *
       * @param {zip} zipFile
       * @param {
       *          featureModel: path to feature model within the zip file,
       *          config: path to config within the zip file,
       *          extraJS: path to extra.js within the zip file,
       *          verbose: global verbose flag (boolean)
       *        } opts
       */
      this.input = new ZipInput(codePath.zip, codePath.codePath || "code");
      if (this.input.exists(codePath.extraJS || "extra.js")) {
        promises.push(
          this.input
            .get(codePath.extraJS || "extra.js")
            .then((content) => (extraJS = content))
        );
      }
      promises.push(
        this.input
          .get(codePath.featureModel || "model.xml")
          .then((content) => (featureModel = content))
      );
      promises.push(
        this.input
          .get(codePath.config || "config.json")
          .then((content) => (config = JSON.parse(content)))
      );
      if (
        this.input.exists(codePath.modelTransformation || "transformation.js")
      ) {
        promises.push(
          this.input
            .get(codePath.modelTransformation || "transformation.js")
            .then((content) => (modelTransformation = content))
        );
      }
      verbose = codePath.verbose;
    } else {
      /**
       *
       * @param String codePath - path to the annotated code
       * @param JSON|XML featureModel - feature model in json or xml text
       * @param Object config - json with config options
       * @param JS extraJS - javascript text that work as helper functions during the derivation
       * @param JSFunction modelTransformation - javascript text with a function that transforms the product
       * @param boolean verbose - global verbose flag (boolean)
       */
      if (typeof codePath === "object") {
        ({
          codePath,
          featureModel,
          config,
          extraJS,
          modelTransformation,
          verbose,
          components,
        } = codePath);
      }
      this.input = new LocalInput(codePath);
    }

    return Promise.all(promises)
      .then(() => {
        this.templateEngine = new TemplateEngine({}, extraJS);

        if (config) {
          this.setConfig(config);
        }

        if (featureModel) {
          this.setFeatureModel(featureModel, components);
        }

        if (modelTransformation) {
          this.setModelTransformation(modelTransformation);
        }

        this.verbose = verbose;
      })
      .then(() => {
        return this;
      });
  }

  generateZip(product = {}, opts = {}) {
    return this.generate(product, { type: "zip", verbose: opts.verbose });
  }

  generateProduct(outputPath, product = {}) {
    return this.generate(product, { type: "local", outputPath: outputPath });
  }

  /**
   *
   * @param JSON product - json spec of the product
   * @param {
   *          type = local | zip,
   *          verbose: Boolean - local verbose flag,
   *          outputPath: String
   *        } opts
   *
   */
  generate(product = {}, opts = {}) {
    this.verbose = opts.verbose || this.verbose;
    opts.type = opts.type || "zip";

    if (this.modelTransformation) {
      product = this.modelTransformation(product);
    }
    const features = this._prepareFeatures(product.features);

    const data = product.data || {};
    const fileGenerator = this.templateEngine.createFileGenerator(
      features,
      data
    );
    const processor = this.templateEngine.createProcessor(features, data);

    if (opts.type == "zip") {
      this.output = new ZipOutput();
    } else {
      this.output = new LocalOutput(opts.outputPath);
    }

    //Proceso codeInsertionPoint (cip)
    const tmpPath = "tmp/";
    const idCipMain = ".cipmain";
    const idCip = ".cip";
    const delimiterCip = "cip";

    this.input.copyTemplateCip(tmpPath, [idCipMain, idCip]);
    this.inputCip = new LocalInput(tmpPath);
    this.outputTmp = new LocalOutput(tmpPath);

    this.inputCip.forEachCodeFile((fPath, fContent) => {
      const fileName = getFileName(fPath);
      if (!fileName.includes(idCipMain)) return;
      let folder = getFolder(fPath.substring(fPath.indexOf("code"))) + "\\";
      let nameWithoutExt = fileName.substring(0, fileName.indexOf(idCipMain));
      let nameCip = nameWithoutExt + idCip + "." + getExtension(fPath);
      let contentCip = this.inputCip.findFile(folder + nameCip);
      const generatedContent = processor.process_cpi(
        fContent,
        delimiterCip,
        {},
        contentCip
      );
      const generatedFilePath = (
        folder +
        nameWithoutExt +
        "." +
        getExtension(fPath)
      ).replace("./", "");

      if (
        generatedContent &&
        (typeof generatedContent != "string" || generatedContent.trim())
      ) {
        this.outputTmp.add(generatedFilePath, generatedContent);
      }
    });
    this.input.addCodePath(tmpPath + "code");
    //Fin Proceso codeInsertionPoint (cip)

    return this.input
      .forEachCodeFile((fPath, fContent, isText) => {
        if (!isText) {
          return this.output.add(fPath, fContent, true);
        }

        if (this.verbose) {
          console.log("");
          console.log("Input file.....: " + fPath);
        }

        fileGenerator
          .filesToCreate(
            fContent,
            getExtension(fPath),
            getFileName(fPath),
            "",
            {}
          )
          .forEach((r) => {
            if (this.verbose) {
              console.log("File name..: " + r.fileName);
              console.log(
                "Output file: " + getFolder(fPath) + "/" + r.fileName
              );
            }
            if (fPath.includes(idCipMain) || fPath.includes(idCip)) return;
            let valida = this.output.fileExists(fPath);

            const generatedContent = processor.process(
              r.fileContent,
              getExtension(fPath),
              r.context
            );
            const generatedFilePath = (
              getFolder(fPath) +
              "/" +
              r.fileName
            ).replace("./", "");
            if (
              generatedContent &&
              (typeof generatedContent != "string" || generatedContent.trim())
            ) {
              if (valida) {
                return this.output.append(generatedFilePath, generatedContent);
              } else {
                return this.output.add(generatedFilePath, generatedContent);
              }
            }
          });
      })
      .then(() => this.output.get());
  }

  _prepareFeatures(productFeatures) {
    if (!productFeatures) return {};
    const features = {};
    this.featureModel.completeFeatureSelection(productFeatures).forEach((f) => {
      features[f] = true;
    });
    return features;
  }

  setModelTransformation(mt) {
    this.modelTransformation = _eval(mt, "transformation.js");
  }

  setFeatureModel(featureModel, components = []) {
    if (!featureModel) throw "feature model must be provided";

    if (typeof featureModel == "object") {
      this.featureModel = FeatureModel.fromJson(featureModel);
    } else {
      try {
        this.featureModel = FeatureModel.fromJson(JSON.parse(featureModel));
      } catch (e) {
        if (featureModel.endsWith("uvl")) {
          this.featureModel = FeatureModel.fromUVL(featureModel, components);
          if (components.length > 0) {
            this.setComponents(featureModel, components);
          }
        } else {
          this.featureModel = FeatureModel.fromXml(featureModel);
        }
      }
    }
    this.featureModel.validateFeatureModel();
  }

  setConfig(config) {
    if (Array.isArray(config.delimiters)) {
      config.delimiters.forEach((d) => {
        d.extension.forEach((e) => {
          this.input.addHandledExtension(e);
          if (d.delimiter) {
            this.templateEngine.addDelimiters(e, d.delimiter);
          } else {
            this.templateEngine.addDelimiter(e, d.start, d.end);
          }
        });
      });
    }
    if (Array.isArray(config.ignore)) {
      this.input.setIgnorePattern(config.ignore);
    }
  }

  analyseAnnotations() {
    const report = new AnalysisReport(this.featureModel);
    const analyser = this.templateEngine.createAnalyser();

    return this.input
      .forEachCodeFile((fPath, fContent, isText) => {
        if (!isText) return;
        return report.addAnalysis(
          fPath,
          analyser.analyse(fContent, getExtension(fPath))
        );
      })
      .then(() => report);
  }

  setComponents(featureModel, components) {
    let names = UVLFeatureModel.getUVLImports(featureModel);
    names.forEach((name) => {
      const component = components.find((c) => c.name === name);
      let config = readJsonFromFile(component.config);
      if (Array.isArray(config.delimiters)) {
        config.delimiters.forEach((d) => {
          d.extension.forEach((e) => {
            this.input.addHandledExtension(e);
            this.templateEngine.appendDelimiter(e, d.start, d.end);
          });
        });
      }
      this.input.addCodePath(component.codePath, component.main);
    });
  }
}
