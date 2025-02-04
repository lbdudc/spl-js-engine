import assert from "assert";
import { pd } from "pretty-data";
import { FeatureModel, readJsonFromFile, readFile } from "../src/index.js";
import { getTestPath as p, getTestFileContent as f } from "./test-utils.js";

suite("#FeatureModel Manual Creation");

test(
  "Should create a new feature model and throw exception for not adding " +
    "features since the root of a feature model is abstract",
  () => {
    const fm = new FeatureModel("MyCalculator");

    assert.strictEqual(fm.toString(), "MyCalculator");
    assert.throws(() => {
      fm.validateFeatureModel();
    }, /abstract feature cannot be leaf/);
  }
);

test(
  "Should create a new feature model with 2 mandatory features and 1 non " +
    "mandatory abstract feature",
  () => {
    const fm = new FeatureModel("FMName");

    fm.and([
      { name: "f1", mandatory: true },
      { name: "f2", mandatory: true },
      { name: "f3" },
    ]);

    assert.strictEqual(fm.toString(), "FMName: { +f1 AND +f2 AND f3 }");
    assert.doesNotThrow(() => {
      fm.validateFeatureModel();
    });
  }
);

test(
  "Should throw and exception for getting an feature that does not " + "exist",
  () => {
    const fm = new FeatureModel("fm");

    fm.and("f1").and("f2");

    assert.strictEqual(fm.toString(), "fm: { f1: { f2 } }");
    assert.throws(() => {
      fm.get("f3");
    }, /feature f3 not found/);
  }
);

test(
  "Should create a new feature model and then add a new feature by " +
    "recovering a previous one",
  () => {
    const fm = new FeatureModel("fm");

    fm.and("f1");
    fm.get("f1").and("f2");

    assert.strictEqual(fm.toString(), "fm: { f1: { f2 } }");
  }
);

test(
  "Should throw an error for a mandatory feature under an OR " + "feature",
  () => {
    const fm = new FeatureModel("MyCalculator");
    const operations = fm.and({ name: "Operations", abstract: true });

    // Since the changes to make this library more "FeatureIDE XML format"
    // friendly, the optional and alternatives features cannot be set to
    // mandatory even if indicated.
    operations.or({ name: "Add", mandatory: true });
    operations.or("Subtract");
    operations.or("Divide");
    operations.or("Multiply");

    // Trick to provoke the error
    fm.get("Add").mandatory = true;

    assert.throws(() => {
      fm.validateFeatureModel();
    }, /features with OR and ALT parent cannot be mandatory/);
  }
);

test(
  "Should create a new feature model with a alt features and 2 " +
    "alternatives",
  () => {
    const fm = new FeatureModel("FMName");

    fm.alt("f1");
    fm.alt("f2");

    assert.strictEqual(fm.toString(), "FMName: { f1 ALT f2 }");
    assert.doesNotThrow(() => {
      fm.validateFeatureModel();
    });
  }
);

test("Should throw an exception for having an abstract node as leaf", () => {
  const fm = new FeatureModel("FMName");

  fm.alt(["f1", { name: "f2", abstract: true }]);

  assert.strictEqual(fm.toString(), "FMName: { f1 ALT _f2 }");

  assert.throws(() => {
    fm.validateFeatureModel();
  }, /abstract feature cannot be leaf/);
});

test("Should throw an exception by having an OR node without children", () => {
  const fm = new FeatureModel("FMName");

  fm.and("f1");
  // trick to provoke fail
  fm.features[0].type = "ALT";

  assert.throws(() => {
    fm.validateFeatureModel();
  }, /OR and ALT features must have children/);
});

test("MyCalculator MD test", () => {
  const fm = _createMyCalculatorFM();

  assert.strictEqual(
    fm.toString(),
    "MyCalculator: { " +
      "+Base: { _Operations: { " +
      "Add OR Subtract OR Multiply OR Divide } " +
      "AND _Capabilities: { Decimal } } }"
  );

  assert.doesNotThrow(() => {
    fm.validateFeatureModel();
  });
});

test(
  "Should throw an exception for adding a feature with a repeated " + "name",
  () => {
    const fm = new FeatureModel("FMName");
    fm.and("f1").alt("f2");

    assert.throws(() => {
      fm.get("f2").or("f1");
    }, /feature f1 already exists/);
  }
);

suite("#FeatureModel Basic Parsing (no constraints):");

