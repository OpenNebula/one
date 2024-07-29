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

  var ImageCommonDataTable = require('./datatable-common');

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var DashboardUtils = require('utils/dashboard');
  var OpenNebulaImage = require('opennebula/image');

  /*
    CONSTANTS
   */

  var RESOURCE = "Image"
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "uname_index": 3,
      "select_resource": Locale.tr("Please select an image from the list"),
      "you_selected": Locale.tr("You selected the following image:"),
      "select_resource_multiple": Locale.tr("Please select one or more images from the list"),
      "you_selected_multiple": Locale.tr("You selected the following images:")
    };

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

    if (element.TYPE == OpenNebulaImage.TYPES.KERNEL ||
        element.TYPE == OpenNebulaImage.TYPES.RAMDISK ||
        element.TYPE == OpenNebulaImage.TYPES.CONTEXT ||
        element.TYPE == OpenNebulaImage.TYPES.BACKUP) {
      return false;
    }

    this.sizeImages = this.sizeImages + parseInt(element.SIZE);
    this.totalImages++;

    return this.elementArrayCommon(element_json);
  }

  function _preUpdateView() {
    this.totalImages = 0;
    this.sizeImages = 0;
  }

  function _postUpdateView() {
    var size = Humanize.sizeFromMBArray(this.sizeImages);

    $(".total_images").removeClass("fadeinout");
    DashboardUtils.counterAnimation(".total_images", this.totalImages);

    $(".size_images").removeClass("fadeinout");
    DashboardUtils.counterAnimationDecimal(".size_images", size[0], size[1]);
  }
});
