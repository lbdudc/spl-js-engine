/*→ codeInsertionPoint1 ←*/
  /*% if (feature.divide) { %*/
  case DIVIDE:
    return divide(first, second);
  /*% } %*/
  /*% if (feature.power) { %*/
  case POWER:
    return power(first, second);
  /*% } %*/
  /*% if (feature.square_root) { %*/
  case SQUARE_ROOT:
    return square_root(first);
  /*% } %*/
/*→ codeInsertionPoint1 ←*/

/*→ codeInsertionPoint2 ←*/
  /*% if (feature.divide) { %*/
	private float divide(float first, float second) {
		return first / second;
	}/*% } %*/
	/*% if (feature.power) { %*/
	private float power(float first, float second) {
		return (float) Math.pow(first, second);
	}/*% } %*/
	/*% if (feature.square_root) { %*/
	private float square_root(float first) {
		return (float) Math.sqrt(first);
	}/*% } %*/
/*→ codeInsertionPoint2 ←*/
