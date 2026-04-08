import { UVLJavaScriptParser, FeatureModel } from "uvl-parser";
import FeatureModelSPL from "./feature-model.js";
import Feature from "./feature.js";
import TYPE from "./feature-type.js";

export default class UVLFeatureModel {
  constructor(filePathUVL) {
    this.filePathUVL = filePathUVL;
    this.imports = [];
    this.fm = null;
  }

  getUVLFeatureModel() {
    /*Main function*/
    const featureModel = new FeatureModel(this.filePathUVL);
    const tree = featureModel.getFeatureModel();
    this.getUVLFeature(tree);
    this.getUVLConstraints(tree);
    return this.fm;
  }

  getUVLFeature(tree) {
    this.getNamespace(tree);
    const listFeatures = tree.features();
    const listImports = tree.imports();
    if (listFeatures !== null) {
      const feature = listFeatures.feature();
      this.fm = new FeatureModelSPL(feature.getChild(0).getText());
      this.getUVLFeatureChildren(feature.group(), this.fm, listImports, null);
    }
  }

  getNamespace(tree) {
    const namespace = tree.namespace();
    let name = null;
    if (namespace instanceof UVLJavaScriptParser.NamespaceContext) {
      namespace.children.forEach((child) => {
        if (child instanceof UVLJavaScriptParser.ReferenceContext) {
          name = child.getText();
          return true;
        }
      });
    }
    return name;
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

  getUVLFeatureChildren(group, parent, listImports, aliasImport) {
    group.forEach((f1) => {
      const typeChild = this.getContextType(f1);
      const typeFinal =
        typeChild == "mandatory" || typeChild == "optional" ? "and" : typeChild;
      f1.children.forEach((groupSpec) => {
        if (groupSpec instanceof UVLJavaScriptParser.GroupSpecContext) {
          groupSpec.children.forEach((featureContext) => {
            if (featureContext instanceof UVLJavaScriptParser.FeatureContext) {
              const referenceContext = featureContext.getChild(0);
              if (referenceContext.getChildCount() == 1) {
                const _group = featureContext.group();
                let newFeature = {
                  disabled: false,
                  mandatory: typeChild == "mandatory" ? true : false,
                  name:
                    aliasImport != null
                      ? aliasImport + "." + referenceContext.getText()
                      : referenceContext.getText(),
                };
                const _feature = Feature.fromUVL(newFeature, parent, typeFinal);
                this.getUVLFeatureChildren(
                  _group,
                  _feature,
                  listImports,
                  aliasImport
                );
              }
            }
          });
        }
      });
    });
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

  processDetailConstraints(constraint) {
    let textParts = constraint.getText().split(".");
    if (textParts.length > 1) {
      textParts = this.imports.some(
        (importObj) => importObj.import === textParts[textParts.length - 2]
      )
        ? textParts[textParts.length - 1]
        : textParts.slice(-2).join(".");
    } else {
      textParts = textParts[textParts.length - 1];
    }
    return textParts;
  }

  getUVLDetailConstraints(constraintContext) {
    if (constraintContext.getChild(0).getText() === "(") {
      return this.getUVLDetailConstraints(constraintContext.getChild(1));
    }

    const type = this.getConstraintType(constraintContext);
    let newConstraint = {
      children: [],
      name: type,
    };
    let child = null;
    const indices = type === "not" ? [1] : [0, 2];
    indices.forEach((value) => {
      if (
        constraintContext.getChild(value) instanceof
        UVLJavaScriptParser.LiteralConstraintContext
      ) {
        child = {
          name: "var",
          val: this.processDetailConstraints(constraintContext.getChild(value)),
        };
      } else {
        child = this.getUVLDetailConstraints(constraintContext.getChild(value));
      }
      newConstraint.children.push(child);
    });
    return newConstraint;
  }

  getUVLConstraints(tree) {
    const listConstraints = tree.constraints();
    if (listConstraints !== null) {
      listConstraints.children.forEach((constraint) => {
        if (constraint instanceof UVLJavaScriptParser.ConstraintLineContext) {
          constraint.children.forEach((constraintContext) => {
            if (
              constraintContext instanceof UVLJavaScriptParser.ConstraintContext
            ) {
              let newConstraint =
                this.getUVLDetailConstraints(constraintContext);
              this.fm.constraintSet.fromUVL(newConstraint);
            }
          });
        }
      });
    }
  }

  static toUVL(featureModel) {
    let uvlModel = null;
    uvlModel =
      UVLFeatureModel.readFeatures(featureModel, "features", 0) +
      UVLFeatureModel.readConstraints(featureModel);
    return uvlModel;
  }

  static readFeatures(feature, result, tabCount) {
    tabCount += 1;
    result +=
      "\n" +
      "\t".repeat(tabCount) +
      feature.name.trim() +
      this.readAttributes(feature);
    tabCount += 1;
    let mandatory = false;
    let relationName = null;
    feature.features.forEach((featureNode, index) => {
      if (
        featureNode.mandatory & !mandatory ||
        !featureNode.mandatory & mandatory ||
        index === 0
      ) {
        relationName = this.serializeType(feature.type, featureNode.mandatory);
        if (relationName !== "") {
          result += "\n" + "\t".repeat(tabCount) + relationName;
        }
      }
      mandatory = featureNode.mandatory;
      result = this.readFeatures(featureNode, result, tabCount);
    });
    return result;
  }

  static readAttributes(feature) {
    const attributes = [];
    if (feature.abstract) {
      attributes.push("abstract");
    } else if (feature.hidden) {
      attributes.push("hidden");
    }
    return attributes.length > 0 ? ` {${attributes.join(", ")}}` : "";
  }

  static serializeType(type, mandatory) {
    let result = "";
    if (mandatory) {
      result = "mandatory";
    } else if (type == TYPE.ALT) {
      result = "alternative";
    } else if (type == TYPE.AND) {
      result = "optional";
    } else if (type == TYPE.OR) {
      result = "or";
    } else if (type == TYPE.FEATURE) {
      result = "";
    }
    return result;
  }

  static readConstraints(featureModel) {
    let result = "";
    const constraints = featureModel.constraintSet.constraints;
    if (constraints && constraints.length > 0) {
      result = "constraints";
      constraints.forEach((constraint) => {
        const constraintText = this.serializeConstraint(constraint);
        result += "\n\t" + constraintText;
      });
    }
    return result == "" ? "" : "\n" + result;
  }

  static serializeConstraint(ctc) {
    return ctc
      .toString()
      .replace(/\bOR\b/g, "|")
      .replace(/\bAND\b/g, "&")
      .replace(/\bNOT\b/g, "!");
  }
}
