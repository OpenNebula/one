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

  var TemplateHTML = require('hbs!./showback/html');
  var Locale = require('utils/locale');
  var OpenNebulaVM = require('opennebula/vm');
  var Notifier = require('utils/notifier');
  var ResourceSelect = require('utils/resource-select');

  require('flot');
  require('flot.stack');
  require('flot.resize');
  require('flot.tooltip');
  require('flot.time');

  function _html(){
    var html = TemplateHTML({});

    return html;
  }

  // context is a jQuery selector
  // The following options can be set:
  //   fixed_user     fix an owner user ID. Use "" to fix to "any user"
  //   fixed_group    fix an owner group ID. Use "" to fix to "any group"
  function _setup(context, opt) {
    if (opt == undefined){
      opt = {};
    }

    //--------------------------------------------------------------------------
    // VM owner: all, group, user
    //--------------------------------------------------------------------------

    if (opt.fixed_user != undefined){
      $("#showback_user_container", context).hide();
    } else {
      ResourceSelect.insert({
          context: $('#showback_user_select', context),
          resourceName: 'User',
          initValue: -1,
          extraOptions: '<option value="-1">' + Locale.tr("<< me >>") + '</option>'
        });
    }

    if (opt.fixed_group != undefined){
      $("#showback_group_container", context).hide();
    } else {
      ResourceSelect.insert({
          context: $('#showback_group_select', context),
          resourceName: 'Group',
          emptyValue: true
        });
    }

    showback_dataTable = $("#showback_datatable",context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "iDisplayLength": 6,
      "sDom": "t<'row collapse'<'small-12 columns'p>>",
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": [0,1,2]},
          { "sType": "num", "aTargets": [4]}
        ]
    });

    showback_dataTable.fnSort( [ [0, "desc"] ] );

    showback_vms_dataTable = $("#showback_vms_datatable",context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
        { "sType": "num", "aTargets": [0,3,4]}
      ]
    });

    showback_dataTable.on("click", "tbody tr", function(){
      var cells = showback_dataTable.fnGetData(this);
      var year = cells[1];
      var month = cells[2];

      showback_vms_dataTable.fnClearTable();
      showback_vms_dataTable.fnAddData(
                    showback_dataTable.data("vms_per_date")[year][month].VMS);

      $("#showback_vms_title", context).text(
                  Locale.months[month-1] + " " + year + " " + Locale.tr("VMs"));
      $(".showback_vms_table", context).show();
      $(".showback_select_a_row", context).hide();
    });

    //--------------------------------------------------------------------------
    // Submit request
    //--------------------------------------------------------------------------

    $("#showback_submit", context).on("click", function(){
      var options = {};

      var userfilter;
      var group;

      if (opt.fixed_user != undefined){
        userfilter = opt.fixed_user;
      } else {
        userfilter = $("#showback_user_select .resource_list_select", context).val();
      }

      if (opt.fixed_group != undefined){
        group = opt.fixed_group;
      } else {
        group = $("#showback_group_select .resource_list_select", context).val();
      }

      if(userfilter != ""){
        options.userfilter = userfilter;
      }

      if(group != ""){
        options.group = group;
      }

      OpenNebulaVM.showback({
        // timeout: true,
        success: function(req, response){
          _fillShowback(context, req, response);
        },
        error: Notifier.onError,
        data: options
      });

      return false;
    });
  }

  function _fillShowback(context, req, response) {
    $("#showback_no_data", context).hide();

    if(response.SHOWBACK_RECORDS == undefined){
      $("#showback_placeholder", context).show();
      $("#showback_content", context).hide();

      $("#showback_no_data", context).show();
      return false;
    }

    var vms_per_date = {};
    $.each(response.SHOWBACK_RECORDS.SHOWBACK, function(index, showback){
      if (vms_per_date[showback.YEAR] == undefined) {
        vms_per_date[showback.YEAR] = {};
      }

      if (vms_per_date[showback.YEAR][showback.MONTH] == undefined) {
        vms_per_date[showback.YEAR][showback.MONTH] = {
          "VMS": [],
          "TOTAL": 0
        };
      }

      vms_per_date[showback.YEAR][showback.MONTH].VMS.push(
        [ showback.VMID,
          showback.VMNAME,
          showback.UNAME,
          showback.HOURS,
          showback.RHOURS,
          showback.TOTAL_COST
        ]);

      vms_per_date[showback.YEAR][showback.MONTH].TOTAL += parseFloat(showback.TOTAL_COST);
    });

    var series = []
    var showback_data = [];
    $.each(vms_per_date, function(year, months){
      $.each(months, function(month, value){
        series.push(
          [ (new Date(year, month-1)).getTime(),
            year,
            month,
            Locale.months[month-1] + " " + year, value.TOTAL.toFixed(2)
          ]);

        showback_data.push([(new Date(year, month-1)), value.TOTAL.toFixed(2) ]);
      });
    });

    showback_dataTable.fnClearTable();
    if (series.length > 0) {
      showback_dataTable.data("vms_per_date", vms_per_date);
      showback_dataTable.fnAddData(series);
    }

    var showback_plot_series = [];
    showback_plot_series.push(
    {
      label: Locale.tr("Showback"),
      data: showback_data
    });

    var options = {
      // colors: [ "#cdebf5", "#2ba6cb", "#6f6f6f" ]
      colors: [ "#2ba6cb", "#707D85", "#AC5A62" ],
      legend: {
        show: false
      },
      xaxis : {
        mode: "time",
        color: "#efefef",
        size: 8,
        minTickSize: [1, "month"]
      },
      yaxis : {
        show: false
      },
      series: {
        bars: {
          show: true,
          lineWidth: 0,
          barWidth: 24 * 60 * 60 * 1000 * 20,
          fill: true,
          align: "left"
        }
      },
      grid: {
        borderWidth: 1,
        borderColor: "#efefef",
        hoverable: true
      }
      //tooltip: true,
      //tooltipOpts: {
      //    content: "%x"
      //}
    };

    var showback_plot = $.plot(
        $("#showback_graph", context), showback_plot_series, options);

    $("#showback_placeholder", context).hide();
    $("#showback_content", context).show();
  }

  return {
    'html': _html,
    'setup': _setup
  };
});
