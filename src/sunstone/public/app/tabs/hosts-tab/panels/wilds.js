define(function(require) {
  /*
    DEPENDENCIES
   */

  require('foundation-datatables');
  var Locale = require('utils/locale');
  var CanImportWilds = require('../utils/can-import-wilds');
  var OpenNebulaVM = require('opennebula/vm');
  var OpenNebulaAction = require('opennebula/action');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');

  /*
    TEMPLATES
   */

  var TemplateWilds = require('hbs!./wilds/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./wilds/panelId');
  var RESOURCE = "Host"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Wilds");
    this.icon = "fa-hdd-o";

    this.element = info[RESOURCE.toUpperCase()];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateWilds();
  }

  function _setup(context) {
    var that = this;

    // Hide the import button if the Wilds cannot be imported
    if (!CanImportWilds(this.element)) {
      $("#import_wilds").hide();
    }

    that.dataTableWildHosts = $("#datatable_host_wilds", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      "aoColumnDefs": [
          {"bSortable": false, "aTargets": [0]},
          {"sWidth": "35px", "aTargets": [0]}
      ]
    });

    if (that.element.TEMPLATE.VM) {
      wilds = that.element.TEMPLATE.VM;

      if (!$.isArray(wilds)) { // If only 1 VM convert to array
        wilds = [wilds];
      }

      i = 0;

      $.each(wilds, function() {
        var name      = this.VM_NAME;
        var safe_name = i;
        i += 1;
        var deploy_id = this.DEPLOY_ID;

        var wilds_list_array = [
          [
            '<input type="checkbox" class="import_wild_checker import_' + safe_name + '" unchecked/>',
            name,
            deploy_id
          ]
        ];

        that.dataTableWildHosts.fnAddData(wilds_list_array);

        $(".import_" + safe_name, that.dataTableWildHosts).data("wild_template", atob(this.IMPORT_TEMPLATE));
      });
    }

    delete that.element.TEMPLATE.WILDS;
    delete that.element.TEMPLATE.VM;

    // Enable the import button when at least a VM is selected
    $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });

    $(".import_wild_checker", context).off("change");
    $(".import_wild_checker", context).on("change", function(){
      if ($(".import_wild_checker:checked", context).length == 0){
        $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });
      } else {
        $("#import_wilds", context).removeAttr("disabled").off("click.disable");
      }
    });

    // Add event listener for importing WILDS
    context.off("click", '#import_wilds');
    context.on("click", '#import_wilds', function () {
      $("#import_wilds", context).attr("disabled", "disabled").on("click.disable", function(e) { return false; });
      $("#import_wilds", context).html('<i class="fa fa-spinner fa-spin"></i>');

      $(".import_wild_checker:checked", "#datatable_host_wilds").each(function() {
        var vm_json = {
          "vm": {
            "vm_raw": $(this).data("wild_template")
          }
        };

        var import_host_id = that.element.ID;
        var wild_row       = $(this).closest('tr');

        // Create the VM in OpenNebula
        OpenNebulaVM.create({
          timeout: true,
          data: vm_json,
          success: function(request, response) {
            OpenNebulaAction.clear_cache("VM");

            var extra_info = {};

            extra_info['host_id'] = import_host_id;
            extra_info['ds_id']   = -1;
            extra_info['enforce'] = false;

            // Deploy the VM
            Sunstone.runAction("VM.silent_deploy_action",
                               response.VM.ID,
                               extra_info);

            // Notify
            Notifier.notifyCustom(Locale.tr("VM imported"), " ID: " + response.VM.ID, false);

            // Delete row (shouldn't be there in next monitorization)
            that.dataTableWildHosts.fnDeleteRow(wild_row);

            $("#import_wilds", context).removeAttr("disabled").off("click.disable");
            $("#import_wilds", context).html(Locale.tr("Import Wilds"));
          },
          error: function (request, error_json) {
            var msg;
            if (error_json.error.message){
              msg = error_json.error.message;
            } else {
              msg = Locale.tr("Cannot contact server: is it running and reachable?");
            }

            Notifier.notifyError(msg);

            $("#import_wilds", context).removeAttr("disabled").off("click.disable");
            $("#import_wilds", context).html(Locale.tr("Import Wilds"));
          }
        });
      });
    });

    return false;
  }
});