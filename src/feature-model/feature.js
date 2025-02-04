import TYPE from "./feature-type.js";

export default class Feature {
  constructor(
    name,
    { mandatory = false, abstract = false, hidden = false },
    parent = null
  ) {
    this.name = name;
    this.mandatory = mandatory;
    this.abstract = abstract;
    this.hidden = hidden;
    this.parent = parent;

    this.features = [];
    this.type = TYPE.FEATURE;

    const featureModel = this.getFeatureModel();
    if (featureModel !== this) {
      if (featureModel.exists(name)) {
        throw `feature ${name} already exists`;
      }
      featureModel.addFeatureToFeatureList(name);
    }

    if (
      mandatory &&
      this.parent &&
      (this.parent.type === TYPE.ALT || this.parent.type === TYPE.OR)
    ) {
      // If the parent is an OR or ALT, this feature cannot be mandatory.
      // At first, this was not taken into account, but FeatureIDE XML
      // structure for feature models sets the optional and alternative
      // features as mandatory.
      // So, to prevent bigger issues, we check instead of just setting
      // the mandatory property.
      this.mandatory = false;
    }
  }

  getFeatureModel() {
    if (!this.parent) {
      return this;
    }
    return this.parent.getFeatureModel();
  }

  /////////////////////
  // Adding Features //
  /////////////////////
  and(features) {
    this.type = TYPE.AND;
    return this._add(features);
  }

  or(features) {
    this.type = TYPE.OR;
    return this._add(features);
  }

  alt(features) {
    this.type = TYPE.ALT;
    return this._add(features);
  }

  // xor is just another name for alt
  xor(features) {
    return this.alt(features);
  }

  get(featureName) {
    if (_compareString(this.name, featureName)) {
      return this;
    }

    return this.features
      .map((f) => f.get(featureName))
      .filter((f) => f)
      .pop();
  }

  ///////////////////////
  // Getting Features  //
  ///////////////////////

  getFeatures() {
    const ret = {
      name: this.name,
      type: this.type,
    };

    if (this.hidden) {
      ret.hidden = true;
    }

    if (this.mandatory) {
      ret.mandatory = true;
    }

    if (this.features.length > 0) {
      ret.features = this.features.map((el) => el.getFeatures());
    }

    return ret;
  }

  ///////////////////////////
  // String Representation //
  ///////////////////////////
  toString() {
    let str =
      (this.abstract ? "_" : "") + (this.mandatory ? "+" : "") + this.name;

    if (this.features.length > 0) {
      str +=
        ": { " +
        this.features.map((f) => f.toString()).join(` ${this.type} `) +
        " }";
    }

    return str;
  }

  ////////////////
  // Validation //
  ////////////////

  validateFeature() {
    const hasChildren = this.features.length !== 0;

    if (!hasChildren) {
      // Abstract feature cannot be leaf
      if (this.abstract) {
        throw "abstract feature cannot be leaf";
      }
    } else {
      // Validate all its children features
      this.features.forEach((f) => {
        f.validateFeature();
      });
    }

    if (this.type === TYPE.OR || this.type === TYPE.ALT) {
      if (!hasChildren) {
        throw "OR and ALT features must have children";
      } else {
        this.features.forEach(function (f) {
          if (f.mandatory) {
            throw "features with OR and ALT parent cannot be " + "mandatory";
          }
        });
      }
    }
  }

  /////////////////////////////
  // Parsing and Loading XML //
  /////////////////////////////

  static fromXml(xml, parent, type) {
    // parent[type] is parent.{and, or, alt},
    // so we are creating a new child feature
    const newFeature = parent[type](xml.attr);

    // For each child feature of the new feature, we repeat the process
    if (Array.isArray(xml.children)) {
      xml.children.forEach(function (f) {
        Feature.fromXml(f, newFeature, xml.name);
      });
    }

    return newFeature;
  }

  toXml(parentNode) {
    const type = this.type.toLowerCase();
    const feature = parentNode.startElement(type);

    feature.writeAttribute("name", this.name);
    if (this.mandatory) {
      feature.writeAttribute("mandatory", "true");
    }
    if (this.abstract) {
      feature.writeAttribute("abstract", "true");
    }

    if (Array.isArray(this.features)) {
      this.features.forEach(function (f) {
        f.toXml(feature);
      });
    }

    feature.endElement();
  }

  //////////////////////////////
  // Parsing and Loading JSON //
  //////////////////////////////

  static fromJson(json, parent, type) {
    // parent[type] is parent.{and, or, alt},
    // so we are creating a new child feature
    const newFeature = parent[type](json);

    // For each child feature of the new feature, we repeat the process
    if (Array.isArray(json.features)) {
      json.features.forEach(function (v) {
        Feature.fromJson(v, newFeature, json.type);
      });
    }

    return newFeature;
  }

  toJson() {
    const json = {
      name: this.name,
    };

    if (this.mandatory) {
      json.mandatory = true;
    }

    if (this.abstract) {
      json.abstract = true;
    }

    if (this.type !== TYPE.FEATURE) {
      json.type = this.type.toLowerCase();
    }

    if (this.features.length > 0) {
      json.features = [];
      this.features.forEach(function (v) {
        json.features.push(v.toJson());
      });
    }

    return json;
  }

  /////////////////////////////
  // Parsing and Loading UVL //
  /////////////////////////////

  static fromUVL(uvl, parent, type) {
    // parent[type] is parent.{and, or, alt},
    // so we are creating a new child feature

    const newFeature = parent[type](uvl);

    if (Array.isArray(uvl.children)) {
      uvl.children.forEach(function (f) {
        Feature.fromUVL(f, newFeature, uvl.name);
      });
    }
    return newFeature;
  }

  /////////////////////
  // Private Methods //
  /////////////////////

  _add(features) {
    if (Array.isArray(features)) {
      // features is an array with many features
      features.forEach((f) => this._add(f));
      return;
    }

    let newNode = null;
    if (typeof features == "string") {
      // features is the name of a new feature
      newNode = new Feature(features, {}, this);
    } else {
      // features is the JSON of a new feature
      newNode = new Feature(features.name, features, this);
    }

    this.features.push(newNode);
    return newNode;
  }
}

function _compareString(s1, s2) {
  if (
    typeof s1 != "string" ||
    typeof s2 != "string" ||
    s1 == null ||
    s2 == null
  ) {
    throw "_compareString: parameter is undefined, null or non string";
  }
  return s1.toLowerCase() === s2.toLowerCase();
}
