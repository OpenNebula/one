define(function(require) {
  var Handlebars = require('hbs/handlebars');
  var Humanize = require('utils/humanize');
  
  /**
   * Returns a human readable size in Kilo, Mega, Giga or Tera bytes
   * @param  {string} unit    one of MB, KB, B
   * @param  {integer} value  value
   * @param  {object} options
   * @return {string}         human readable size
   */
  var humanizeSize = function(unit, value, options) {
    switch(unit.toUpperCase()){
      case 'B':
        return Humanize.sizeFromB(value);
      case 'K':
      case 'KB':
        return Humanize.sizeFromKB(value);
      case 'M':
      case 'MB':
        return Humanize.sizeFromMB(value);
      default:
        return value;
    }
  };

  Handlebars.registerHelper('humanizeSize', humanizeSize);

  return humanizeSize;
});