test("testing json generation without constraints", () => {
  const fm = _createMyCalculatorFM();
  const expected = readJsonFromFile(p("feature-model/model.json"));

  assert.deepEqual(fm.toJson(), expected);
});

test("testing json parsing without constraints", () => {
  const fm = FeatureModel.fromJson(
    readJsonFromFile(p("feature-model/model.json"))
  );
  const expected = _createMyCalculatorFM();

  assert.deepEqual(fm.toJson(), expected.toJson());
});

test("testing xml generation without constraints", () => {
  const fm = _createMyCalculatorFM();
  const expected = f("feature-model/model.xml");

  // Using pretty-data to sort the xml in order to compare
  assert.strictEqual(pd.xml(expected), pd.xml(fm.toXml()));
});

test("testing xml parsing without constraints", () => {
  const fm = FeatureModel.fromXml(f("feature-model/model.xml"));
  const expected = _createMyCalculatorFM();

  assert.deepEqual(fm.toJson(), expected.toJson());
});

test("testing strict FeatureIDE xml parsing without constraints", () => {
  const fm = FeatureModel.fromXml(
    f("feature-model/model-strict-featureIDE.xml")
  );
  const expected = _createMyCalculatorFM();

  assert.deepEqual(fm.toJson(), expected.toJson());
});

suite("#FeatureModel Config Validation:");

test("Should get the proper complete list of features", () => {
  const fm = _createMyCalculatorFM();
  const featuresSelected = ["Add", "Subtract", "Decimal"];
  const expected = [
    "MyCalculator",
    "Base",
    "Operations",
    "Add",
    "Subtract",
    "Capabilities",
    "Decimal",
  ];
  const allSelected = fm.completeFeatureSelection(featuresSelected);

  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should get the minium set even without choosing any feature", () => {
  const fm = _createMyCalculatorFM();
  const expected = ["MyCalculator", "Base"];
  const allSelected = fm.completeFeatureSelection();

  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should get the proper complete list of features (lowercase)", () => {
  const fm = _createMyCalculatorFM();
  const featuresSelected = ["add", "subtract", "decimal"];
  const expected = [
    "MyCalculator",
    "Base",
    "Operations",
    "Add",
    "Subtract",
    "Capabilities",
    "Decimal",
  ];
  const allSelected = fm.completeFeatureSelection(featuresSelected);

  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should pass config validation", () => {
  const fm = new FeatureModel("FM");
  const featuresSelected = ["f1", "f2"];
  const expected = ["FM", "f1", "f2"];
  let allSelected;

  fm.and(["f1", "f2", "f3"]);

  assert.doesNotThrow(() => {
    allSelected = fm.completeFeatureSelection(featuresSelected);
  });
  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should pass config validation with all the selected features", () => {
  const fm = new FeatureModel("FM");
  const featuresSelected = ["f1", "f2"];

  fm.and(["f1", "f2", "f3"]);

  assert.doesNotThrow(() => {
    fm.completeFeatureSelection(featuresSelected);
  });
});

test("Should throw exception of feature not found", () => {
  const fm = new FeatureModel("FM");

  fm.and(["f1", "f2", "f3"]);

  assert.throws(() => {
    fm.completeFeatureSelection(["f4"]);
  }, /feature f4 not found/);
});

test("Should throw exception of features is alternative", () => {
  const fm = new FeatureModel("FM");

  fm.alt(["f1", "f2", "f3"]);

  assert.throws(() => {
    fm.completeFeatureSelection(["f1", "f2"]);
  }, /selected more than one features in alternative feature FM/);
});

test("Should throw exception of features is alternative (2)", () => {
  const fm = new FeatureModel("FM");

  const f1 = fm.and("f1");
  fm.and("f2");

  const f3 = f1.or("f3");
  f1.or("f4");
  f3.alt("f5");
  f3.alt("f6");

  assert.throws(() => {
    fm.completeFeatureSelection(["f5", "f6"]);
  }, /selected more than one features in alternative feature f3/);
});

