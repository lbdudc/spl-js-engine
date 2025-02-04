import xmldoc from "xmldoc";
import XMLWriter from "xml-writer";
import Feature from "./feature.js";
import ConstraintSet from "./constraints/constraint-set.js";
import TYPE from "./feature-type.js";
import Constraint from "./constraints/constraint.js";
import FeatureSelectionError from "./feature-selection-error.js";
import UVLFeatureModel from "./feature-model-uvl.js";

export default class FeatureModel extends Feature {
  constructor(name) {
    super(name, { mandatory: true, abstract: true });
    this.featureList = [];
    this.constraintSet = new ConstraintSet();

    this.addFeatureToFeatureList(this.name);
  }

  //////////////////////
  // Adding Features  //
  //////////////////////

  get(featureName) {
    if (!this.exists(featureName)) {
      throw new FeatureSelectionError(`feature ${featureName} not found`);
    }

    return super.get(featureName);
  }

  exists(featureName) {
    return this.featureList.indexOf(featureName.toLowerCase()) != -1;
  }

  addFeatureToFeatureList(featureName) {
    this.featureList.push(featureName.toLowerCase());
  }

  ///////////////////////////
  // String Representation //
  ///////////////////////////

  toString() {
    let constraints = "";
    if (this.constraintSet.hasConstraints()) {
      constraints = "\nConstraints: " + this.constraintSet.toString();
    }

    // provided than feature model is always mandatory and abstract,
    // only +_ is required to be deleted from feature.toString()
    return super.toString().substring(2) + constraints;
  }

  /////////////////
  // Validation  //
  /////////////////

  validateFeatureModel() {
    this.validateFeature();
  }

  /**
   * Returns the whole set of features required from a set of selected,
   * taking into account the constraints and relationships between features.
   *
   * It is possible to create a product just from a few features, but
   * then the rest of the minimum required (the mandatory ones, for example),
   * must be added using this method.
   *
   * @param  {String[]} namesOfSelectedFeatures - An array with the names of the
   * selected features
   * @return {String[]} The array with the feature names of the resulting set
   */
  completeFeatureSelection(namesOfSelectedFeatures) {
    this.validateFeatureModel();

    if (
      !Array.isArray(namesOfSelectedFeatures) ||
      namesOfSelectedFeatures.length == 0
    ) {
      namesOfSelectedFeatures = [this.name];
    }

    let errorCounter = 0;
    let auxLength = -1;
    while (auxLength != namesOfSelectedFeatures.length) {
      auxLength = namesOfSelectedFeatures.length;

      namesOfSelectedFeatures =
        this._completeFeatureSelectionWithoutConstraints(
          namesOfSelectedFeatures
        );

      namesOfSelectedFeatures = this.constraintSet.checkConstraints(
        namesOfSelectedFeatures
      );

      if (errorCounter++ > 1000) {
        throw (
          "unknown error getting all the features from selection " +
          "(1000 iterations already made)"
        );
      }
    }

    try {
      this._validateAltFeaturesFromSelection(namesOfSelectedFeatures);
    } catch (ex) {
      if (ex.message) {
        throw new FeatureSelectionError(
          ex.message,
          namesOfSelectedFeatures,
          ex
        );
      } else {
        throw new FeatureSelectionError(ex, namesOfSelectedFeatures);
      }
    }

    return namesOfSelectedFeatures;
  }

  //////////////////
  // Constraints  //
  //////////////////

  addConstraint(constraint, negated) {
    return this.constraintSet.addConstraint(constraint, negated);
  }

  get constraints() {
    return this.constraintSet;
  }

  constraint(featureName) {
    if (!this.exists(featureName)) {
      throw `feature ${featureName} not found`;
    }

    return Constraint.create(featureName);
  }

  /////////////////////////////
  // Parsing and Loading XML //
  /////////////////////////////

