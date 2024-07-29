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

  //require('foundation.tab');
  var BaseFormPanel = require('utils/form-panels/form-panel');
  var Sunstone = require('sunstone');
  var Locale = require('utils/locale');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var DatastoresTable = require('tabs/datastores-tab/datatable');

  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require('hbs!./create/wizard');

  /*
    CONSTANTS
   */

  var FORM_PANEL_ID = require('./create/formPanelId');
  var TAB_ID = require('../tabId');

  /*
    CONSTRUCTOR
   */

  function FormPanel() {
    this.formPanelId = FORM_PANEL_ID;
    this.tabId = TAB_ID;
    this.actions = {
      'create': {
        'title': Locale.tr("Create Cluster"),
        'buttonText': Locale.tr("Create"),
        'resetButton': true
      },
      'update': {
        'title': Locale.tr("Update Cluster"),
        'buttonText': Locale.tr("Update"),
        'resetButton': false
      }
    };

    BaseFormPanel.call(this);
  }

  FormPanel.FORM_PANEL_ID = FORM_PANEL_ID;
  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.setup = _setup;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {
    var opts = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.hostsTable = new HostsTable("cluster_wizard_hosts", opts);
    this.vnetsTable = new VNetsTable("cluster_wizard_vnets", opts);
    this.datastoresTable = new DatastoresTable("cluster_wizard_datastores", opts);

    return TemplateWizardHTML({
      'formPanelId': this.formPanelId,
      'hostsTableHTML': this.hostsTable.dataTableHTML,
      'vnetsTableHTML': this.vnetsTable.dataTableHTML,
      'datastoresTableHTML': this.datastoresTable.dataTableHTML

    });
  }

  function _setup(context) {
    Foundation.reflow(context, 'tabs')
    this.hostsTable.initialize();
    this.vnetsTable.initialize();
    this.datastoresTable.initialize();
  }

  function _submitWizard(context) {
    var that = this;

    var selectedHostsList      = that.hostsTable.retrieveResourceTableSelect();
    var selectedVNetsList      = that.vnetsTable.retrieveResourceTableSelect();
    var selectedDatastoresList = that.datastoresTable.retrieveResourceTableSelect();

    if (that.action == "create") {
      var selectedHosts = {};
      $.each(selectedHostsList, function(i,e){
        selectedHosts[e] = 1;
      });

      var selectedVNets = {};
      $.each(selectedVNetsList, function(i,e){
        selectedVNets[e] = 1;
      });

      var selectedDatastores = {};
      $.each(selectedDatastoresList, function(i,e){
        selectedDatastores[e] = 1;
      });

      var cluster_json = {
        "cluster": {
          "name": $('#name',context).val(),
          "hosts": selectedHosts,
          "vnets": selectedVNets,
          "datastores": selectedDatastores
        }
      };

      Sunstone.runAction("Cluster.create",cluster_json);
      return false;
    } else if (that.action == "update") {

      // find out which ones are in and out
      $.each(selectedHostsList, function(i,hostId){
        if (that.originalHostsList.indexOf(hostId) == -1){
          Sunstone.runAction("Cluster.addhost",that.clusterUpdateId,hostId);
        }
      });

      $.each(that.originalHostsList, function(i,hostId){
        if (selectedHostsList.indexOf(hostId) == -1){
          Sunstone.runAction("Cluster.delhost",that.clusterUpdateId,hostId);
        }
      });

      $.each(selectedVNetsList, function(i,vnetId){
        if (that.originalVNetsList.indexOf(vnetId) == -1){
          Sunstone.runAction("Cluster.addvnet",that.clusterUpdateId,vnetId);
        }
      });

      $.each(that.originalVNetsList, function(i,vnetId){
        if (selectedVNetsList.indexOf(vnetId) == -1){
          Sunstone.runAction("Cluster.delvnet",that.clusterUpdateId,vnetId);
        }
      });

      $.each(selectedDatastoresList, function(i,datastoreId){
        if (that.originalDatastoresList.indexOf(datastoreId) == -1){
          Sunstone.runAction("Cluster.adddatastore",that.clusterUpdateId,datastoreId);
        }
      });

      $.each(that.originalDatastoresList, function(i,datastoreId){
        if (selectedDatastoresList.indexOf(datastoreId) == -1){
          Sunstone.runAction("Cluster.deldatastore",that.clusterUpdateId,datastoreId);
        }
      });

      Sunstone.hideFormPanel(TAB_ID);

      return false;
    }
  }

  function _onShow(context) {
    // TODO bug, does not work until the input is visible
    $("input#name", context).focus();

    this.hostsTable.refreshResourceTableSelect();
    this.vnetsTable.refreshResourceTableSelect();
    this.datastoresTable.refreshResourceTableSelect();
  }

  function _fill(context, element) {
    this.setHeader(element);

    var name    = element.NAME;
    var hostIds = element.HOSTS.ID;
    var vnetIds = element.VNETS.ID;
    var dsIds   = element.DATASTORES.ID;

    if (typeof hostIds == 'string'){
      hostIds = [hostIds];
    }

    if (typeof vnetIds == 'string'){
      vnetIds = [vnetIds];
    }

    if (typeof dsIds == 'string'){
      dsIds = [dsIds];
    }

    $('#name',context).val(name);
    $('#name',context).attr("disabled", "disabled");

    this.originalHostsList = [];

    // Select hosts belonging to the cluster
    if (hostIds){
      this.originalHostsList = hostIds;

      this.hostsTable.selectResourceTableSelect({ids: hostIds});
    }

    this.originalVNetsList = [];

    // Select vnets belonging to the cluster
    if (vnetIds){
      this.originalVNetsList = vnetIds;

      this.vnetsTable.selectResourceTableSelect({ids: vnetIds});
    }

    this.originalDatastoresList = [];

    // Select datastores belonging to the cluster
    if (dsIds){
      this.originalDatastoresList = dsIds;

      this.datastoresTable.selectResourceTableSelect({ids: dsIds});
    }

    this.clusterUpdateId = element.ID;
  }
});
