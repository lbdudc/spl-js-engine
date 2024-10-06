import { UVLJavaScriptParser, FeatureModel } from "uvl-parser";
import FeatureModelSPL from "./feature-model.js";
import Feature from "./feature.js";

export default class UVLFeatureModel {
  constructor(filePathUVL, components) {
    this.components = components;
    this.filePathUVL = filePathUVL;
  }

  static getUVLImports(featureModel) {
    const paths = [];
    const fm = new FeatureModel(featureModel);
    const tree = fm.getFeatureModel();
    const listImports = tree.imports();
    if (listImports !== null) {
      listImports.children.forEach((childImport) => {
        if (childImport instanceof UVLJavaScriptParser.ImportLineContext) {
          childImport.children.forEach((child) => {
            if (child instanceof UVLJavaScriptParser.ReferenceContext) {
              const name = child.getText();
              paths.push(name);
            }
          });
        }
      });
    }
    return paths;
  }

  getUVLFeatureModel() {
    /*Main function*/
    const featureModel = new FeatureModel(this.filePathUVL);
    const tree = featureModel.getFeatureModel();
    let fm = this.getUVLFeature(tree);
    this.getUVLConstraints(tree, fm);
    return fm;
  }

  getUVLFeature(tree) {
    const listFeatures = tree.features();
    const listImports = tree.imports();
    if (listFeatures !== null) {
      const feature = listFeatures.feature();
      let fm = new FeatureModelSPL(feature.getChild(0).getText());
      this.getUVLFeatureChildren(
        feature.group(),
        fm,
        "mandatory",
        fm,
        listImports
      );
      return fm;
    }
  }

  getContextType(group) {
    let type = "";
    switch (true) {
      case group instanceof UVLJavaScriptParser.OrGroupContext:
        type = "or";
        break;
      case group instanceof UVLJavaScriptParser.AlternativeGroupContext:
        type = "alt";
        break;
      case group instanceof UVLJavaScriptParser.OptionalGroupContext:
        type = "optional";
        break;
      case group instanceof UVLJavaScriptParser.MandatoryGroupContext:
        type = "mandatory";
        break;
      case group instanceof UVLJavaScriptParser.CardinalityGroupContext:
        type = "or";
        break;
      default:
        console.log("Tipo de variable desconocido");
    }
    return type;
  }

  getUVLFeatureChildren(group, fm, type, parent, listImports) {
    group.forEach((f1) => {
      const typeChild = this.getContextType(f1);
      const typeFinal =
        type == "mandatory" || type == "optional" ? "and" : type;
      f1.children.forEach((groupSpec) => {
        if (groupSpec instanceof UVLJavaScriptParser.GroupSpecContext) {
          groupSpec.children.forEach((featureContext) => {
            if (featureContext instanceof UVLJavaScriptParser.FeatureContext) {
              const referenceContext = featureContext.getChild(0);
              if (referenceContext.getChildCount() == 1) {
                const _group = featureContext.group();
                let newFeature = {
                  disabled: "false",
                  mandatory: typeChild == "mandatory" ? "true" : false,
                  name: referenceContext.getText(),
                };
                const _feature = Feature.fromUVL(newFeature, parent, typeFinal);
                this.getUVLFeatureChildren(_group, fm, typeChild, _feature);
              } else {
                let nameImport = referenceContext.getChild(0).getText();
                let nameFeature = referenceContext.getChild(2).getText();
                this.getUVLImport(listImports, nameImport, nameFeature, fm);
              }
            }
          });
        }
      });
    });
  }

  getUVLImport(listImports, nameImport, nameFeature, fm) {
    if (listImports !== null) {
      listImports.children.forEach((childImport) => {
        if (childImport instanceof UVLJavaScriptParser.ImportLineContext) {
          childImport.children.forEach((child) => {
            if (
              child instanceof UVLJavaScriptParser.ReferenceContext &&
              child.getText() == nameImport
            ) {
              const component = this.components.find(
                (c) => c.name === nameImport
              );
              const fm_ = new FeatureModel(component.featureModel);
              const tree_import = fm_.getFeatureModel();
              const _listFeatures = tree_import.features();
              const _listImports = tree_import.imports();
              if (_listFeatures !== null) {
                const feature = _listFeatures.feature();
                if (feature.getChild(0).getText() == nameFeature) {
                  let group = feature.group();
                  let newFeature = {
                    disabled: "false",
                    mandatory: "true",
                    name: nameFeature,
                  };
                  const _feature = Feature.fromUVL(newFeature, fm, "and");
                  this.getUVLFeatureChildren(
                    group,
                    fm,
                    "mandatory",
                    _feature,
                    _listImports
                  );
                }
              }
            }
          });
        }
      });
    }
    return fm;
  }

  getConstraintType(contraintContext) {
    let type = "";
    switch (true) {
      case contraintContext instanceof
        UVLJavaScriptParser.ImplicationConstraintContext:
        type = "imp";
        break;
      case contraintContext instanceof UVLJavaScriptParser.OrConstraintContext:
        type = "disj";
        break;
      //case contraintContext instanceof UVLJavaScriptParser.LiteralConstraintContext:
      //  type = 'alt'
      //  break;
      //case contraintContext instanceof UVLJavaScriptParser.ParenthesisConstraintContext:
      //  type = 'and'
      //  break;
      case contraintContext instanceof UVLJavaScriptParser.NotConstraintContext:
        type = "not";
        break;
      case contraintContext instanceof UVLJavaScriptParser.AndConstraintContext:
        type = "conj";
        break;
      case contraintContext instanceof
        UVLJavaScriptParser.EquivalenceConstraintContext:
        type = "eq";
        break;
      default:
        console.log("Tipo de variable desconocido");
    }
    return type;
  }

  getUVLConstraints(tree, fm) {
    const listContrains = tree.constraints();
    if (listContrains !== null) {
      listContrains.children.forEach((contraint) => {
        if (contraint instanceof UVLJavaScriptParser.ConstraintLineContext) {
          contraint.children.forEach((contraintContext) => {
            if (
              contraintContext instanceof UVLJavaScriptParser.ConstraintContext
            ) {
              const type = this.getConstraintType(contraintContext);
              let newContraint = {
                children: [
                  { name: "var", val: contraintContext.getChild(0).getText() },
                  { name: "var", val: contraintContext.getChild(2).getText() },
                ],
                name: type,
              };
              fm.constraintSet.fromUVL(newContraint);
            }
          });
        }
      });
    }
  }
}
