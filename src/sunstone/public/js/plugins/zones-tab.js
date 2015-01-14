/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

/* ---------------- Zone tab plugin ---------------- */


//Prepares the dialog to create
function setupCreateZoneDialog(){
    if ($('#create_zone_dialog').length == 0) {
        dialogs_context.append('<div title=\"'+tr("Create zone")+'\" id="create_zone_dialog"></div>');
    }

    $create_zone_dialog = $('#create_zone_dialog',dialogs_context);
    var dialog = $create_zone_dialog;

    dialog.html(create_zone_tmpl);
    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('#create_zone_form',dialog).submit(function(){
        var name=$('#zonename',this).val();
        var endpoint=$("#endpoint",this).val();
        var zone_json = { "zone" : { "name" : name, "endpoint" : endpoint}};
        Sunstone.runAction("Zone.create",zone_json);
        return false;
    });

}

function popUpCreateZoneDialog(){
    $create_zone_dialog.foundation().foundation('reveal', 'open');
    $("input#name",$create_zone_dialog).focus();
    return false;
}


// Open update dialog
//function popUpUpdateZoneDialog(){
    // TODO
//}

var create_zone_tmpl =
'<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_zone_header" class="subheader">'+tr("Create Zone")+'</h3>\
  </div>\
</div>\
<form id="create_zone_form" action="">\
  <div class="row">\
    <div class="large-12 columns">\
      <label for="zonename">'+tr("Zone Name")+':</label>\
      <input type="text" name="zonename" id="zonename" />\
    </div>\
  </div>\
  <div class="row centered">\
    <div class="large-12 columns">\
      <label for="endpoint">'+tr("Endpoint")+':</label>\
      <input type="text" name="endpoint" id="endpoint" />\
    </div>\
  </div>\
  <div class="form_buttons">\
      <button class="button radius right success" id="create_zone_submit" value="zone/create">'+tr("Create")+'</button>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';

var dataTable_zones;
var $create_zone_dialog;

//Setup actions
var zone_actions = {

    "Zone.create" : {
        type: "create",
        call: OpenNebula.Zone.create,
        callback: function(request, response){
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
        callback: function(request, response){
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
        call: function(){
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
        callback: function(request,response){
           notifyMessage(tr("Zone updated correctly"));
           Sunstone.runAction('Zone.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Zone.fetch_template" : {
        type: "single",
        call: OpenNebula.Zone.fetch_template,
        callback: function(request,response){
            $('#template_update_dialog #template_update_textarea').val(response.template);
        },
        error: onError
    },


    "Zone.rename" : {
        type: "single",
        call: OpenNebula.Zone.rename,
        callback: function(request) {
            notifyMessage(tr("Zone renamed correctly"));
            Sunstone.runAction('Zone.show',request.request.data[0][0]);
        },
        error: onError,
        notify: true
    }
};

var zone_buttons = {
    "Zone.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },
    "Zone.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
 //   "Zone.update_dialog" : {
 //       type : "action",
 //       layout: "main",
 //       text : tr("Update"),
 //       alwaysActive: true
 //   },
    "Zone.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
};

var zones_tab = {
    title: tr("Zones"),
    resource: 'Zone',
    buttons: zone_buttons,
    tabClass: "subTab",
    parentTab: "infra-tab",
    search_input: '<input id="zone_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-files-o"></i>&emsp;'+tr("Zones"),
    info_header: '<i class="fa fa-fw fa-files-o"></i>&emsp;'+tr("Zone"),
    subheader: '<span/> <small></small>&emsp;',
    table: '<table id="datatable_zones" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>' + tr("ID") + '</th>\
          <th>' + tr("Name") + '</th>\
          <th>' + tr("Endpoint") + '</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyzones">\
      </tbody>\
    </table>'
};

var zone_info_panel = {
    "zone_info_tab" : {
        title: tr("Zone information"),
        content:""
    }
};

Sunstone.addActions(zone_actions);
Sunstone.addMainTab('zones-tab',zones_tab);
Sunstone.addInfoPanel("zone_info_panel",zone_info_panel);

//return lists of selected elements in zone list
function zoneElements(){
    return getSelectedNodes(dataTable_zones);
}

function zoneElementArray(element_json){

    var element = element_json.ZONE;

    return [
        '<input class="check_item" type="checkbox" id="zone_'+element.ID+'" name="selected_items" value="'+element.ID+'"/>',
        element.ID,
        element.NAME,
        element.TEMPLATE.ENDPOINT
    ];
}

//callback for an action affecting a zone element
function updateZoneElement(request, element_json){
    var id = element_json.ZONE.ID;
    var element = zoneElementArray(element_json);
    updateSingleElement(element,dataTable_zones,'#zone_'+id);
}

//callback for actions deleting a zone element
function deleteZoneElement(req){
    deleteElement(dataTable_zones,'#zone_'+req.request.data);
    $('div#zone_tab_'+req.request.data,main_tabs_context).remove();
}

//call back for actions creating a zone element
function addZoneElement(request,element_json){
    var id = element_json.ZONE.ID;
    var element = zoneElementArray(element_json);
    addElement(element,dataTable_zones);
}

//callback to update the list of zones.
function updateZonesView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the list
        list_array.push(zoneElementArray(this));
    });

    updateView(list_array,dataTable_zones);
};


// Updates the zone info panel tab content and pops it up
function updateZoneInfo(request,zone){
    zone_info     = zone.ZONE;
    zone_template = zone_info.TEMPLATE;

    $(".resource-info-header", $("#zones-tab")).html(zone_info.NAME);

    //Information tab
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_zone_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">' + tr("Information") +'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td" colspan="2">'+zone_info.ID+'</td>\
            </tr>'+
            insert_rename_tr(
                'zones-tab',
                "Zone",
                zone_info.ID,
                zone_info.NAME)+
            '</tbody>\
         </table>\
        </div>\
        <div class="large-6 columns">\
        </div>\
        </div>\
        <div class="row">\
          <div class="large-9 columns">'
                  + insert_extended_template_table(zone_template,
                                           "Zone",
                                           zone_info.ID,
                                           "Attributes") +
         '</div>\
        </div>'
    }

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_info_tab",info_tab);

    Sunstone.popUpInfoPanel("zone_info_panel", "zones-tab");
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the zone datatable, preload it
//and add specific listeners
$(document).ready(function(){
    var tab_name = "zones-tab"

    if (Config.isTabEnabled(tab_name)) {
      //prepare zone datatable
      dataTable_zones = $("#datatable_zones",main_tabs_context).dataTable({
          "bSortClasses": false,
          "bDeferRender": true,
          "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#zone_search').keyup(function(){
        dataTable_zones.fnFilter( $(this).val() );
      })

      dataTable_zones.on('draw', function(){
        recountCheckboxes(dataTable_zones);
      })

      Sunstone.runAction("Zone.list");
      setupCreateZoneDialog();

      dialogs_context.append('<div title=\"'+tr("Create zone")+'\" id="create_zone_dialog"></div>');

      initCheckAllBoxes(dataTable_zones);
      tableCheckboxesListener(dataTable_zones);
      infoListener(dataTable_zones, "Zone.show");
      dataTable_zones.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
