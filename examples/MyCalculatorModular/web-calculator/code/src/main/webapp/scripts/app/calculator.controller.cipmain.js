(function (angular) {
    'use strict';

    angular.module('app')
        .controller('CalculatorController', CalculatorController);

    function CalculatorController(Calculator) {
        var vm = this,
            values,
            operation,
            justCalculated = false;
        clear();

        angular.extend(vm, {
            number: number,
            /*→ codeInsertionPoint1 ←*/
            setOperation: setOperation,
            clear: clear,
            calculate: calculate,
            getDisplay: getDisplay
        });

        function number(numberAsString) {
            if (justCalculated && operation.value === null) {
                console.log('clearing');
                clear();
            }
            justCalculated = false;
            values[_currentNumber()].value = _addNumber(values[_currentNumber()], numberAsString);
            values[_currentNumber()].nextFloat = false;
        }

        /*→ codeInsertionPoint2 ←*/

        function setOperation(op) {
            if (operation.value !== null && values.second.value !== null) {
                calculate(function () {
                    operation = op;
                });
            } else {
                operation = op;
            }
        }

        function clear() {
            _resetValues();
            _resetOperation();
        }

        function calculate(cb) {
            if (operation.value !== null && values.second.value !== null) {
                console.log(values.second);
                Calculator.calculate(values.first.value, values.second.value, operation.value).success(function (
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
        }

        function getDisplay() {
            return values.first.value + operation.label + (values.second.value === null ? '' : values.second.value);
        }

        function _resetOperation() {
            operation = {
                value: null,
                label: null
            };
        }

        function _resetValues() {
            values = {
                first: {
                    value: 0,
                    nextFloat: false
                },
                second: {
                    value: null,
                    nextFloat: false
                }
            };
        }

        function _addNumber(v, number) {
            if (v.value === null) {
                v.value = '';
            }
            return parseFloat(v.value + (v.nextFloat ? '.' : '') + number);
        }

        function _currentNumber() {
            if (operation.value === null) {
                return 'first';
            } else {
                return 'second';
            }
        }
    }
})(window.angular);
