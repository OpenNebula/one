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
  var OpenNebulaTemplate = require("opennebula/template");
  var OpenNebulaError = require("opennebula/error");
  var DomDataTable = require("utils/dom-datatable");
  var UserInputs = require("utils/user-inputs");
  var Notifier = require("utils/notifier");
  var UniqueId = require("utils/unique-id");
  var VCenterCommon = require("./vcenter-common");
  var Tips = require("utils/tips");

  var TemplateHTML = require("hbs!./common/html");
  var RowTemplate = require("hbs!./templates/row");
  var EmptyFieldsetHTML = require("hbs!./common/empty-fieldset");
  var FieldsetTableHTML = require("hbs!./common/fieldset-table");

  var path = "/vcenter/templates";
  var resource = "Template";

  function VCenterTemplates() {
    return this;
  }

  VCenterTemplates.prototype = {
    "html": VCenterCommon.html,
    "insert": _fillVCenterTemplates,
    "import": _import
  };
  VCenterTemplates.prototype.constructor = VCenterTemplates;

  return VCenterTemplates;

  /*
    Retrieve the list of templates from vCenter and fill the container with them

    opts = {
      container: Jquery div to inject the html,
      selectedHost: Host selected for vCenter credentials
    }
   */
  function _fillVCenterTemplates(opts) {
    var that = this;
    this.opts = opts;

    var context = $(".vcenter_import", opts.container);
    context.html(TemplateHTML());
    context.show();

    $.ajax({
      url: path,
      type: "GET",
      data: { host: opts.selectedHost, timeout: false },
      dataType: "json",
      success: function(response){
        $(".vcenter_datacenter_list", context).html("");

        var vcenter_name = Object.keys(response)[0];
        response = response[vcenter_name];

        if (Object.keys(response).length === 0){
          content = EmptyFieldsetHTML({
            title : Locale.tr("vCenter Templates") + ": " + vcenter_name,
            message : Locale.tr("No new templates found")
          });
          $(".vcenter_datacenter_list", context).append(content);

        } else {
          var tableId = "vcenter_import_table_" + UniqueId.id();
          content = FieldsetTableHTML({
            tableId : tableId,
            title : Locale.tr("vCenter Templates") + ": " + vcenter_name,
            toggleAdvanced : true,
            columns : [
              "<input type=\"checkbox\" class=\"check_all\"/>",
              Locale.tr("Template"),
              ""
            ]
          });

          var newdiv = $(content).appendTo($(".vcenter_datacenter_list", context));
          var tbody = $("#" + tableId + " tbody", context);

          $.each(response, function(template_name, element){
            var opts = {};
            opts.data = element;
            opts.id = UniqueId.id();
            if (element.rp && element.rp !== "") {
              opts.resourcePool = UserInputs.unmarshall(element.rp);
              opts.resourcePool.params = opts.resourcePool.params.split(",");
            }
            var trow = $(RowTemplate(opts)).appendTo(tbody);
            Tips.setup(trow);
            setupAdvanced(opts, trow);
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
                  { "sWidth": "35px", "aTargets": [0] },
                ],
              },
              "customTrListener": function(tableObj, tr){ return false; }
            });

          elementsTable.initialize();

          $("a.vcenter-table-select-all", context).text(Locale.tr("Select all %1$s Templates", Object.keys(response).length));

          VCenterCommon.setupTable({
            context : newdiv,
            allSelected : Locale.tr("All %1$s Templates selected."),
            selected: Locale.tr("%1$s Templates selected.")
          });

          context.off("click", ".clear_imported");
          context.on("click", ".clear_imported", function() {
            _fillVCenterDatastores(opts);
            return false;
          });
        }
      },
      error: function(response){
        context.hide();
        Notifier.onError({}, OpenNebulaError(response));
      }
    });
  }

  function setupAdvanced(opts, context){
    $(".modify_rp", context).change(function(){
      switch ($(this).val()){
        case "default":
          $("#div_rp_" + opts.id).hide();
          break;
        case "fixed":
          $("#div_rp_" + opts.id).show();
          $(".available_rps", context).attr("multiple", false);
          break;
        case "list":
          $("#div_rp_" + opts.id).show();
          $(".available_rps", context).attr("multiple", true);
      }
    });

    $(".linked_clone", context).change(function(){
      if ($(this).is(":checked")){
        $(".div_create", context).show();
      } else {
        $(".div_create", context).hide();
        $(".create_copy", context).prop("checked", false);
        $("#name_" + opts.id, context).hide();
      }
    });

    $(".create_copy", context).change(function(){
      var name_input = $("#name_" + opts.id, context);
      if ($(this).is(":checked")){
        name_input.show();
      } else {
        name_input.hide();
      }
    });
  }

  function _import(context) {
    var vcenter_refs = [];
    var opts = {};

    var table = $("table.vcenter_import_table", context);
    $.each(table.DataTable().$(".check_item:checked"), function(){
      var row_context = $(this).closest("tr");
      VCenterCommon.importLoading({context : row_context});

      var ref = $(this).data("import_data").ref;
      vcenter_refs.push(ref);

      opts[ref] = {};

      opts[ref].type = ($(".modify_rp", row_context).val() ? $(".modify_rp", row_context).val() : "default");

      var rpInput = $(".vcenter_rp_input", row_context);
      var rpParams = [];
      $.each($(".available_rps option:selected", rpInput), function(){
        rpParams.push($(this).val());
      });
      opts[ref].resourcepool = rpParams;

      if ($(".linked_clone", row_context).is(":checked")){
        opts[ref].linked_clone = 1;
      } else {
        opts[ref].linked_clone = 0;
      }

      if ($(".create_copy", row_context).is(":checked")){
        opts[ref].copy = 1;
      } else {
        opts[ref].copy = 0;
      }

      opts[ref].name = $(".template_name", row_context).val();

      opts[ref].folder = $(".folder", row_context).val();
    });

    vcenter_refs = vcenter_refs.join(",");

    if (vcenter_refs.length === 0){
      Notifier.notifyMessage("You must select at least one template");
      return false;
    }

    $.ajax({
      url: path,
      type: "POST",
      data: {
        timeout: false,
        templates: vcenter_refs,
        opts: opts
      },
      dataType: "json",
      success: function(response){
        VCenterCommon.jGrowlSuccess({success : response.success, resource : resource, link_tab : "templates-tab"});
        VCenterCommon.jGrowlFailure({error : response.error, resource : resource});

        $("#get-vcenter-templates").click();
      },
      error: function(request, error_json){
        if (request.responseJSON === undefined){
          Notifier.notifyError("Empty response received from server. Check your setup to avoid timeouts");
        } else {
          Notifier.notifyError(request.responseJSON.error.message);
        }
        $("#get-vcenter-templates").click();
      }
    });
  }
});
