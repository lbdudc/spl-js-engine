import EvaluationHelper from "./evaluation-helper.js";
import Constraint from "./constraint.js";
import FeatureSelectionError from "../feature-selection-error.js";

export default class constraintSet {
  constructor() {
    this.counter = 0;
    this.constraints = [];
  }

  addConstraint(constraint) {
    constraint.id = this.counter++;
    this.constraints[constraint.id] = constraint;
    return constraint;
  }

  hasConstraints() {
    return this.constraints.length > 0;
  }

  checkConstraints(namesOfSelectedFeatures) {
    const helper = new EvaluationHelper(namesOfSelectedFeatures);

    const constraintsNotMet = this.constraints
      .filter((c) => !c.evaluate(helper))
      .join(", ");

    if (constraintsNotMet) {
      throw new FeatureSelectionError(
        `Constraints ${constraintsNotMet} not met`
      );
    }

    return helper.added;
  }

  toString() {
    return `[ ${this.constraints.join(", ")} ]`;
  }

  //////////////////////////////
  // Parsing and Loading JSON //
  //////////////////////////////

  toJson() {
    return this.constraints.map((c) => c.toJson());
  }

  fromJson(json) {
    json.forEach((c) => this.addConstraint(Constraint.fromJson(c)));
  }

  /////////////////////////////
  // Parsing and Loading XML //
  /////////////////////////////

  toXml(parentNode) {
    this.constraints.forEach((c) => {
      const rule = parentNode.startElement("rule");
      c.toXml(rule);
      rule.endElement();
    });
  }

  fromXml(xml) {
    xml.eachChild((c) => this.addConstraint(Constraint.fromXml(c.firstChild)));
  }

  /////////////////////////////
  // Parsing and Loading UVL //
  /////////////////////////////

  fromUVL(uvl) {
    this.addConstraint(Constraint.fromXml(uvl));
  }
}
