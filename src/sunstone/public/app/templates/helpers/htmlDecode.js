define(function(require) {
  /**
   * Decodes an escaped html string back to html. For example,
   * "&lt;p&gt;This is a test&lt;/p&gt;" -->
   * "<p>This is a test</p>"
   */

  var Handlebars = require('hbs/handlebars');
  var TemplateUtils = require('utils/template-utils');

  var htmlDecode = function(value, options) {
    return TemplateUtils.htmlDecode(value);
  };

  Handlebars.registerHelper('htmlDecode', htmlDecode);

  return htmlDecode;
});