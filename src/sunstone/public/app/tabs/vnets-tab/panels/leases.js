define(function(require) {
  /*
    DEPENDENCIES
   */
  
  var TemplateLeases = require('hbs!./leases/html');
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Utils = require('../utils/common');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./leases/panelId');
  var RESOURCE = "Network";
  var XML_ROOT = "VNET";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Leases");
    this.icon = "fa-list-ul";

    this.element = info[XML_ROOT];

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
    var arList = Utils.getARList(this.element);
    var processedLeases = [];

    for (var i=0; i<arList.length; i++){
      var ar = arList[i];
      var id = ar.AR_ID;

      var leases = ar.LEASES.LEASE;

      if (!leases) { //empty
        continue;
      } else if (leases.constructor != Array) { //>1 lease
        leases = [leases];
      }

      for (var j=0; j<leases.length; j++){
        var lease = leases[j];

        var col0HTML = "";
        var col1HTML = "";

        if (lease.VM == "-1") { //hold
          col0HTML = '<span type="text" class="alert radius label"></span>';
          
          if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
            col1HTML = '<a class="release_lease" href="#"><i class="fa fa-play"/></a>';
          }
        } else if (lease.VM != undefined) { //used by a VM
          col0HTML = '<span type="text" class="radius label "></span>';
          col1HTML = Locale.tr("VM:") + lease.VM;
        } else if (lease.VNET != undefined) { //used by a VNET
          col0HTML = '<span type="text" class="radius label "></span>';
          col1HTML = Locale.tr("NET:") + lease.VNET;
        } else {
          col0HTML = '<span type="text" class="radius label "></span>';
          col1HTML = '--';
        }

        processedLeases.push({
          "col0HTML"  : col0HTML,
          "col1HTML"  : col1HTML,
          "IP"        : (lease.IP ? lease.IP : "--"),
          "MAC"       : (lease.MAC ? lease.MAC : "--"),
          "IP6_LINK"  : (lease.IP6_LINK ? lease.IP6_LINK : "--"),
          "IP6_ULA"   : (lease.IP6_ULA ? lease.IP6_ULA : "--"),
          "IP6_GLOBAL": (lease.IP6_GLOBAL ? lease.IP6_GLOBAL : "--"),
          "AR_ID"     : id
        });
      }
    }

    return TemplateLeases({
      'element': this.element,
      'leases' : processedLeases
    });
  }

  function _setup(context) {
    var that = this;

    var leases_dataTable = $("#leases_datatable", context).dataTable({
      "bSortClasses" : false,
      "bDeferRender": true,
      // "sScrollX": "100%",
      "aoColumnDefs": [
        { "bSortable": false, "aTargets": [0,1] },
      ]
    });

    if (Config.isTabActionEnabled("vnets-tab", "Network.hold_lease")) {
      context.off("click", 'button#panel_hold_lease_button');
      context.on("click", 'button#panel_hold_lease_button', function(){
        // TODO: context for selector
        var lease = $('input#panel_hold_lease').val();

        if (lease.length){
            var obj = {ip: lease};
            Sunstone.runAction('Network.hold',that.element.ID,obj);
        }

        return false;
      });

      context.off("click", 'a.hold_lease');
      context.on("click", 'a.hold_lease', function(){
        var lease = $(this).parents('tr').attr('ip');
        var obj = { ip: lease};
        Sunstone.runAction('Network.hold',that.element.ID,obj);
        // TODO: spinner is a global var set in sunstone.js
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
      });
    }

    if (Config.isTabActionEnabled("vnets-tab", "Network.release_lease")) {
      context.off("click", 'a.release_lease');
      context.on("click", 'a.release_lease', function(){
        var lease = $(this).parents('tr').attr('ip');
        if (lease == "undefined"){
          lease = $(this).parents('tr').attr('mac');
        }

        var obj = { ip: lease};
        Sunstone.runAction('Network.release',that.element.ID,obj);
        // TODO: spinner is a global var set in sunstone.js
        //Set spinner
        $(this).parents('tr').html('<td class="key_td">'+spinner+'</td><td class="value_td"></td>');
        return false;
      });
    }

    return false;
  }
});
