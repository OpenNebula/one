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

//  require('foundation.tab');
  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var WizardFields = require('utils/wizard-fields');
  var TemplateUtils = require('utils/template-utils');
  var HostsTable = require('tabs/hosts-tab/datatable');
  var ClustersTable = require('tabs/clusters-tab/datatable');
  var DatastoresTable = require('tabs/datastores-tab/datatable');
  var UniqueId = require('utils/unique-id');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./scheduling/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./scheduling/wizardTabId');

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'scheduling')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-sitemap';
    this.title = Locale.tr("Scheduling");

    var options = {
      'select': true,
      'selectOptions': {
        'multiple_choice': true
      }
    }
    this.hostsTable = new HostsTable('HostsTable' + UniqueId.id(), options);
    this.clustersTable = new ClustersTable('ClustersTable' + UniqueId.id(), options);
    this.datastoresTable = new DatastoresTable('DatastoresTable' + UniqueId.id(), options);
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.setupOrder = 1;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.generateRequirements = _generateRequirements;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'hostsTableSelectHTML': this.hostsTable.dataTableHTML,
      'clustersTableSelectHTML': this.clustersTable.dataTableHTML,
      'dsTableSelectHTML': this.datastoresTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var  that = this;
    Foundation.reflow(context, 'tabs');

    context.on("change", "input[name='req_select']", function() {
      that.datastoresTable.updateFn();
      that.datastoresTable.deselectHiddenResources();

      if ($("input[name='req_select']:checked").val() == "host_select") {
        $("div.host_select",    context).show();
        $("div.cluster_select", context).hide();
      } else {
        $("div.host_select",    context).hide();
        $("div.cluster_select", context).show();
      }
    });

    context.on("change", "input[name='rank_select']", function() {
      WizardFields.fillInput($("#SCHED_RANK", context), this.value);
    });

    context.on("change", "input[name='ds_rank_select']", function() {
      WizardFields.fillInput($("#SCHED_DS_RANK", context), this.value);
    });

    var generateCallbacks = function (updateDatastores) {
      return {
        select_callback: function() {
          if (updateDatastores) {
            that.datastoresTable.updateFn();
            that.datastoresTable.deselectHiddenResources();
          }

          that.generateRequirements(context)
        },
        unselect_callback: function() {
          if (updateDatastores) {
            that.datastoresTable.updateFn();
          }

          that.generateRequirements(context)
        }
      }
    }

    that.clustersTable.initialize({ selectOptions: generateCallbacks(true) });
    that.hostsTable.initialize({ selectOptions: generateCallbacks(true) });
    that.datastoresTable.initialize({
      selectOptions: Object.assign(generateCallbacks(), {
        filter_fn: function(ds) {
          if (!that.hostsTable || !that.clustersTable) return true;

          var clusters = ds.CLUSTERS.ID;
          var ensuredClusters = Array.isArray(clusters) ? clusters : [clusters];

          var hostClusterIndex = that.hostsTable.columnsIndex.CLUSTER
          var hostClustersIds = that.hostsTable.getColumnDataInSelectedRows(hostClusterIndex)
          var clustersIds = that.clustersTable.getColumnDataInSelectedRows()

          return (
            (hostClustersIds.length === 0 && clustersIds.length === 0) ||
            hostClustersIds
              .concat(clustersIds)
              .some(function(id) { return ensuredClusters.includes(id) })
          )
        }
      })
    });
    that.datastoresTable.filter("system", 10);
    that.hostsTable.refreshResourceTableSelect();
    that.clustersTable.refreshResourceTableSelect();
    that.datastoresTable.refreshResourceTableSelect();

    $("#" + this.wizardTabId).data({
      hostsTable: that.hostsTable,
      clustersTable: that.clustersTable,
      datastoresTable: that.datastoresTable,
    });
  }

  function _retrieve(context) {
    return WizardFields.retrieve(context);
  }

  function _fill(context, templateJSON) {

    var reqJSON = templateJSON['SCHED_REQUIREMENTS'];
    if (reqJSON) {
      var req = TemplateUtils.escapeDoubleQuotes(reqJSON);

      var host_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
      var cluster_id_regexp = /CLUSTER_ID=\\"([0-9]+)\\"/g;

      var hosts = [];
      while (match = host_id_regexp.exec(req)) {
          hosts.push(match[2])
      }

      var clusters = [];
      while (match = cluster_id_regexp.exec(req)) {
          clusters.push(match[1])
      }

      this.hostsTable.selectResourceTableSelect({ ids: hosts });
      this.clustersTable.selectResourceTableSelect({ ids: clusters });

      this.datastoresTable.updateFn();
      this.datastoresTable.deselectHiddenResources();
    }

    var dsReqJSON = templateJSON['SCHED_DS_REQUIREMENTS'];
    if (dsReqJSON) {
      var dsReq = TemplateUtils.escapeDoubleQuotes(dsReqJSON);
      var ds_id_regexp = /(\s|\||\b)ID=\\"([0-9]+)\\"/g;
      var ds = [];
      while (match = ds_id_regexp.exec(dsReq)) {
        ds.push(match[2])
      }
      var selectedResources = {
        ids : ds
      }

      this.datastoresTable.selectResourceTableSelect(selectedResources);
    }

    var rankJSON = templateJSON["SCHED_RANK"];
    if (rankJSON) {
        var striping_regexp = /^-RUNNING_VMS$/;
        var packing_regexp = /^RUNNING_VMS$/;
        var loadaware_regexp = /^FREE_CPU$/;

        if (striping_regexp.test(rankJSON)) {
            $('input[name="rank_select"]#stripingRadio', context).click()
        }
        else if (packing_regexp.test(rankJSON)) {
            $('input[name="rank_select"]#packingRadio', context).click()
        }
        else if (loadaware_regexp.test(rankJSON)) {
            $('input[name="rank_select"]#loadawareRadio', context).click()
        }

        delete templateJSON["SCHED_RANK"];
    }

    var dsRankJSON = templateJSON["SCHED_DS_RANK"];
    if (dsRankJSON) {
        var striping_regexp = /^FREE_MB$/;
        var packing_regexp = /^-FREE_MB$/;

        if (striping_regexp.test(dsRankJSON)) {
            $('input[name="ds_rank_select"]#stripingDSRadio', context).click()
        }
        else if (packing_regexp.test(dsRankJSON)) {
            $('input[name="ds_rank_select"]#packingDSRadio', context).click()
        }

        delete templateJSON["SCHED_DS_RANK"];
    }

     WizardFields.fill(context, templateJSON);
  }

  function _generateRequirements(context) {
      var req_string=[];
      var req_ds_string=[];
      var selected_hosts = this.hostsTable.retrieveResourceTableSelect();
      var selected_clusters = this.clustersTable.retrieveResourceTableSelect();
      var selected_ds = this.datastoresTable.retrieveResourceTableSelect();

      $.each(selected_hosts, function(index, hostId) {
        req_string.push('ID="'+hostId+'"');
      });

      $.each(selected_clusters, function(index, clusterId) {
        req_string.push('CLUSTER_ID="'+clusterId+'"');
      });

      $.each(selected_ds, function(index, dsId) {
        req_ds_string.push('ID="'+dsId+'"');
      });

      $('#SCHED_REQUIREMENTS', context).val(req_string.join(" | "));
      $('#SCHED_DS_REQUIREMENTS', context).val(req_ds_string.join(" | "));
  };
});
