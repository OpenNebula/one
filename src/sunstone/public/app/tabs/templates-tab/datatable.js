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
  /*
    DEPENDENCIES
   */

  var CommonDataTable = require('./datatable-common');

  /*
    CONSTANTS
   */

  var RESOURCE = "Template";
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    CommonDataTable.call(this, RESOURCE, TAB_NAME, dataTableId, conf);
    this.totalTemplates = 0;
  };

  Table.prototype = Object.create(CommonDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json[this.xmlRoot];

    if (element.TEMPLATE.VROUTER != undefined &&
        element.TEMPLATE.VROUTER.toUpperCase() == "YES"){

      return false;
    }

    this.totalTemplates++;

    return this.elementArrayCommon(element_json);
  }

  function _preUpdateView() {
    this.totalTemplates = 0;
  }

  function _postUpdateView() {
    $(".total_templates").text(this.totalTemplates);
  }
});
