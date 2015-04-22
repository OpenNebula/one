define(function(require) {
  var OpenNebulaZone = require('opennebula/zone');
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var ZonesDataTable = require('./datatable');
  var Locale = require('utils/locale');

  var _zoneActions = {
    "Zone.create" : {
      type: "create",
      call: OpenNebulaZone.create,
      callback: function(request, response) {
        Sunstone.hideDialog('zones-tab', 'createZoneDialog');
        Sunstone.resetDialog('zones-tab', 'createZoneDialog');
        Sunstone.runAction('Zone.list');
      },
      error: Notifier.onError,
      notify: true
    },

    "Zone.create_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showDialog('zones-tab', 'createZoneDialog');
      }
    },

    "Zone.list" : {
      type: "list",
      call: OpenNebulaZone.list,
      callback: ZonesDataTable.updateZonesView,
      error: Notifier.onError
    },

    "Zone.show" : {
      type: "single",
      call: OpenNebulaZone.show,
      callback: function(request, response) {
        if (Sunstone.rightInfoVisible($('#zones-tab'))) {
          // individual view
          Sunstone.insertPanels('zones-tab', response);
        }

        // datatable row
        ZonesDataTable.updateZoneElement(request, response);
      },
      error: Notifier.onError
    },

    "Zone.show_to_update" : {
      type: "single",
      call: OpenNebulaZone.show,
      // TODO callback: fillPopPup,
      error: Notifier.onError
    },

    "Zone.refresh" : {
      type: "custom",
      call: function() {
            var tab = $("#zones-tab");
            if (Sunstone.rightInfoVisible(tab)) {
              Sunstone.runAction("Zone.show", Sunstone.rightInfoResourceId(tab))
            } else {
              ZonesDataTable.waitingNodes();
              Sunstone.runAction("Zone.list", {force: true});
            }
          },
      error: Notifier.onError
    },

    "Zone.delete" : {
      type: "multiple",
      call : OpenNebulaZone.del,
      callback : ZonesDataTable.deleteZoneElement,
      elements: ZonesDataTable.zoneElements,
      error : Notifier.onError,
      notify:true
    },

    "Zone.update_template" : {  // Update template
      type: "single",
      call: OpenNebulaZone.update,
      callback: function(request, response) {
        Notifier.notifyMessage(Locale.tr("Zone updated correctly"));
        Sunstone.runAction('Zone.show', request.request.data[0][0]);
      },
      error: Notifier.onError
    },

    "Zone.fetch_template" : {
      type: "single",
      call: OpenNebulaZone.fetch_template,
      callback: function(request, response) {
        $('#template_update_dialog #template_update_textarea').val(response.template);
      },
      error: Notifier.onError
    },

    "Zone.rename" : {
      type: "single",
      call: OpenNebulaZone.rename,
      callback: function(request) {
        Notifier.notifyMessage(Locale.tr("Zone renamed correctly"));
        Sunstone.runAction('Zone.show', request.request.data[0][0]);
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _zoneActions;
})
