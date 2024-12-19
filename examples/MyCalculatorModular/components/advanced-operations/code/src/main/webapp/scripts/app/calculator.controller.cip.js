/*→ codeInsertionPoint4 ←*/
else if (op.value == 'SQUARE_ROOT') {
    operation = op;
    calculate();
}
/*→ codeInsertionPoint4 ←*/

/*→ codeInsertionPoint3 ←*/
if (operation.value !== null && operation.value == 'SQUARE_ROOT') {
    Calculator.calculate(values.first.value, '', operation.value).success(function (
        result) {
        values.first.value = result.value;
        _resetOperation();
        values.second.value = null;
        if (typeof cb === 'function') {
            cb();
        }
    });
    justCalculated = true;
}
/*→ codeInsertionPoint3 ←*/
