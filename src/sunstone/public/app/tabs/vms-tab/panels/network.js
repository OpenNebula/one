define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Humanize = require('utils/humanize');
  var Notifier = require('utils/notifier');
  var Graphs = require('utils/graphs');
  var StateActions = require('../utils/state-actions');
  var OpenNebulaVM = require('opennebula/vm');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./network/panelId');
  var ATTACH_NIC_DIALOG_ID = require('../dialogs/attach-nic/dialogId');
  var RESOURCE = "VM"
  var XML_ROOT = "VM"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Network");
    this.icon = "fa-globe";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var that = this;
    var html = '<form id="tab_network_form" vmid="' + that.element.ID + '" >\
        <div class="row">\
        <div class="large-12 columns">\
           <table class="nics_table no-hover info_table dataTable extended_table">\
             <thead>\
               <tr>\
                  <th></th>\
                  <th>' + Locale.tr("ID") + '</th>\
                  <th>' + Locale.tr("Network") + '</th>\
                  <th>' + Locale.tr("IP") + '</th>\
                  <th>' + Locale.tr("MAC") + '</th>\
                  <th>' + Locale.tr("IPv6 ULA") + '</th>\
                  <th>' + Locale.tr("IPv6 Global") + '</th>\
                  <th colspan="">' + Locale.tr("Actions") + '</th>\
                  <th>'                 ;

    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      if (StateActions.enabledStateAction("VM.attachnic", 
            that.element.STATE, 
            that.element.LCM_STATE) && 
          OpenNebulaVM.isNICAttachSupported(that.element)) {
        html += '\
             <button id="attach_nic" class="button tiny success right radius" >' + Locale.tr("Attach nic") + '</button>'
      } else {
        html += '\
             <button id="attach_nic" class="button tiny success right radius" disabled="disabled">' + Locale.tr("Attach nic") + '</button>'
      }
    }

    html += '</th>\
                </tr>\
             </thead>\
             <tbody>\
             </tbody>\
            </table>\
          </div>\
        </div>'      ;

    var externalNetworkAttrs = OpenNebulaVM.retrieveExternalNetworkAttrs(that.element);
    if (!$.isEmptyObject(externalNetworkAttrs)) {
      html += '<div class="row">' +
        '<div class="large-12 columns">' +
         '<table class="dataTable extended_table">' +
            '<thead>' +
              '<tr>' +
                 '<th colspan=2>' + Locale.tr("Network Monitoring Attributes") + '</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>';

      $.each(externalNetworkAttrs, function(key, value) {
        html += '<tr>' +
           '<td>' + key + '</td>' +
           '<td>' + value + '</td>' +
          '</tr>';
      });

      html += '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }

    // Do not show statistics for not hypervisors that do not gather net data
    if (OpenNebulaVM.isNICGraphsSupported(that.element)) {
      html += '\
          <div class="row">\
              <div class="large-6 columns">\
                <div class="row text-center">\
                  <h3 class="subheader"><small>' + Locale.tr("NET RX") + '</small></h3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph text-center" id="vm_net_rx_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fa fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_rx_legend">\
                  </div>\
                </div>\
              </div>\
              <div class="large-6 columns">\
                <div class="row text-center">\
                  <h3 class="subheader"><small>' + Locale.tr("NET TX") + '</small></h3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph text-center" id="vm_net_tx_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fa fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_tx_legend">\
                  </div>\
                </div>\
              </div>\
              <div class="large-6 columns">\
                <div class="row text-center">\
                  <h3 class="subheader"><small>' + Locale.tr("NET DOWNLOAD SPEED") + '</small></h3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph text-center" id="vm_net_rx_speed_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fa fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_rx_speed_legend">\
                  </div>\
                </div>\
              </div>\
              <div class="large-6 columns">\
                <div class="row text-center">\
                  <h3 class="subheader"><small>' + Locale.tr("NET UPLOAD SPEED") + '</small></h3>\
                </div>\
                <div class="row">\
                  <div class="large-12 columns centered graph text-center" id="vm_net_tx_speed_graph" style="height: 100px;">\
                    <span  id="provision_dashboard_total" style="font-size:80px">\
                      <i class="fa fa-spinner fa-spin"></i>\
                    </span>\
                  </div>\
                </div>\
                <div class="row graph_legend">\
                  <div class="large-12 columns centered" id="vm_net_tx_speed_legend">\
                  </div>\
                </div>\
              </div>\
          </div>\
        </form>';
    }

    return html;
  }

  function _setup(context) {
    var that = this;
    /* TODO if (Config.isTabActionEnabled("vms-tab", "VM.saveas")) {
      setupSaveAsDialog();

      $('a.saveas').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var disk_id = b.parents('tr').attr('disk_id');

          popUpSaveAsDialog(vm_id, disk_id);

          //b.html(spinner);
          return false;
      });
    } */

    /* TODO if (Config.isTabActionEnabled("vms-tab", "VM.disk_snapshot_cancel")) {
      $('a.disk_snapshot_cancel').live('click', function(){
          var b = $(this);
          var vm_id = b.parents('form').attr('vmid');
          var disk_id = b.parents('tr').attr('disk_id');

          Sunstone.runAction('VM.disk_snapshot_cancel', vm_id, disk_id);

          return false;
      });
    } */

    var nics = []

    if ($.isArray(that.element.TEMPLATE.NIC))
        nics = that.element.TEMPLATE.NIC
    else if (!$.isEmptyObject(that.element.TEMPLATE.NIC))
        nics = [that.element.TEMPLATE.NIC]

    var nic_dt_data = [];
    if (nics.length) {
      var nic_dt_data = [];

      for (var i = 0; i < nics.length; i++) {
        var nic = nics[i];

        var actions;
        // Attach / Detach
        if (
           (// ACTIVE
            that.element.STATE == "3") &&
           (// HOTPLUG_NIC
            that.element.LCM_STATE == "25") &&
           (//
            nic.ATTACH == "YES")
           ) {
          actions = Locale.tr("attach/detach in progress")
        } else {
          actions = '';

          if (Config.isTabActionEnabled("vms-tab", "VM.detachnic")) {
            if (StateActions.enabledStateAction("VM.detachnic", that.element.STATE, that.element.LCM_STATE)) {
              actions += '<a href="VM.detachnic" class="detachnic" ><i class="fa fa-times"/>' + Locale.tr("Detach") + '</a>'
            }
          }
        }

        var secgroups = [];

        var nic_secgroups = {};
        if (nic.SECURITY_GROUPS != undefined) {
          $.each(nic.SECURITY_GROUPS.split(","), function() {
            nic_secgroups[this] = true;
          });
        }

        if (that.element.TEMPLATE.SECURITY_GROUP_RULE != undefined) {
          $.each(that.element.TEMPLATE.SECURITY_GROUP_RULE, function() {
            if (nic_secgroups[this.SECURITY_GROUP_ID]) {
              secgroups.push(this);
            }
          });
        }

        nic_dt_data.push({
          NIC_ID : nic.NIC_ID,
          NETWORK : nic.NETWORK,
          IP : (nic.IP ? nic.IP : "--"),
          MAC : nic.MAC,
          IP6_ULA : (nic.IP6_ULA ? nic.IP6_ULA : "--"),
          IP6_GLOBAL : (nic.IP6_GLOBAL ? nic.IP6_GLOBAL : "--"),
          ACTIONS : actions,
          SECURITY_GROUP_RULES : secgroups
        });
      }
    }

    var nics_table = $("#tab_network_form .nics_table", context).DataTable({
      "bDeferRender": true,
      "data": nic_dt_data,
      "columns": [
        {
          "class":          'open-control',
          "orderable":      false,
          "data":           null,
          "defaultContent": '<span class="fa fa-fw fa-chevron-down"></span>'
        },
        {"data": "NIC_ID",     "defaultContent": ""},
        {"data": "NETWORK",    "defaultContent": ""},
        {"data": "IP",         "defaultContent": ""},
        {"data": "MAC",        "defaultContent": ""},
        {"data": "IP6_ULA",    "defaultContent": ""},
        {"data": "IP6_GLOBAL", "defaultContent": ""},
        {"data": "ACTIONS",    "defaultContent": ""},
        {"defaultContent": ""}
      ],

      "fnRowCallback": function(nRow, aData, iDisplayIndex, iDisplayIndexFull) {

        if (aData.SECURITY_GROUP_RULES == undefined ||
            aData.SECURITY_GROUP_RULES.length == 0) {

          $("td.open-control", nRow).html("").removeClass('open-control');
        }

        $(nRow).attr("nic_id", aData.NIC_ID);
      }
    });

    $("#tab_network_form .nics_table", context).dataTable().fnSort([[1, 'asc']]);

    // Add event listener for opening and closing each NIC row details
    context.off('click', '#tab_network_form .nics_table td.open-control')
    context.on('click', '#tab_network_form .nics_table td.open-control', function () {
      var row = $(this).closest('table').DataTable().row($(this).closest('tr'));
    
      if (row.child.isShown()) {
        row.child.hide();
        $(this).children("span").addClass('fa-chevron-down');
        $(this).children("span").removeClass('fa-chevron-up');
      } else {
        var html = '<div style="padding-left: 30px;">\
              <table class="extended_table dataTable">\
                <thead>\
                  <tr>\
                    <th colspan="2">' + tr("Security Group") + '</th>\
                    <th>' + tr("Protocol") + '</th>\
                    <th>' + tr("Type") + '</th>\
                    <th>' + tr("Range") + '</th>\
                    <th>' + tr("Network") + '</th>\
                    <th>' + tr("ICMP Type") + '</th>\
                  </tr>\
                <thead>\
                <tbody>'            ;

        $.each(row.data().SECURITY_GROUP_RULES, function(index, elem) {
          var rule_st = sg_rule_to_st(this);

          var new_tr = '<tr>\
                  <td>' + this.SECURITY_GROUP_ID + '</td>\
                  <td>' + this.SECURITY_GROUP_NAME + '</td>\
                  <td>' + rule_st.PROTOCOL + '</td>\
                  <td>' + rule_st.RULE_TYPE + '</td>\
                  <td>' + rule_st.RANGE + '</td>\
                  <td>' + rule_st.NETWORK + '</td>\
                  <td>' + rule_st.ICMP_TYPE + '</td>\
                </tr>'
          
          html += new_tr;
        });

        row.child(html).show();
        $(this).children("span").removeClass('fa-chevron-down');
        $(this).children("span").addClass('fa-chevron-up');
      }
    });

    if (Config.isTabActionEnabled("vms-tab", "VM.attachnic")) {
      context.off('click', '#attach_nic');
      context.on('click', '#attach_nic', function() {
        var dialog = Sunstone.getDialog(ATTACH_NIC_DIALOG_ID);
        dialog.setElement(that.element);
        dialog.show();
        return false;
      });
    }

    if (Config.isTabActionEnabled("vms-tab", "VM.detachdisk")) {
      context.off('click', '.detachdisk');
      context.on('click', '.detachdisk', function() {
        var nic_id = $(this).parents('tr').attr('nic_id');
        Sunstone.runAction('VM.detachnic', that.element.ID, nic_id);
        return false;
      });
    }
  }

  function _onShow(context) {
    var that = this;
    if (OpenNebulaVM.isNICGraphsSupported(that.element)) {
      OpenNebulaVM.monitor({
        data: {
          id: that.element.ID, 
          monitor: {
            monitor_resources : "NET_TX,NET_RX"
          }
        },
        success: function(req, response) {
          var vmGraphs = [
            {
              labels : Locale.tr("Network reception"),
              monitor_resources : "NET_RX",
              humanize_figures : true,
              convert_from_bytes : true,
              div_graph : $("#vm_net_rx_graph")
            },
            {
              labels : Locale.tr("Network transmission"),
              monitor_resources : "NET_TX",
              humanize_figures : true,
              convert_from_bytes : true,
              div_graph : $("#vm_net_tx_graph")
            },
            {
              labels : Locale.tr("Network reception speed"),
              monitor_resources : "NET_RX",
              humanize_figures : true,
              convert_from_bytes : true,
              y_sufix : "B/s",
              derivative : true,
              div_graph : $("#vm_net_rx_speed_graph")
            },
            {
              labels : Locale.tr("Network transmission speed"),
              monitor_resources : "NET_TX",
              humanize_figures : true,
              convert_from_bytes : true,
              y_sufix : "B/s",
              derivative : true,
              div_graph : $("#vm_net_tx_speed_graph")
            }
          ];

          for (var i = 0; i < vmGraphs.length; i++) {
            Graphs.plot(response, vmGraphs[i]);
          }
        },
        error: Notifier.onError
      });
    }
  }
});
