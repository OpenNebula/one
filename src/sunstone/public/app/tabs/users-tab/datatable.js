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

  /*
    CONSTANTS
   */

  var RESOURCE = "User";
  var XML_ROOT = "USER";
  var TAB_NAME = require('./tabId');

  /*
    CONSTRUCTOR
   */

  function Table(dataTableId, conf) {
    this.conf = conf || {};
    this.tabId = TAB_NAME;
    this.dataTableId = dataTableId;
    this.resource = RESOURCE;
    this.xmlRoot = XML_ROOT;

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
      Locale.tr("Hidden User Data")
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

    TabDataTable.call(this);
  }

  Table.prototype = Object.create(TabDataTable.prototype);
  Table.prototype.constructor = Table;
  Table.prototype.elementArray = _elementArray;
  Table.prototype.preUpdateView = _preUpdateView;
  Table.prototype.postUpdateView = _postUpdateView;

  return Table;

  /*
    FUNCTION DEFINITIONS
   */

  function _elementArray(element_json) {
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

    return [
      '<input class="check_item" type="checkbox" id="'+RESOURCE.toLowerCase()+'_' +
                           element.ID + '" name="selected_items" value="' +
                           element.ID + '"/>',
      element.ID,
      element.NAME,
      element.GNAME,
      element.AUTH_DRIVER,
      vms,
      memory,
      cpu,
      element.GID,
      hidden_template
    ];
  }

  function _preUpdateView() {
    this.totalUsers = 0;
  }

  function _postUpdateView() {
    $(".total_users").text(this.totalUsers);
  }
});
