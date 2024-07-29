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

  var ImageCommonDataTable = require("tabs/images-tab/datatable-common");

  var Locale = require("utils/locale");
  var Humanize = require("utils/humanize");
  var OpenNebulaImage = require("opennebula/image");

  /*
    CONSTANTS
   */

  var RESOURCE = "File";
  var TAB_NAME = require("./tabId");

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.selectOptions = {
      "id_index": 1,
      "name_index": 4,
      "uname_index": 2,
      "select_resource": Locale.tr("Please select a file from the list"),
      "you_selected": Locale.tr("You selected the following file:"),
      "select_resource_multiple": Locale.tr("Please select one or more files from the list"),
      "you_selected_multiple": Locale.tr("You selected the following files:")
    };

    this.totalFiles = 0;
    ImageCommonDataTable.call(this, RESOURCE, TAB_NAME, dataTableId, conf);
  };

  Table.prototype = Object.create(ImageCommonDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
    var element = element_json.IMAGE;

    if (element.TYPE == OpenNebulaImage.TYPES.OS ||
        element.TYPE == OpenNebulaImage.TYPES.CDROM ||
        element.TYPE == OpenNebulaImage.TYPES.DATABLOCK ||
        element.TYPE == OpenNebulaImage.TYPES.BACKUP) {
      return false;
    }

    this.totalFiles++;
    return this.elementArrayCommon(element_json);
  }

  function _preUpdateView() {
    this.totalFiles = 0;
  }

  function _postUpdateView() {
    $(".total_files").text(this.totalFiles);
  }
});