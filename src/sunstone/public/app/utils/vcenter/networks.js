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
  // Dependencies
  var Locale = require("utils/locale");
  var OpenNebulaNetwork = require("opennebula/network");
  var OpenNebulaError = require("opennebula/error");
  var DomDataTable = require("utils/dom-datatable");
  var Notifier = require("utils/notifier");
  var UniqueId = require("utils/unique-id");
  var VCenterCommon = require("./vcenter-common");
  var Sunstone = require("sunstone");
  var Tips = require("utils/tips");

  var TemplateHTML = require("hbs!./common/html");
  var RowTemplate = require("hbs!./networks/row");
  var EmptyFieldsetHTML = require("hbs!./common/empty-fieldset");
  var FieldsetTableHTML = require("hbs!./common/fieldset-table");

  var path = "/vcenter/networks";
  var resource = "Networks";

  function VCenterNetworks() {
    return this;
  }

  VCenterNetworks.prototype = {
    "html": VCenterCommon.html,
    "insert": _fillVCenterNetworks,
    "import": _import
  };
  VCenterNetworks.prototype.constructor = VCenterNetworks;

  return VCenterNetworks;

  /*
    Retrieve the list of networks from vCenter and fill the container with them

    opts = {
      container: Jquery div to inject the html,
      selectedHost: Host selected for vCenter credentials
    }
   */
  function _fillVCenterNetworks(opts) {
    this.opts = opts;

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML());
    context.show();

    $.ajax({
      url: path,
      type: "GET",
      data: { host: opts.selectedHost, timeout: false },
      dataType: "json",
      success: function(response) {
        $(".vcenter_datacenter_list", context).html("");

        var vcenter_name = Object.keys(response)[0];
        response = response[vcenter_name];

        if (Object.keys(response).length === 0){
          content = EmptyFieldsetHTML({
            title : Locale.tr("vCenter Networks") + ": " + vcenter_name,
            message : Locale.tr("No new networks found")
          });
          $(".vcenter_datacenter_list", context).append(content);

        } else {
          var tableId = "vcenter_import_table_" + UniqueId.id();
          content = FieldsetTableHTML({
            tableId : tableId,
            title : Locale.tr("vCenter Networks") + ": " + vcenter_name,
            toggleAdvanced : true,
            columns : [
              "<input type=\"checkbox\" class=\"check_all\"/>",
              Locale.tr("Network"),
              ""
            ]
          });

          var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
          var tbody = $("#" + tableId + " tbody", context);

          $.each(response, function(network_name, element) {
            var importedClusters = [];
            var unimportedClusters = [];
            for (var i = 0; i < element.clusters.one_ids.length; i++){
              var cluster = {};
              cluster.name = element.clusters.names[i];
              cluster.id = element.clusters.one_ids[i];
              if (cluster.id === -1){
                unimportedClusters.push(cluster);
              } else {
                importedClusters.push(cluster);
              }
            }
            var opts = { data: element, importedClusters: importedClusters, unimportedClusters: unimportedClusters };
            var trow = $(RowTemplate(opts)).appendTo(tbody);

            Tips.setup(trow);

            $(".check_item", trow).data("import_data", element);
          });

          var elementsTable = new DomDataTable(
            tableId,
            {
              actions: false,
              info: false,
              dataTableOptions: {
                "bAutoWidth": false,
                "bSortClasses" : false,
                "bDeferRender": false,
                "aoColumnDefs": [
                  {"bSortable": false, "aTargets": [0, 2]},
                  {"sWidth": "35px", "aTargets": [0]},
                ],
              },
              "customTrListener": function(tableObj, tr){ return false; }
            });

          elementsTable.initialize();

          $("a.vcenter-table-select-all", context).text(Locale.tr("Select all %1$s Networks", Object.keys(response).length));

          VCenterCommon.setupTable({
            context : newdiv,
            allSelected : Locale.tr("All %1$s Networks selected."),
            selected: Locale.tr("%1$s Networks selected.")
          });

          context.off("click", ".clear_imported");
          context.on("click", ".clear_imported", function() {
            _fillVCenterNetworks(opts);
            return false;
          });

          setupAdvanced(context);
        }
      },
      error: function(response) {
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function setupAdvanced(context){
    context.off("change", ".type_select");
    context.on("change", ".type_select", function() {
      var row_context = $(this).closest(".vcenter_row");
      var type = $(this).val();

      var net_form_str = "";

      switch (type) {
        case "ether":
          net_form_str =
            "<div class=\"large-4 medium-6 columns end\">" +
              "<label>" + Locale.tr("MAC") +
                "<input type=\"text\" class=\"eth_mac_net\" placeholder=\"" + Locale.tr("Optional") + "\"/>" +
              "</label>" +
            "</div>";
          break;
        case "ip4":
          net_form_str =
            "<div class=\"large-4 medium-6 columns\">" +
              "<label>" + Locale.tr("IP Start") +
                "<input type=\"text\" class=\"four_ip_net\"/>" +
              "</label>" +
            "</div>" +
            "<div class=\"large-4 medium-6 columns end\">" +
              "<label>" + Locale.tr("MAC") +
                "<input type=\"text\" class=\"eth_mac_net\" placeholder=\"" + Locale.tr("Optional") + "\"/>" +
              "</label>" +
            "</div>";
          break;
        case "ip6":
          net_form_str =
            "<div class=\"large-6 medium-6 columns\">" +
              "<label>" + Locale.tr("Global Prefix") +
                "<input type=\"text\" class=\"six_global_net\" placeholder=\"" + Locale.tr("Optional") + "\"/>" +
              "</label>" +
            "</div>" +
            "<div class=\"large-4 medium-6 columns\">" +
              "<label>" + Locale.tr("MAC") +
                "<input type=\"text\" class=\"eth_mac_net\"/>" +
              "</label>" +
            "</div>" +
            "<div class=\"large-6 medium-6 columns end\">" +
              "<label>" + Locale.tr("ULA Prefix") +
                "<input type=\"text\" class=\"six_ula_net\" placeholder=\"" + Locale.tr("Optional") + "\"/>" +
              "</label>" +
            "</div>";
          break;
        case "ip6_static":
          net_form_str =
            "<div class=\"large-6 medium-6 columns end\">" +
              "<label>" + Locale.tr("IPv6 address") +
                "<input type=\"text\" class=\"six_static_net\"/>" +
              "</label>" +
            "</div>"+"<div class=\"large-4 medium-6 columns end\">" +
              "<label>" + Locale.tr("Prefix length") +
                "<input type=\"text\" class=\"six_prefix_net\"/>" +
              "</label>" +
            "</div>"+
            "<div class=\"large-6 medium-6 columns end\">" +
              "<label>" + Locale.tr("MAC") +
                "<input type=\"text\" class=\"eth_mac_net\" placeholder=\"" + Locale.tr("Optional") + "\"/>" +
              "</label>" +
            "</div>";
          break;
      }
      $(".net_options", row_context).html(net_form_str);
    });
  }

  function _import(context) {
    var vcenter_refs = [];
    var opts = {};

    var table = $("table.vcenter_import_table", context);

    $.each(table.DataTable().$(".check_item:checked"), function() {
      var row_context = $(this).closest("tr");
      VCenterCommon.importLoading({context : row_context});

      var ref = $(this).data("import_data").ref;
      vcenter_refs.push(ref);

      opts[ref] = {};

      opts[ref].size = $(".netsize", row_context).val();
      opts[ref].type = $(".type_select", row_context).val();

      switch (opts[ref].type) {
        case "ether":
          opts[ref].mac = $(".eth_mac_net", row_context).val();

          break;
        case "ip4":
          opts[ref].mac = $(".four_mac_net", row_context).val();
          opts[ref].ip = $(".four_ip_net", row_context).val();

          break;
        case "ip6":
          opts[ref].mac = $(".six_mac_net", row_context).val();
          opts[ref].global_prefix = $(".six_global_net", row_context).val();
          opts[ref].ula_prefix = $(".six_mac_net", row_context).val();

          break;
        case "ip6_static":
          opts[ref].mac = $(".six_mac_net", row_context).val();
          opts[ref].ip6 = $(".six_static_net", row_context).val();
          opts[ref].prefix_lenght = $(".six_prefix_net", row_context).val();

          break;
      }

      var clParams = [];
      $.each($("#vnet-clusters option:selected", row_context), function(){
        clParams.push($(this).val());
      });
      opts[ref].selected_clusters = clParams;
    });

    vcenter_refs = vcenter_refs.join(",");

    if (vcenter_refs.length === 0){
      Notifier.notifyMessage("You must select at least one network");
      return false;
    }

    $.ajax({
      url: path,
      type: "POST",
      data: {
        timeout: false,
        networks: vcenter_refs,
        opts: opts
      },
      dataType: "json",
      success: function(response){
        VCenterCommon.jGrowlSuccess({success : response.success, resource : resource, link_tab : "vnets-tab"});
        VCenterCommon.jGrowlFailure({error : response.error, resource : resource});

        $("#get-vcenter-networks").click();
      },
      error: function(request, error_json){
        if (request.responseJSON === undefined){
          Notifier.notifyError("Empty response received from server. Check your setup to avoid timeouts");
        } else {
          Notifier.notifyError(request.responseJSON.error.message);
        }
        $("#get-vcenter-networks").click();
      }
    });
  }
});
