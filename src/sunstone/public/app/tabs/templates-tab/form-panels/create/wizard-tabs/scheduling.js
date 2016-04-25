/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  function WizardTab() {
    if (!Config.isTemplateCreationTabEnabled('scheduling')) {
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
    this.hostsTable = new HostsTable(this.wizardTabId + 'HostsTable', options);
    this.clustersTable = new ClustersTable(this.wizardTabId + 'ClustersTable', options);
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
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
      'clustersTableSelectHTML': this.clustersTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
  }

  function _setup(context) {
    var  that = this;
    Foundation.reflow(context, 'tabs');

    context.on("change", "input[name='req_select']", function() {
      if ($("input[name='req_select']:checked").val() == "host_select") {
        $("div.host_select",    context).show();
        $("div.cluster_select", context).hide();
      } else {
        $("div.host_select",    context).hide();
        $("div.cluster_select", context).show();
      }
    });

    context.on("change", "input[name='rank_select']", function() {
      $("#SCHED_RANK", context).val(this.value);
    });

    context.on("change", "input[name='ds_rank_select']", function() {
      $("#SCHED_DS_RANK", context).val(this.value);
    });

    var selectOptions = {
      'selectOptions': {
        'select_callback': function(aData, options) {
          that.generateRequirements(context)
        },
        'unselect_callback': function(aData, options) {
          that.generateRequirements(context)
        }
      }
    }

    that.hostsTable.initialize(selectOptions);
    that.hostsTable.refreshResourceTableSelect();
    that.clustersTable.initialize(selectOptions);
    that.clustersTable.refreshResourceTableSelect();
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

      var selectedResources = {
          ids : hosts
        }

      this.hostsTable.selectResourceTableSelect(selectedResources);


      var selectedResources = {
          ids : clusters
        }

      this.clustersTable.selectResourceTableSelect(selectedResources);

      $('input#SCHED_REQUIREMENTS', context).val(TemplateUtils.htmlDecode(req));
      delete templateJSON['SCHED_REQUIREMENTS'];
    }

    var dsReqJSON = templateJSON['SCHED_DS_REQUIREMENTS'];
    if (dsReqJSON) {
      var dsReq = TemplateUtils.escapeDoubleQuotes(dsReqJSON);
      $('input#SCHED_DS_REQUIREMENTS', context).val(TemplateUtils.htmlDecode(dsReq));
      delete templateJSON['SCHED_DS_REQUIREMENTS'];
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

        $('input#SCHED_RANK', context).val(TemplateUtils.htmlDecode(rankJSON));

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

        $('input#SCHED_DS_RANK', context).val(TemplateUtils.htmlDecode(dsRankJSON));

        delete templateJSON["SCHED_DS_RANK"];
    }
  }

  function _generateRequirements(context) {
      var req_string=[];
      var selected_hosts = this.hostsTable.retrieveResourceTableSelect();
      var selected_clusters = this.clustersTable.retrieveResourceTableSelect();

      $.each(selected_hosts, function(index, hostId) {
        req_string.push('ID="'+hostId+'"');
      });

      $.each(selected_clusters, function(index, clusterId) {
        req_string.push('CLUSTER_ID="'+clusterId+'"');
      });

      $('#SCHED_REQUIREMENTS', context).val(req_string.join(" | "));
  };
});
