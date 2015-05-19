define(function(require) {
  /*
    DEPENDENCIES
   */
  
  require('foundation-datatables');
  var Locale = require('utils/locale');
  var CanImportWilds = require('../utils/can-import-wilds');

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

    // Do not create an instance of this panel if the Wilds cannot be imported
    if (!CanImportWilds(this.element)) {
      throw "Panel not available for this element";
    }

    return this;
  };

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
    that.dataTableWildHosts = $("#datatable_host_wilds", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true
    });

    var wilds_list_array = [];

    if (that.element.TEMPLATE.VM) {
      wilds = that.element.TEMPLATE.VM;

      $.each(wilds, function() {
        name      = this.VM_NAME;
        safe_name = name.replace(/ /g, "_").replace(/\./g, "_");
        deploy_id = this.DEPLOY_ID;

        wilds_list_array.push([
            '<input type="checkbox" id="import_wild_checker" class="import_' + safe_name + '" unchecked/>',
            name,
            deploy_id
        ]);

        that.dataTableWildHosts.fnAddData(wilds_list_array);

        $(".import_" + safe_name, that.dataTableWildHosts).data("wild_template", atob(this.IMPORT_TEMPLATE));
        $(".import_" + safe_name, that.dataTableWildHosts).data("host_id", that.element.ID);

        wilds_list_array = [];
      });
    }

    delete that.element.TEMPLATE.WILDS;
    delete that.element.TEMPLATE.VM;

    // Add event listener for importing WILDS
    /* TODO Use only 1 action -----  
    context.off("click", '#import_wilds');
    context.on("click", '#import_wilds', function () {
      $("#import_wild_checker:checked", "#datatable_host_wilds").each(function() {
        var vm_json = {
          "vm": {
            "vm_raw": $(this).data("wild_template")
          }
        };

        var import_host_id = $(this).data("host_id");
        var wild_row       = $(this).closest('tr');

        // Create the VM in OpenNebula
        OpenNebula.VM.create({
          timeout: true,
          data: vm_json,
          success: function(request, response) {
            //TODO OpenNebula.Helper.clear_cache("VM");

            var extra_info = {};

            extra_info['host_id'] = import_host_id;
            extra_info['ds_id']   = -1;
            extra_info['enforce'] = false;

            // Deploy the VM
            Sunstone.runAction("VM.silent_deploy_action", 
                               response.VM.ID, 
                               extra_info);

            // Notify
            notifyCustom(tr("VM imported"), " ID: " + response.VM.ID, false);

            // Delete row (shouldn't be there in next monitorization)
            dataTable_wilds_hosts = $("#datatable_host_wilds").dataTable();
            dataTable_wilds_hosts.fnDeleteRow(wild_row);
          },
          error: function (request, error_json) {
            notifyError(error_json.error.message || tr("Cannot contact server: is it running and reachable?"));
          }
        });
      })
    });*/
    return false;
  }
})
