define([
    'hbs/handlebars'
], function(Handlebars) {

    'use strict';

    function outerHelper(key) {
        if (typeof key !== 'undefined') {
            return ')' + key + '(';
        }
        return ')missing(';
    }

    Handlebars.registerHelper('outer-helper', outerHelper);

    return outerHelper;
});