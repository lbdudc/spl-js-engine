import { UVLJavaScriptParser, FeatureModel } from "uvl-parser";
import FeatureModelSPL from "./feature-model.js";
import Feature from "./feature.js";
import { readJsonFromFile, readFile } from "../file-utils.js";

export default class UVLFeatureModel {
  constructor(filePathUVL, components) {
    this.components = components;
    this.filePathUVL = filePathUVL;
    this.imports = [];
  }

  static getAliasImport(childImport){
    let aliasChildImport = null;
    if (childImport.alias!== null){
      aliasChildImport = childImport.alias.getText().trim()
    }
    return aliasChildImport
  }

  static getUVLImports(featureModel,components) {
    let paths = [];
    const fm = new FeatureModel(featureModel);
    const tree = fm.getFeatureModel();
    const listImports = tree.imports();
    if (listImports !== null) {
      listImports.children.forEach((childImport) => {
        if (childImport instanceof UVLJavaScriptParser.ImportLineContext) {
          let nameChildImport = childImport.ns.getText().trim();
          let aliasChildImport = UVLFeatureModel.getAliasImport(childImport);
          paths.push(nameChildImport);
          let codePathImport = components[nameChildImport];              
          childImport = UVLFeatureModel.getUVLImports(codePathImport+"/model.uvl",components);
          paths = childImport.length > 0 ? paths.concat(childImport) : paths;
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
    const namespace = this.getNamespace(tree);
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
        listImports,
        null
      );
      return fm;
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

  getUVLFeatureChildren(group, fm, type, parent, listImports, aliasImport) {
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
                  name: aliasImport != null ? aliasImport+'.'+referenceContext.getText() : referenceContext.getText(),
                };
                const _feature = Feature.fromUVL(newFeature, parent, typeFinal);
                this.getUVLFeatureChildren(_group, fm, typeChild, _feature,aliasImport);
              } else {
                let nameImport = referenceContext.getChild(0).getText().trim();
                let nameFeature = referenceContext.getChild(2).getText().trim();
                this.getUVLImport(listImports, nameImport, nameFeature, parent);
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
          let nameChildImport = childImport.ns.getText().trim();
          let aliasChildImport = UVLFeatureModel.getAliasImport(childImport);
          let codePathImport = this.components[nameChildImport];   
          if (codePathImport == null){
            return;
          }
          const fm_ = new FeatureModel(codePathImport+"/model.uvl");
          const tree_import = fm_.getFeatureModel();               
          let namespaceImport = this.getNamespace(tree_import);
          if (
              nameChildImport == nameImport || aliasChildImport == nameImport || namespaceImport == nameImport
            ) {              
              if (this.imports.indexOf(nameImport) !== -1){
                return; 
              } else {
                this.imports.push(nameImport);          
              }
              const _listFeatures = tree_import.features();
              const _listImports = tree_import.imports();
              if (_listImports !== null) {
                try {
                  let comp = readJsonFromFile(codePathImport+"/components.json")
                  if (comp) {
                      Object.assign(this.components, comp);
                  } 
                }
                catch (error) {
                    throw ("Error reading the JSON file 'components.json':");
                }
              }                
              
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
                    _listImports,
                    aliasChildImport != null ? aliasChildImport : namespaceImport != null ? namespaceImport : null
                  );
                  this.getUVLConstraints(tree_import, fm);
                }
              }
          }
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