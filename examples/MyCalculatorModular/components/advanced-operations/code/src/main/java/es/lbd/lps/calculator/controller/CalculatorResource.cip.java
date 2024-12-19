/*→ codeInsertionPoint1 ←*/
  /*% if (feature.divide) { %*/
  if (request.getOperation() == Operation.DIVIDE) {
    if (request.getSecond() == 0) {
      return new ResponseEntity<ResultJSON>(new ResultJSON(), HttpStatus.BAD_REQUEST);
    }
  }
  /*% } %*/
/*→ codeInsertionPoint1 ←*/
