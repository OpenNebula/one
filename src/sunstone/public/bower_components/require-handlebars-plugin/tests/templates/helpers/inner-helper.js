define([
    'hbs/handlebars'
], function(Handlebars) {

    'use strict';

    function innerHelper(key) {
        if (typeof key !== 'undefined') {
            return '(' + key + ')';
        }
        return '(missing)';
    }

    Handlebars.registerHelper('inner-helper', innerHelper);

    return innerHelper;
});