test("Should include the mandatory features of included ones", () => {
  const fm = new FeatureModel("FM");
  const featuresSelected = ["f1"];
  const expected = ["FM", "f1", "f2"];
  let allSelected;

  fm.and("f1").and({ name: "f2", mandatory: true });

  assert.strictEqual(fm.toString(), "FM: { f1: { +f2 } }");
  assert.doesNotThrow(() => {
    allSelected = fm.completeFeatureSelection(featuresSelected);
  });
  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should include the mandatory features of included ones", () => {
  const fm = new FeatureModel("FM");
  const f1 = fm.and("f1");
  const featuresSelected = ["f2"];
  const expected = ["FM", "f1", "f2", "f3"];
  let allSelected;

  f1.and("f2");
  f1.and({ name: "f3", mandatory: true });

  assert.strictEqual(fm.toString(), "FM: { f1: { f2 AND +f3 } }");
  assert.doesNotThrow(() => {
    allSelected = fm.completeFeatureSelection(featuresSelected);
  });
  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should include the mandatory features of included ones [2]", () => {
  const fm = new FeatureModel("FM");
  const featuresSelected = ["f6"];
  const expected = ["FM", "f1", "f2", "f3", "f5", "f6", "f7"];
  let allSelected;

  fm.and("f1").and(["f2", { name: "f3", mandatory: true }]);
  fm.get("f2").alt(["f4", "f5"]);
  fm.get("f5").and(["f6", { name: "f7", mandatory: true }]);

  assert.strictEqual(
    fm.toString(),
    "FM: { f1: { f2: { f4 ALT f5: { f6 AND +f7 } } AND +f3 } }"
  );
  assert.doesNotThrow(() => {
    allSelected = fm.completeFeatureSelection(featuresSelected);
  });
  assert.deepEqual(allSelected.sort(), expected.sort());
});

test("Should throw an exception for alternative paths selected", () => {
  const fm = new FeatureModel("fm");
  const featuresSelected = ["f3", "f6"];

  fm.alt(["f1", "f2"]);
  fm.get("f1").and(["f3", { name: "f4", mandatory: true }]);
  fm.get("f2").and("f5").or(["f6", "f7"]);

  assert.throws(() => {
    fm.completeFeatureSelection(featuresSelected);
  }, /selected more than one features in alternative feature fm/);
});

test(
  "Should throw an exception for not alt option selected on mandatory " + "one",
  () => {
    const fm = new FeatureModel("fm");

    fm.and({ name: "fand", mandatory: true }).alt(["f1", "f2", "f3"]);

    assert.throws(() => {
      fm.completeFeatureSelection([]);
    }, /missing child feature selected for mandatory ALT feature fand/);
  }
);

test(
  "Should throw an exception for not or option selected on mandatory " + "one",
  () => {
    const fm = new FeatureModel("fm");

    fm.and(["featureA", { name: "featureB", mandatory: false }]);
    fm.get("featureB").or(["sonA", "sonB"]);

    assert.throws(() => {
      fm.completeFeatureSelection(["featureB"]);
    }, /missing child feature selected for mandatory OR feature featureB/);
  }
);

//Lista de Constraints de FeatureIDE:
//  * [Feature]
//  * Not
//  * And
//  * Or
//  * Implies
//  * Iff
//  * (
//  * )
suite("#FeatureModel: Contraints Definition:");

test("Should define a new constraint", () => {
  const fm = _createMyCalculatorFM();

  fm.addConstraint(fm.constraint("Add"));

  assert.strictEqual(fm.constraints.toString(), "[ Add ]");
});

test(
  "Should define a Feature constraint and return the set of minimum " +
    "features selected",
  () => {
    const fm = _createMyCalculatorFM();
    const expected = ["MyCalculator", "Base", "Operations", "Add"];

    fm.addConstraint(fm.constraint("Add"));

    assert.doesNotThrow(() => {
      assert.deepEqual(
        fm.completeFeatureSelection(["Add"]).sort(),
        expected.sort()
      );
    });
  }
);

test("Should get the features properly since the constraint is met", () => {
  const fm = _createMyCalculatorFM();
  const expected = ["MyCalculator", "Base", "Operations", "Add", "Subtract"];

  fm.addConstraint(fm.constraint("Add").and(fm.constraint("Subtract")));

  assert.deepEqual(
    fm.completeFeatureSelection(["Add", "Subtract"]).sort(),
    expected.sort()
  );
});

test("Should get the features properly since the constraint is met", () => {
  const fm = _createMyCalculatorFM();
  const expected = ["MyCalculator", "Base", "Operations", "Add", "Subtract"];
  let allSelected;

  fm.addConstraint(fm.constraint("Add").implies(fm.constraint("Subtract")));
  allSelected = fm.completeFeatureSelection(["Add", "Subtract"]);

  assert.deepEqual(allSelected.sort(), expected.sort());
});

