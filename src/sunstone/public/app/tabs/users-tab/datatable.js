/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var TabDataTable = require('utils/tab-datatable');
  var SunstoneConfig = require('sunstone-config');
  var Locale = require('utils/locale');
  var QuotaDefaults = require('utils/quotas/quota-defaults');
  var QuotaWidgets = require('utils/quotas/quota-widgets');
  var TemplateUtils = require('utils/template-utils');
  var LabelsUtils = require('utils/labels/utils');
  var SearchDropdown = require('hbs!./datatable/search');

  /*
    CONSTANTS
   */

  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var TAB_NAME = require('./tabId');
  var LABELS_COLUMN = 10;
  var SEARCH_COLUMN = 11;
  var TEMPLATE_ATTR = 'TEMPLATE';

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;
    this.labelsColumn = LABELS_COLUMN;

    this.dataTableOptions = {
      "bAutoWidth": false,
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          { "bSortable": false, "aTargets": ["check",5,6,7] },
          {"sWidth": "35px", "aTargets": [0]},
          { "sWidth": "150px", "aTargets": [5,6,7] },
          {"bVisible": true, "aTargets": SunstoneConfig.tabTableColumns(TAB_NAME)},
          {"bVisible": false, "aTargets": ['_all']}
      ]
    };

    this.columns = [
      Locale.tr("ID"),
      Locale.tr("Name"),
      Locale.tr("Group"),
      Locale.tr("Auth driver"),
      Locale.tr("VMs"),
      Locale.tr("Memory"),
      Locale.tr("CPU"),
      Locale.tr("Group ID"),
      Locale.tr("Hidden User Data"),
      Locale.tr("Labels"),
      "search_data"
    ];

    this.selectOptions = {
      "id_index": 1,
      "name_index": 2,
      "select_resource": Locale.tr("Please select a User from the list"),
      "you_selected": Locale.tr("You selected the following User:"),
      "select_resource_multiple": Locale.tr("Please select one or more users from the list"),
      "you_selected_multiple": Locale.tr("You selected the following users:")
    };

    this.totalUsers = 0;

    this.conf.searchDropdownHTML = SearchDropdown();

    this.searchFields = ["NAME", "GNAME", "PASSWORD", "AUTH_DRIVER"];
    this.searchVals   = {"NAME": "", "GNAME": "", "PASSWORD": "", "AUTH_DRIVER": ""};

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;
  Table.prototype.setupSearch = _setupSearch;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _setupSearch(context) {
    var that = this;

    $("[search-field]", context).on('input change', function(){
      that.searchVals[$(this).attr("search-field")] = $(this).val();
    });

    this.dataTable.on('search.dt', function() {
      var empty = true;

      for(var i=0; i < that.searchFields.length; i++){
        var name = that.searchFields[i];
        empty = $("[search-field="+name+"]", context).val() == "";

        if(!empty){
          break;
        }
      }

      if(empty){
        $("button.search-dropdown", context).addClass("hollow");
      } else {
        $("button.search-dropdown", context).removeClass("hollow");
      }
    });

    $.fn.dataTable.ext.search.push(
      function( settings, data, dataIndex ) {
        // This is a global search function, we need to apply it only if the
        // search is triggered for the current table
        if(that.dataTableId != settings.nTable.id){
          return true;
        }

        try {
          var data = JSON.parse(atob(data[SEARCH_COLUMN]));

          var match = true;

          for(var i=0; i < that.searchFields.length; i++){
            var name = that.searchFields[i];

            match = (data[name].match( that.searchVals[name] ) != null);

            if (!match){
              break;
            }
          }

          return match;
        } catch (err) {}

        return true;
      }
    );
  }

  function _elementArray(element_json) {
    var that = this;

    this.totalUsers++;

    var element = element_json[XML_ROOT];

    var vms    = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var memory = '<span class="progress-text right" style="font-size: 12px">-</span>';
    var cpu    = '<span class="progress-text right" style="font-size: 12px">-</span>';

    var default_user_quotas = QuotaDefaults.getDefaultUserQuotas();

    QuotaWidgets.initEmptyQuotas(element);

    if (!$.isEmptyObject(element.VM_QUOTA)){
      vms = QuotaWidgets.quotaBar(
        element.VM_QUOTA.VM.VMS_USED,
        element.VM_QUOTA.VM.VMS,
        default_user_quotas.VM_QUOTA.VM.VMS);

      memory = QuotaWidgets.quotaBarMB(
        element.VM_QUOTA.VM.MEMORY_USED,
        element.VM_QUOTA.VM.MEMORY,
        default_user_quotas.VM_QUOTA.VM.MEMORY);

      cpu = QuotaWidgets.quotaBarFloat(
        element.VM_QUOTA.VM.CPU_USED,
        element.VM_QUOTA.VM.CPU,
        default_user_quotas.VM_QUOTA.VM.CPU);
    }

    // Build hidden user template
    var hidden_template = TemplateUtils.templateToString(element);

    var search = {
      NAME:  element.NAME,
      GNAME: element.GNAME,
      PASSWORD: element.PASSWORD,
      AUTH_DRIVER: element.AUTH_DRIVER
    }

    try{
      that.searchFields.forEach(function(name){
        that.searchSets[name].add(search[name]);
      });
    }catch(e){}

    return [
      '<input class="check_item" type="checkbox" id="'+RESOURCE.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" ' +
                           'value="' + element.ID + '"/>',
      element.ID,
      element.NAME,
      element.GNAME,
      element.AUTH_DRIVER,
      vms,
      memory,
      cpu,
      element.GID,
      hidden_template,
      (LabelsUtils.labelsStr(element[TEMPLATE_ATTR])||''),
      btoa(JSON.stringify(search))
    ];
  }

  function _preUpdateView() {
    var that = this;

    this.totalUsers = 0;

    this.searchSets = {};

    try {
      that.searchFields.forEach(function(name){
        that.searchSets[name] = new Set();
      });
    } catch(e){}
  }

  function _postUpdateView() {
    var that = this;

    $(".total_users").text(this.totalUsers);

    try {
      that.searchFields.forEach(function(name){
        var st = "";

        that.searchSets[name].forEach(function(val){
          st += '<option value="' + val + '">';
        });

        $("datalist[search-datalist="+name+"]", $("#"+TAB_NAME)).html(st);
      });
    } catch(e){}
  }
});
