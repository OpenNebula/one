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

  var BaseDialog = require("utils/dialogs/dialog");
  var ClustersTable = require("tabs/clusters-tab/datatable");
  var Sunstone = require("sunstone");
  var TemplateUtils = require("utils/template-utils");

  /*
    TEMPLATES
   */

  var TemplateHTML = require("hbs!./clusters/html");

  /*
    CONSTANTS
   */

  var DIALOG_ID = require("./clusters/dialogId");
  var DATASTORES_TAB_ID = require("tabs/datastores-tab/tabId");
  var VNETS_TAB_ID = require("tabs/vnets-tab/tabId");
  var VNTEMPLATE_TAB_ID = require("tabs/vnets-templates-tab/tabId");

  /*
    CONSTRUCTOR
   */

  function Dialog() {
    this.dialogId = DIALOG_ID;

    BaseDialog.call(this);
  };

  Dialog.DIALOG_ID = DIALOG_ID;
  Dialog.prototype = Object.create(BaseDialog.prototype);
  Dialog.prototype.constructor = Dialog;
  Dialog.prototype.html = _html;
  Dialog.prototype.onShow = _onShow;
  Dialog.prototype.setup = _setup;
  Dialog.prototype.setParams = _setParams;

  return Dialog;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    this.clustersTable = new ClustersTable("clusters-"+this.dialogId, {
        info: false,
        select: true,
        selectOptions: {"multiple_choice": true}
      });

    return TemplateHTML({
      "dialogId": this.dialogId,
      "clustersTableHTML": this.clustersTable.dataTableHTML
    });
  }

  function _setup(dialog) {
    var that = this;
    that.clustersTable.initialize();

    $("#" + DIALOG_ID + "Form", dialog).submit(function() {
      var selectedClustersList = that.clustersTable.retrieveResourceTableSelect();
      if ( that.only_update_template != undefined && that.only_update_template != true) {
        $.each(selectedClustersList, function(index, clusterId) {
          if ($.inArray(clusterId, that.originalClusterIds) === -1) {
            if(that.resource == "datastore"){
              Sunstone.runAction("Cluster.adddatastore", clusterId, that.element.ID);
            } else {
              Sunstone.runAction("Cluster.addvnet", clusterId, that.element.ID);
            }
          }
        });
        $.each(that.originalClusterIds, function(index, clusterId) {
          if ($.inArray(clusterId, selectedClustersList) === -1) {
            if(that.resource == "datastore"){
              Sunstone.runAction("Cluster.deldatastore", clusterId, that.element.ID);
            } else {
              Sunstone.runAction("Cluster.delvnet", clusterId, that.element.ID);
            }
          }
        });
      } else {
        that.element.TEMPLATE.CLUSTER = selectedClustersList.join(",");
        Sunstone.runAction(that.resource_name+".update", that.element.ID, TemplateUtils.templateToString(that.element.TEMPLATE));
      }

      Sunstone.getDialog(DIALOG_ID).hide();
      Sunstone.getDialog(DIALOG_ID).reset();
      setTimeout(function() {
        Sunstone.runAction(that.resource_name+".refresh");
      }, 1500);

      return false;
    });
  }


  /**
   * @param {object} params
   *        - params.element : user object, or empty object {}
   *        - params.resource : one of datastore, vnet
   */
  function _setParams(params) {
    this.element = params.element;

    this.resource = params.resource;

    this.resource_name = params.resource_name;

    this.only_update_template = params.only_update_template;

    var clusters;

    if ( this.only_update_template != undefined && this.only_update_template != true ) {
      clusters = this.element.CLUSTERS;

      if (clusters !== undefined && clusters.ID !== undefined) {
        if (Array.isArray(clusters.ID)) {
          this.originalClusterIds = clusters.ID;
        } else {
          this.originalClusterIds = [clusters.ID];
        }
      } else {
        this.originalClusterIds = [];
      }

    } else {
      clusters = this.element.TEMPLATE.CLUSTERS;

      if (clusters !== undefined ) {
        clusters = clusters.split(",");
        if (Array.isArray(clusters)) {
          this.originalClusterIds = clusters;
        } else {
          this.originalClusterIds = [clusters];
        }
      } else {
        this.originalClusterIds = [];
      }
    }
  }

  function _onShow(dialog) {
    if(this.resource == "datastore"){
      this.setNames( {tabId: DATASTORES_TAB_ID} );
    }else if ( this.resource == "vnet" ){
      this.setNames( {tabId: VNETS_TAB_ID} );
    } else {
      this.setNames( {tabId: VNTEMPLATE_TAB_ID} );
    }

    this.clustersTable.refreshResourceTableSelect();

    if (this.originalClusterIds !== undefined && this.originalClusterIds.length > 0) {
      this.clustersTable.selectResourceTableSelect({ids: this.originalClusterIds});
    }
  }
});