test(
  "Should get the features properly since the first part of the " +
    "implication is not met",
  () => {
    const fm = _createMyCalculatorFM();

    fm.addConstraint(fm.constraint("Add").implies(fm.constraint("Subtract")));

    assert.doesNotThrow(() => {
      fm.completeFeatureSelection();
    });
  }
);

test("testing iff will pass", () => {
  const fm = _createMyCalculatorFM();

  fm.addConstraint(
    fm
      .constraint("Add")
      .implies(fm.constraint("Subtract"))
      .iff(fm.constraint("Decimal"))
  );
  assert.doesNotThrow(() => {
    fm.completeFeatureSelection(["Decimal"]);
  });
});

test("testing iff will pass [2]", () => {
  const fm = _createMyCalculatorFM();

  fm.addConstraint(
    fm
      .constraint("Add")
      .implies(fm.constraint("Subtract"))
      .iff(fm.constraint("Decimal"))
  );
  assert.doesNotThrow(() => {
    fm.completeFeatureSelection(["Add", "Subtract", "Decimal"]);
  });
});

test("testing or will throw exception", () => {
  const fm = _createMyCalculatorFM();

  fm.addConstraint(
    fm
      .constraint("Add")
      .or(fm.constraint("Subtract"))
      .or(fm.constraint("Multiply"))
      .or(fm.constraint("Divide"))
  );
  assert.throws(() => {
    fm.completeFeatureSelection();
  }, /Constraints \(\(\(Add OR Subtract\) OR Multiply\) OR Divide\) not met/);
});

test("testing or will pass", () => {
  const fm = _createMyCalculatorFM();

  fm.addConstraint(
    fm
      .constraint("Add")
      .or(fm.constraint("Subtract"))
      .or(fm.constraint("Multiply"))
      .or(fm.constraint("Divide"))
  );
  assert.doesNotThrow(() => {
    fm.completeFeatureSelection(["Multiply"]);
  });
});

suite("#FeatureModel Parsing Constraints:");

test("testing json generation with constraints", () => {
  const fm = _createMyCalculatorFMAndConstraints();
  const expected = readJsonFromFile(
    p("feature-model/model-with-constraints.json")
  );

  assert.deepEqual(fm.toJson(), expected);
});

test("testing json parsing with constraints", () => {
  const fm = FeatureModel.fromJson(
    readJsonFromFile(p("feature-model/model-with-constraints.json"))
  );
  const expected = _createMyCalculatorFMAndConstraints();

  assert.deepEqual(fm.toJson(), expected.toJson());
});

test("testing json parsing with feature constraints simplified", () => {
  const fm = FeatureModel.fromJson(
    readJsonFromFile(p("feature-model/model-with-constraints-2.json"))
  );
  const expected = _createMyCalculatorFMAndConstraints();

  assert.deepEqual(fm.toJson(), expected.toJson());
});

test("testing xml generation with constraints", () => {
  const fm = _createMyCalculatorFMAndConstraints();
  const expected = f("feature-model/model-with-constraints.xml");

  assert.deepEqual(pd.xml(expected), pd.xml(fm.toXml()));
});

test("testing xml parsing with constraints", () => {
  const fm = FeatureModel.fromXml(
    f("feature-model/model-with-constraints.xml")
  );
  const expected = _createMyCalculatorFMAndConstraints();

  assert.deepEqual(fm.toJson(), expected.toJson());
});

suite("#FeatureModel: constraint expansion");

test("implication expand", () => {
  const expected = ["fm", "featureA", "featureB"];

  const fm = new FeatureModel("fm");
  fm.and(["featureA", "featureB"]);
  fm.addConstraint(
    fm.constraint("featureA").implies(fm.constraint("featureB"))
  );

  assert.deepEqual(
    fm.completeFeatureSelection(["featureA"]).sort(),
    expected.sort()
  );
});

test(
  "Should not throw an exception for not adding the second feature of an " +
    "implication constraint since it is expanded",
  () => {
    const expected = ["MyCalculator", "Base", "Operations", "Add", "Subtract"];

    const fm = _createMyCalculatorFM();

    fm.addConstraint(fm.constraint("Add").implies(fm.constraint("Subtract")));

    assert.deepEqual(
      fm.completeFeatureSelection(["Add"]).sort(),
      expected.sort()
    );
  }
);

