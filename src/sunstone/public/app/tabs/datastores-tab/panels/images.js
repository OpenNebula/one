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

define(function(require){
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var OpenNebulaDatastore = require('opennebula/datastore');
  var ImagesTable = require('tabs/images-tab/datatable');
  var FilesTable = require('tabs/files-tab/datatable');
  var BackupsTable = require('tabs/backups-tab/datatable');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./images/panelId');
  var IMAGES_TABLE_ID = PANEL_ID + "ImagesTable"
  var RESOURCE = "Datastore"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Images");
    this.icon = "fa-upload";

    this.element = info[RESOURCE.toUpperCase()];

    if (this.element.TYPE == OpenNebulaDatastore.TYPES.SYSTEM_DS){
      throw "Images panel is not available for system DS";
    }

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var imgs = [];

    if (this.element.IMAGES.ID != undefined){
      imgs = this.element.IMAGES.ID;

      if (!Array.isArray(imgs)){
        imgs = [imgs];
      }
    }

    var opts = {
      info: true,
      select: true,
      selectOptions: {
        read_only: true,
        fixed_ids: imgs
      }
    };

    if (this.element.TYPE == OpenNebulaDatastore.TYPES.FILE_DS){
      this.imagesDataTable = new FilesTable(IMAGES_TABLE_ID, opts);
    } else if (this.element.TYPE == OpenNebulaDatastore.TYPES.BACKUP_DS){
      this.imagesDataTable = new BackupsTable(IMAGES_TABLE_ID, opts);
    } else {
      this.imagesDataTable = new ImagesTable(IMAGES_TABLE_ID, opts);
    }

    return this.imagesDataTable.dataTableHTML;
  }

  function _setup(context) {
    this.imagesDataTable.initialize();
    this.imagesDataTable.refreshResourceTableSelect();

    return false;
  }
})
