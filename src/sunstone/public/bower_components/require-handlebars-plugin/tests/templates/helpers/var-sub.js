define([
    'hbs/handlebars'
], function(Handlebars) {

    'use strict';

    function varSub(key, options) {
        
        var value,
            keyName,
            prop;

        for (prop in options.hash) {
            if (options.hash.hasOwnProperty(prop)) {
                value = options.hash[prop];
                keyName = '{' + prop + '}';
                if (key.indexOf(keyName) !== -1) {
                    // Argument found in key
                    key = key.replace(keyName, value);
                }
            }
        }
        return key;

    }

    Handlebars.registerHelper('var-sub', varSub);

    return varSub;
});