test("testing iff will not throw exception since it is expanded", () => {
  const expected = [
    "MyCalculator",
    "Base",
    "Operations",
    "Add",
    "Subtract",
    "Decimal",
    "Capabilities",
  ];

  const fm = _createMyCalculatorFM();

  fm.addConstraint(
    fm
      .constraint("Add")
      .implies(fm.constraint("Subtract"))
      .iff(fm.constraint("Decimal"))
  );

  assert.deepEqual(
    fm.completeFeatureSelection(["Add", "Decimal"]).sort(),
    expected.sort()
  );
});

test("iff expand", () => {
  const expected = ["fm", "featureA", "featureB"];

  const fm = new FeatureModel("fm");
  fm.and(["featureA", "featureB"]);
  fm.addConstraint(fm.constraint("featureA").iff(fm.constraint("featureB")));

  assert.deepEqual(
    fm.completeFeatureSelection(["featureA"]).sort(),
    expected.sort()
  );
  assert.deepEqual(
    fm.completeFeatureSelection(["featureB"]).sort(),
    expected.sort()
  );
});

test("testing iff will not throw exception since it is expanded [2]", () => {
  const expected = [
    "MyCalculator",
    "Base",
    "Operations",
    "Add",
    "Subtract",
    "Decimal",
    "Capabilities",
  ];
  const fm = _createMyCalculatorFM();

  fm.addConstraint(
    fm
      .constraint("Add")
      .implies(fm.constraint("Subtract"))
      .iff(fm.constraint("Decimal"))
  );

  assert.deepEqual(
    fm.completeFeatureSelection(["Add", "Subtract"]).sort(),
    expected.sort()
  );
});

test("And does not expand", () => {
  const expected = ["fm", "featureA", "featureB"];

  const fm = new FeatureModel("fm");
  fm.and(["featureA", "featureB"]);
  fm.addConstraint(fm.constraint("featureA").and(fm.constraint("featureB")));

  assert.throws(() => {
    assert.deepEqual(
      fm.completeFeatureSelection(["featureA"]).sort(),
      expected.sort()
    );
  });
  assert.throws(() => {
    assert.deepEqual(
      fm.completeFeatureSelection(["featureB"]).sort(),
      expected.sort()
    );
  });
});

test(
  "Should throw an exception for not adding the second feature of an " +
    "and constraint since it does not expand",
  () => {
    const fm = _createMyCalculatorFM();

    fm.addConstraint(fm.constraint("Add").and(fm.constraint("Subtract")));

    assert.throws(() => {
      fm.completeFeatureSelection(["Add"]);
    });
  }
);

suite("#FeatureModel Get Features:");

test("getting all features", () => {
  const fm = _createMyCalculatorFM();

  assert.deepEqual(fm.getFeatures(), {
    mandatory: true,
    name: "MyCalculator",
    type: "AND",
    features: [
      {
        mandatory: true,
        name: "Base",
        type: "AND",
        features: [
          {
            name: "Operations",
            type: "OR",
            features: [
              {
                name: "Add",
                type: "FEATURE",
              },
              {
                name: "Subtract",
                type: "FEATURE",
              },
              {
                name: "Multiply",
                type: "FEATURE",
              },
              {
                name: "Divide",
                type: "FEATURE",
              },
            ],
          },
          {
            name: "Capabilities",
            type: "OR",
            features: [
              {
                name: "Decimal",
                type: "FEATURE",
              },
            ],
          },
        ],
      },
    ],
  });
});

test("get feature model with hidden features", () => {
  const expected = {
    mandatory: true,
    name: "MyCalculator",
    type: "AND",
    features: [
      {
        mandatory: true,
        name: "Base",
        type: "AND",
        features: [
          {
            name: "Operations",
            type: "OR",
            features: [
              {
                name: "Add",
                hidden: true,
                type: "FEATURE",
              },
              {
                name: "Subtract",
                type: "FEATURE",
              },
              {
                name: "Multiply",
                type: "FEATURE",
              },
              {
                name: "Divide",
                type: "FEATURE",
              },
            ],
          },
          {
            name: "Capabilities",
            type: "OR",
            hidden: true,
            features: [
              {
                name: "Decimal",
                type: "FEATURE",
              },
            ],
          },
        ],
      },
    ],
  };

  let fm = new FeatureModel("MyCalculator");
  const base = fm.and({ name: "Base", mandatory: true });
  const operations = base.and({ name: "Operations", abstract: true });
  const capabilities = base.and({
    name: "Capabilities",
    abstract: true,
    hidden: true,
  });

  operations.or([
    { name: "Add", hidden: true },
    "Subtract",
    "Multiply",
    "Divide",
  ]);
  capabilities.or("Decimal");
  assert.deepEqual(fm.getFeatures(), expected);

  fm = FeatureModel.fromJson(
    readJsonFromFile(p("feature-model/model-with-hidden-features.json"))
  );
  assert.deepEqual(fm.getFeatures(), expected);

  fm = FeatureModel.fromXml(f("feature-model/model-with-hidden-features.xml"));
  assert.deepEqual(fm.getFeatures(), expected);
});

