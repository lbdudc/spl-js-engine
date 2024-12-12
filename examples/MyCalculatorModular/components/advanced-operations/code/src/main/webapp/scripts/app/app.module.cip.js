(function (angular) {
    'use strict';

    angular.module('app', []).run(appRun).config(appConfig)
        .constant('OP', {
            /*→ codeInsertionPoint1 ←*/
            /*% if (feature.divide) { %*/
            'DIVIDE': {
                value: 'DIVIDE',
                label: '/'
            },/*% } %*/
            /*% if (feature.power) { %*/
            'POWER': {
                value: 'POWER',
                label: '^'
            },/*% } %*/
            /*% if (feature.square_root) { %*/
            'SQUARE_ROOT': {
                value: 'SQUARE_ROOT',
                label: 'R'
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
