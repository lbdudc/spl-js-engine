(function (angular) {
    'use strict';

    angular.module('app')
        .factory('Calculator', Calculator);

    function Calculator($http) {
        return {
            calculate: calculate
        };

        function calculate(first, second, operation) {
            return $http.post('api/calculator', {
                first: first,
                second: second,
                operation: operation
            }, {
            });
        }
    }

})(window.angular);