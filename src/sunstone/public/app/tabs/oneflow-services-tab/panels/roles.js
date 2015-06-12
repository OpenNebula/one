define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var OpenNebulaRole = require('opennebula/role');
  var roles_buttons = require('./roles/roles-buttons');
  var Sunstone = require('sunstone');
  var RolesDataTable = require('./roles/roles-datatable');

  /*
    TEMPLATES
   */
  
  var TemplateHTML = require('hbs!./roles/html');
  var TemplateRoleInfo = require('hbs!./roles/roleInfo');

  /*
    CONSTANTS
   */
  
  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./roles/panelId');
  var XML_ROOT = "DOCUMENT";
  var RESOURCE = "Service";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Roles");
    this.icon = "fa-wrench";

    this.element = info[XML_ROOT];

    this.selected_row_role_id = undefined;

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.roleHTML = _roleHTML;
  Panel.prototype.roleSetup = _roleSetup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var roleList = [];

    var roles = this.element.TEMPLATE.BODY.roles;
    if (roles && roles.length) {
      $.each(roles, function(){
        roleList.push(
          {
            'name': this.name,
            'state': OpenNebulaRole.state(this.state),
            'cardinality': this.cardinality,
            'vm_template': this.vm_template,
            'parents': this.parents ? this.parents.join(', ') : '-'
          });
      });
    }

    return TemplateHTML({
      'element': this.element,
      'roleList': roleList
    });
  }

  function _setup(context) {
    var that = this;

    Tips.setup(context);

    that.last_selected_row_role = undefined;

    var roles = this.element.TEMPLATE.BODY.roles;
    if (roles && roles.length) {
      this.servicerolesDataTable = new RolesDataTable(
        'datatable_service_roles',
        {
          actions: true,
          info: false,
          oneSelection: true,
          customTabContext: $('#role_actions', context),
          customTrListener: function(tableObj, tr){
            var aData = tableObj.dataTable.fnGetData(tr);
            var role_name = $(aData[0]).val();

            var role_index = tableObj.dataTable.fnGetPosition(tr);

            $("#roles_extended_info", context).html(that.roleHTML(role_index));
            that.roleSetup($("#roles_extended_info", context), role_index);

            // The info listener is triggered instead of
            // the row selection. So we click the check input to select
            // the row also
            var check = $('.check_item', tr);
            if (!check.is(":checked")) {
              check.trigger('click');
            }
          }
        });

      this.servicerolesDataTable.initialize();

      Sunstone.insertButtonsInTab("oneflow-services", "service_roles_tab", roles_buttons, $('#role_actions', context));

      // TODO
      //setupScaleDialog();

      // TODO: global var, see Service.refresh
      /*
      if(selected_row_role_id) {
        $.each($(this.servicerolesDataTable.dataTable.fnGetNodes()),function(){
          if($($('td',this)[1]).html()==selected_row_role_id) {
            $('td',this)[2].click();
          }
        });
      }

      if(checked_row_rolevm_ids.length!=0) {
        $.each($(serviceroleVMsDataTable.fnGetNodes()),function(){
          var current_id = $($('td',this)[1]).html();
          if (current_id) {
            if(jQuery.inArray(current_id, checked_row_rolevm_ids)!=-1) {
              $('input.check_item',this).first().click();
              $('td',this).addClass('markrowchecked');
            }
          }
        });
      }
      //*/
    }
  }


  function _roleHTML(role_index) {
    var role = this.element.TEMPLATE.BODY.roles[role_index];

    // TODO: role VMs table

    return TemplateRoleInfo({
      'role': role,
      'vmsTableHTML': "<p>TODO</p>"
    });
  }

  function _roleSetup(context, role_index) {
    Tips.setup(context);
  }
});
