(function (angular) {
    'use strict';

    angular.module('app', []).run(appRun).config(appConfig)
        .constant('OP', {
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
