
/*→ codeInsertionPoint1 ←*/
  /*% if (feature.add) { %*/
  case ADD:
    return add(first, second);/*% } if (feature.multiply) { %*/
  case MULTIPLY:
    return multiply(first, second);/*% } if (feature.subtract) { %*/
  case SUBTRACT:
    return subtract(first, second);/*% } %*/
/*→ codeInsertionPoint1 ←*/

/*→ codeInsertionPoint2 ←*/
  /*% if (feature.add) { %*/
  private float add(float first, float second) {

    return first + second;
  }/*% } if (feature.subtract) { %*/

  private float subtract(float first, float second) {

    return first - second;
  }/*% } if (feature.multiply) { %*/

  private float multiply(float first, float second) {

    return first * second;
  }/*% } %*/
/*→ codeInsertionPoint2 ←*/