test("testing xml generating with xor", () => {
  const fm = new FeatureModel("fm");
  fm.xor({ name: "a1" });
  fm.xor({ name: "a2" });
  fm.get("a1").and("b");
  fm.get("b").and("c1");

  const expected = f("feature-model/model-with-alt.xml");
  // Using pretty-data to sort the xml in order to compare
  assert.strictEqual(pd.xml(expected), pd.xml(fm.toXml() + "\n"));
});

test("testing xml parsing for using old xor in xml instead of alt", () => {
  const fm = FeatureModel.fromXml(f("feature-model/model-with-xor.xml"));
  const expected = f("feature-model/model-with-alt.xml");
  // Using pretty-data to sort the xml in order to compare
  assert.strictEqual(pd.xml(expected), pd.xml(fm.toXml() + "\n"));
});

test("testing xml parsing for using old xor in json instead of alt", () => {
  const fm = FeatureModel.fromJson(
    readJsonFromFile(p("feature-model/model-with-xor.json"))
  );
  const expected = f("feature-model/model-with-alt.xml");
  // Using pretty-data to sort the xml in order to compare
  assert.strictEqual(pd.xml(expected), pd.xml(fm.toXml() + "\n"));
});

test("testing uvl generation without constraints", () => {
  const fm = new FeatureModel("FMName");
    fm.and([
      { name: "f1", mandatory: true },
      { name: "f2", mandatory: true },
      { name: "f3" },
    ]);
  const expected = readFile(p("feature-model/model.uvl"));
  assert.deepEqual(fm.toUVL(), expected);
});

test("testing uvl generation without constraints 2", () => {
  const fm = new FeatureModel("FMName");
    fm.or([
      { name: "f1" },
      { name: "f2" },
      { name: "f3" },
    ]);
  const f3 = fm.get("f3")
    f3.alt("f5");
    f3.alt("f6");
  const expected = readFile(p("feature-model/model2.uvl"));
  assert.deepEqual(fm.toUVL(), expected);
});

test("testing uvl generation with constraints", () => {
  const fm = new FeatureModel("FMName");
    fm.and([
      { name: "f1"},
      { name: "f2", mandatory: true },
      { name: "f3" },
      { name: "f4", mandatory: true },
      
    ]);
  fm.addConstraint(fm.constraint("f1").and(fm.constraint("f3")));
  const expected = readFile(p("feature-model/model3.uvl"));
  assert.deepEqual(fm.toUVL(), expected);
});

function _createMyCalculatorFM() {
  const fm = new FeatureModel("MyCalculator");
  const base = fm.and({ name: "Base", mandatory: true });
  const operations = base.and({ name: "Operations", abstract: true });
  const capabilities = base.and({ name: "Capabilities", abstract: true });

  operations.or(["Add", "Subtract", "Multiply", "Divide"]);
  capabilities.or("Decimal");

  return fm;
}

function _createMyCalculatorFMAndConstraints() {
  const fm = _createMyCalculatorFM();
  const add = fm.constraint("Add");
  const multiply = fm.constraint("Multiply");
  const capabilities = fm.constraint("Capabilities");
  const base = fm.constraint("Base");
  const decimal = fm.constraint("Decimal");
  const divide = fm.constraint("Divide");

  fm.addConstraint(add.or(multiply));
  fm.addConstraint(add.negated());
  fm.addConstraint(add.negated().or(capabilities));
  fm.addConstraint(capabilities.and(add));
  fm.addConstraint(multiply.implies(base));
  fm.addConstraint(capabilities.iff(decimal));
  fm.addConstraint(decimal.implies(base).implies(divide));

  return fm;
}
