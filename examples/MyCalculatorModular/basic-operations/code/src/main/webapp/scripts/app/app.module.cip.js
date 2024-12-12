(function (angular) {
    'use strict';

    angular.module('app', []).run(appRun).config(appConfig)
        .constant('OP', {
            /*→ codeInsertionPoint1 ←*/
            /*% if (feature.add) { %*/
            'ADD': {
                value: 'ADD',
                label: '+'
            },/*% } if (feature.subtract) { %*/
            'SUBTRACT': {
                value: 'SUBTRACT',
                label: '-'
            },/*% } if (feature.multiply) { %*/
            'MULTIPLY': {
                value: 'MULTIPLY',
                label: 'x'
            },/*% } %*/
            /*→ codeInsertionPoint1 ←*/
        });

    /* @ngInject */
    function appRun($rootScope, OP) {
        angular.isUndefinedOrNull = function (val) {
            return angular.isUndefined(val) || val === null;
        };
        $rootScope.OP = OP;
    }

    /* @ngInject */
    function appConfig() {}

})(window.angular);
