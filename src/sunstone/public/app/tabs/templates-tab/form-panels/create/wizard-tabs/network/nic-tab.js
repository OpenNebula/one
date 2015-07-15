define(function(require) {
  /*
    DEPENDENCIES
   */

  var Config = require('sunstone-config');
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var VNetsTable = require('tabs/vnets-tab/datatable');
  var SecgroupsTable = require('tabs/secgroups-tab/datatable');
  var WizardFields = require('utils/wizard-fields');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./nic-tab/html');

  /*
    CONSTANTS
   */

  /*
    CONSTRUCTOR
   */

  function DiskTab(nicTabId) {
    this.nicTabId = 'nicTab' + nicTabId;

    this.vnetsTable = new VNetsTable(this.nicTabId + 'Table', {'select': true});

    var secgroupSelectOptions = {
      'select': true,
      'selectOptions': {
        "multiple_choice": true
      }
    }
    this.secgroupsTable = new SecgroupsTable(this.nicTabId + 'SGTable', secgroupSelectOptions);
  }

  DiskTab.prototype.constructor = DiskTab;
  DiskTab.prototype.html = _html;
  DiskTab.prototype.setup = _setup;
  DiskTab.prototype.onShow = _onShow;
  DiskTab.prototype.retrieve = _retrieve;
  DiskTab.prototype.fill = _fill;

  return DiskTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'nicTabId': this.nicTabId,
      'vnetsTableSelectHTML': this.vnetsTable.dataTableHTML,
      'secgroupsTableSelectHTML': this.secgroupsTable.dataTableHTML
    });
  }

  function _onShow(context, panelForm) {
    this.vnetsTable.refreshResourceTableSelect();
  }

  function _setup(context) {
    var that = this;
    context.foundation('tooltip', 'reflow');
    that.vnetsTable.initialize({
      'selectOptions': {
        'select_callback': function(aData, options) {
          // If the net is selected by Id, avoid overwriting it with name+uname
          if ($('#NETWORK_ID', context).val() != aData[options.id_index]) {
            $('#NETWORK_ID', context).val("");
            $('#NETWORK', context).val(aData[options.name_index]);
            $('#NETWORK_UNAME', context).val(aData[options.uname_index]);
            $('#NETWORK_UID', context).val("");
          }
        }
      }
    });
    that.vnetsTable.refreshResourceTableSelect();

    that.secgroupsTable.initialize();
    that.secgroupsTable.refreshResourceTableSelect();
  }

  function _retrieve(context) {
    var nicJSON = WizardFields.retrieve(context);

    var tcp = $("input.tcp_type:checked", context).val();
    if (tcp) {
      nicJSON[tcp] = $("#TCP_PORTS", context).val();
    }

    var udp = $("input.udp_type:checked", context).val();
    if (udp) {
      nicJSON[udp] = $("#UDP_PORTS", context).val();
    }

    if ($("#icmp_type", context).is(":checked")) {
      nicJSON["ICMP"] = "drop"
    }

    var secgroups = this.secgroupsTable.retrieveResourceTableSelect();
    if (secgroups != undefined && secgroups.length != 0) {
      nicJSON["SECURITY_GROUPS"] = secgroups.join(",");
    }

    return nicJSON;
  }

  function _fill(context, templateJSON) {
    if (templateJSON.NETWORK_ID != undefined) {
      var selectedResources = {
          ids : templateJSON.NETWORK_ID
        }

      this.vnetsTable.selectResourceTableSelect(selectedResources);
    } else if (templateJSON.NETWORK != undefined && templateJSON.NETWORK_UNAME != undefined) {
      var selectedResources = {
          names : {
            name: templateJSON.NETWORK,
            uname: templateJSON.NETWORK_UNAME
          }
        }

      this.vnetsTable.selectResourceTableSelect(selectedResources);
    }

    if (templateJSON["WHITE_PORTS_TCP"]) {
      var field = $("input.tcp_type[value='WHITE_PORTS_TCP']", context);
      field.click();

      $("#TCP_PORTS", context).val(templateJSON["WHITE_PORTS_TCP"]);
    } else if (templateJSON["BLACK_PORTS_TCP"]) {
      var field = $("input.tcp_type[value='BLACK_PORTS_TCP']", context);
      field.click();

      $("#TCP_PORTS", context).val(templateJSON["BLACK_PORTS_TCP"]);
    }

    if (templateJSON["WHITE_PORTS_UDP"]) {
      var field = $("input.udp_type[value='WHITE_PORTS_UDP']", context);
      field.click();

      $("#UDP_PORTS", context).val(templateJSON["WHITE_PORTS_UDP"]);
    } else if (templateJSON["BLACK_PORTS_UDP"]) {
      var field = $("input.udp_type[value='BLACK_PORTS_UDP']", context);
      field.click();

      $("#UDP_PORTS", context).val(templateJSON["BLACK_PORTS_UDP"]);
    }

    if (templateJSON["ICMP"]) {
      var field = $("#icmp_type", context);
      $("#icmp_type", context).attr('checked', 'checked');
    }

    if (templateJSON["SECURITY_GROUPS"] != undefined &&
        templateJSON["SECURITY_GROUPS"].length != 0) {

      var selectedResources = {ids: templateJSON["SECURITY_GROUPS"].split(",")};
      this.secgroupsTable.selectResourceTableSelect(selectedResources);
    } else {
      this.secgroupsTable.refreshResourceTableSelect();
    }

    WizardFields.fill(context, templateJSON);
  }
});
