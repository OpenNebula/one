define(function(require) {
  var zone_actions = {

    "Zone.create" : {
      type: "create",
      call: OpenNebula.Zone.create,
      callback: function(request, response) {
        $create_zone_dialog.foundation('reveal', 'close');
        $("form", $create_zone_dialog)[0].reset();

        Sunstone.runAction('Zone.list');
      },
      error: onError,
      notify: true
    },

    "Zone.create_dialog" : {
      type: "custom",
      call: popUpCreateZoneDialog
    },

    "Zone.list" : {
      type: "list",
      call: OpenNebula.Zone.list,
      callback: updateZonesView,
      error: onError
    },

    "Zone.show" : {
      type: "single",
      call: OpenNebula.Zone.show,
      callback: function(request, response) {
        var tab = dataTable_zones.parents(".tab");

        if (Sunstone.rightInfoVisible(tab)) {
          // individual view
          updateZoneInfo(request, response);
        }

        // datatable row
        updateZoneElement(request, response);
      },
      error: onError
    },

    "Zone.show_to_update" : {
      type: "single",
      call: OpenNebula.Zone.show,
      callback: fillPopPup,
      error: onError
    },

    "Zone.refresh" : {
      type: "custom",
      call: function() {
            var tab = dataTable_zones.parents(".tab");
            if (Sunstone.rightInfoVisible(tab)) {
              Sunstone.runAction("Zone.show", Sunstone.rightInfoResourceId(tab))
            } else {
              waitingNodes(dataTable_zones);
              Sunstone.runAction("Zone.list", {force: true});
            }
          },
      error: onError
    },

    "Zone.delete" : {
      type: "multiple",
      call : OpenNebula.Zone.del,
      callback : deleteZoneElement,
      elements: zoneElements,
      error : onError,
      notify:true
    },

    "Zone.update_template" : {  // Update template
      type: "single",
      call: OpenNebula.Zone.update,
      callback: function(request, response) {
        notifyMessage(tr("Zone updated correctly"));
        Sunstone.runAction('Zone.show', request.request.data[0][0]);
      },
      error: onError
    },

    "Zone.fetch_template" : {
      type: "single",
      call: OpenNebula.Zone.fetch_template,
      callback: function(request, response) {
        $('#template_update_dialog #template_update_textarea').val(response.template);
      },
      error: onError
    },

    "Zone.rename" : {
      type: "single",
      call: OpenNebula.Zone.rename,
      callback: function(request) {
        notifyMessage(tr("Zone renamed correctly"));
        Sunstone.runAction('Zone.show', request.request.data[0][0]);
      },
      error: onError,
      notify: true
    }
  };
})
