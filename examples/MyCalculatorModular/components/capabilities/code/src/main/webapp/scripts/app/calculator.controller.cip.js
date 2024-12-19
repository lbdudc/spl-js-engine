/*→ codeInsertionPoint1 ←*/
  /*% if (feature.decimal) { %*/
    decimal: decimal,
  /*% } %*/
/*→ codeInsertionPoint1 ←*/

/*→ codeInsertionPoint2 ←*/
  /*% if (feature.decimal) { %*/
  function decimal() {
      values[_currentNumber()].nextFloat = true;
  }/*% } %*/
/*→ codeInsertionPoint2 ←*/
