/* -------------------------------------------------------------------------- */
/* Copyright 2002-2025, OpenNebula Project, OpenNebula Systems                */
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

    var id = 0;

    var advancedImportationSection = function(icon, title, options) {
      id += 1;

      var html_id = "advanced_section_" + id;

      return new Handlebars.SafeString(
        '<div class="accordion_advanced">'+
          '<a href="#'+html_id+'" class="accordion_advanced_toggle importation">'+
              '<i class="fas fa-fw fa-chevron-down"/>'+
              '<i class="fas fa-fw fa-chevron-up"/>'+
              '&nbsp;'+ icon + '&nbsp;' + title+
          '</a>'+
          '<div id="'+html_id+'" class="content" hidden>'+
            options.fn(this) +
          '</div>'+
        '</div>'
      );
    };

    Handlebars.registerHelper('advancedImportationSection', advancedImportationSection);

    return advancedImportationSection;
  });
