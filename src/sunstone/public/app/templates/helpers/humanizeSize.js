/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

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
    if (value == undefined || value == ""){
      return "-";
    }

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
