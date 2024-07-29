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