  static fromXml(xml) {
    const doc = new xmldoc.XmlDocument(xml);
    const struct = doc.childNamed("struct");
    const constraints = doc.childNamed("constraints");

    if (struct == null) {
      throw "Error parsing xml";
    }

    let fm = new FeatureModel(struct.firstChild.attr.name);
    if (Array.isArray(struct.firstChild.children)) {
      // We create the features
      struct.firstChild.children.forEach(function (f) {
        Feature.fromXml(f, fm, struct.firstChild.name);
      });
    }

    if (constraints != null) {
      fm.constraintSet.fromXml(constraints);
    }

    return fm;
  }

  toXml() {
    const xmlWriter = new XMLWriter();
    let feature;
    let struct;
    let constraints;

    xmlWriter.startDocument("1.0", "UTF-8");

    feature = xmlWriter.startElement("featureModel");
    struct = feature.startElement("struct");
    super.toXml(struct);
    struct.endElement();

    constraints = feature.startElement("constraints");
    this.constraintSet.toXml(constraints);
    constraints.endElement();

    feature.endElement();

    return xmlWriter.toString();
  }

  //////////////////////////////
  // Parsing and Loading JSON //
  //////////////////////////////

  static fromJson(json) {
    const fm = new FeatureModel(json.featureModel.struct.name);

    if (Array.isArray(json.featureModel.struct.features)) {
      json.featureModel.struct.features.forEach(function (v) {
        Feature.fromJson(v, fm, json.featureModel.struct.type);
      });
    }

    if (Array.isArray(json.featureModel.constraints)) {
      fm.constraintSet.fromJson(json.featureModel.constraints);
    }

    return fm;
  }

  toJson() {
    const json = {
      featureModel: {
        struct: super.toJson(),
        constraints: [],
      },
    };

    json.featureModel.constraints = this.constraintSet.toJson();

    return json;
  }

  /////////////////////////////
  // Parsing and Loading UVL //
  /////////////////////////////

  static fromUVL(uvlfile, components) {
    const featureModelUVL = new UVLFeatureModel(uvlfile, components);
    return featureModelUVL.getUVLFeatureModel();
  }

  toUVL() {
    return UVLFeatureModel.toUVL(this);
  }

  /////////////////////
  // Private Methods //
  /////////////////////

  _getFeaturesFromNames(featureNames = []) {
    return featureNames.map((f) => this.get(f));
  }

  _completeFeatureSelectionWithoutConstraints(selectedFeatures) {
    const featureSet = new Set(this._getFeaturesFromNames(selectedFeatures));
    let auxLenght = -1;

    while (auxLenght != featureSet.length) {
      auxLenght = featureSet.length;

      featureSet.forEach((f) => {
        if (f.parent != null) {
          featureSet.add(f.parent);
        }
        f.features
          .filter((child) => child.mandatory)
          .forEach((child) => featureSet.add(child));
      });
    }

    return [...featureSet].map((f) => f.name);
  }

  _validateAltFeaturesFromSelection(selectedFeatures) {
    const features = this._getFeaturesFromNames(selectedFeatures);

    // cheking if two alternative features has been selected at the same time
    features
      .filter((f1) => f1.parent && f1.parent.type === TYPE.ALT)
      .forEach((f1) => {
        if (
          features.filter((f2) => f1 != f2 && f1.parent == f2.parent).length > 0
        )
          throw {
            message:
              "selected more than one features in alternative " +
              "feature " +
              f1.parent.name,
            featureName: f1.name,
            featureType: f1.parent.type,
            errorType: "TOO_MANY_CHILDS",
          };
      });

    // checking if mandatory alt/or feature has no child selected
    features
      .filter((f1) => f1.mandatory || selectedFeatures.indexOf(f1.name) != -1)
      .filter((f1) => f1.type === TYPE.ALT || f1.type === TYPE.OR)
      .forEach((f1) => {
        if (features.filter((f2) => f2.parent === f1).length < 1)
          throw {
            message:
              "missing child feature selected for mandatory " +
              f1.type +
              " feature " +
              f1.name,
            featureName: f1.name,
            featureType: f1.type,
            errorType: "MISSING_CHILD",
          };
      });
  }
}
