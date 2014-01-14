/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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
    // TODO

    dialogs_context.append('<div title=\"'+tr("Create zone")+'\" id="create_zone_dialog"></div>');
    $create_zone_dialog = $('#create_zone_dialog',dialogs_context);
    var dialog = $create_zone_dialog;

    dialog.html(create_zone_tmpl);
    dialog.addClass("reveal-modal");

    $('#create_zone_form',dialog).submit(function(){
        var name=$('#zonename',this).val();
        var endpoint=$("#endpoint",this).val();
        var zone_json = { "zone" : { "name" : name, "endpoint" : endpoint}};
        Sunstone.runAction("Zone.create",zone_json);
        $create_zone_dialog.trigger("reveal:close");
        return false;
    });

}

function popUpCreateZoneDialog(){
    $create_zone_dialog.reveal();
    $("input#name",$create_zone_dialog).focus();
    return false;
}


// Open update dialog
//function popUpUpdateZoneDialog(){
    // TODO
//}

var create_zone_tmpl =
'<div class="panel">\
  <h3>\
    <small id="create_zone_header">'+tr("Create Zone")+'</small>\
  </h3>\
</div>\
<form id="create_zone_form" action="">\
    <div class="row centered">\
      <div class="four columns">\
        <label class="inline right" for="zonename">'+tr("Zone Name")+':</label>\
      </div>\
      <div class="seven columns">\
        <input type="text" name="zonename" id="zonename" />\
      </div>\
      <div class="one columns">\
        <div class=""></div>\
      </div>\
    </div>\
    <div class="row centered">\
      <div class="four columns">\
        <label class="inline right" for="endpoint">'+tr("Endpoint")+':</label>\
      </div>\
      <div class="seven columns">\
        <input type="text" name="endpoint" id="endpoint" />\
      </div>\
      <div class="one columns">\
        <div class=""></div>\
      </div>\
    </div>\
    <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="create_zone_submit" value="zone/create">'+tr("Create")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
      <a class="close-reveal-modal">&#215;</a>\
</form>';


var zones_tab_content = '\
<form class="custom" id="form_cluters" action="">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-copy"></i> '+tr("Zones")+'\
      </span>\
      <span class="header-info">\
        <span/> <small></small>&emsp;\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
<div class="row">\
  <div class="ten columns">\
    <div class="action_blocks">\
    </div>\
  </div>\
  <div class="two columns">\
    <input id="zone_search" type="text" placeholder="'+tr("Search")+'" />\
  </div>\
</div>\
</div>\
  <div class="row">\
    <div class="twelve columns">\
<table id="datatable_zones" class="datatable twelve">\
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
</table>\
</form>';

var zones_select="";
var dataTable_zones;
var $create_zone_dialog;

// TODO: Some methods are not yet implemented in oned (eg, rename)

//Setup actions
var zone_actions = {

    "Zone.create" : {
        type: "create",
        call: OpenNebula.Zone.create,
        callback: function(request, response){
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
        callback: updateZoneElement,
        error: onError
    },

    "Zone.showinfo" : {
        type: "single",
        call: OpenNebula.Zone.show,
        callback: updateZoneInfo,
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
            waitingNodes(dataTable_zones);
            Sunstone.runAction("Zone.list");
        },
        error: onError
    },

    "Zone.autorefresh" : {
        type: "custom",
        call : function() {
            OpenNebula.Zone.list({timeout: true, success: updateZonesView,error: onError});
        }
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
           Sunstone.runAction('Zone.showinfo',request.request.data[0][0]);
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

 //   "Zone.update_dialog" : {
 //       type: "single",
 //       call: popUpUpdateZoneDialog
 //   },

    "Zone.rename" : {
        type: "single",
        call: OpenNebula.Zone.rename,
        callback: function(request) {
            notifyMessage(tr("Zone renamed correctly"));
            Sunstone.runAction('Zone.showinfo',request.request.data[0]);
            Sunstone.runAction('Zone.list');
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
    content: zones_tab_content,
    buttons: zone_buttons,
    showOnTopMenu: false,
    tabClass: "subTab",
    parentTab: "infra-tab"
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


//updates the zone select by refreshing the options in it
function updateZoneSelect(){
    zones_select = '<option value="-1">Default (none)</option>';
    zones_select += makeSelectOptions(dataTable_zones,
                                         1,//id_col
                                         2,//name_col
                                         3,//endpoint_col
                                         [],//status_cols
                                         [],//bad_st
                                         true
                                        );
}

//callback for an action affecting a zone element
function updateZoneElement(request, element_json){
    var id = element_json.ZONE.ID;
    var element = zoneElementArray(element_json);
    updateSingleElement(element,dataTable_zones,'#zone_'+id);
    updateZoneSelect();
}

//callback for actions deleting a zone element
function deleteZoneElement(req){
    deleteElement(dataTable_zones,'#zone_'+req.request.data);
    $('div#zone_tab_'+req.request.data,main_tabs_context).remove();
    updateZoneSelect();
}

//call back for actions creating a zone element
function addZoneElement(request,element_json){
    var id = element_json.ZONE.ID;
    var element = zoneElementArray(element_json);
    addElement(element,dataTable_zones);
    updateZoneSelect();
}

//callback to update the list of zones.
function updateZonesView (request,list){
    var list_array = [];

    $.each(list,function(){
        //Grab table data from the list
        list_array.push(zoneElementArray(this));
    });

    updateView(list_array,dataTable_zones);
    updateZoneSelect();
};


// Updates the zone info panel tab content and pops it up
function updateZoneInfo(request,zone){
    zone_info     = zone.ZONE;
    zone_template = zone_info.TEMPLATE;

    //Information tab
    var info_tab = {
        title : tr("Information"),
        content :
        '<form class="custom"><div class="">\
        <div class="six columns">\
        <table id="info_zone_table" class="twelve datatable extended_table">\
            <thead>\
               <tr><th colspan="3">' +
                        tr("Zone") +
                        ' - '+zone_info.NAME+'</th></tr>\
            </thead>\
            <tbody>\
            <tr>\
                <td class="key_td">' + tr("id") + '</td>\
                <td class="value_td" colspan="2">'+zone_info.ID+'</td>\
            </tr>\
            <tr>\
                <td class="key_td">'+tr("Name")+'</td>\
                <td class="value_td_rename">'+zone_info.NAME+'</td>\
                <td><div id="div_edit_rename">\
                   <a id="div_edit_rename_link" class="edit_e" href="#"><i class="icon-edit right"/></a>\
                </div>\
                </td>\
            </tr>\
            </tbody>\
         </table>\
        </div>\
        <div class="six columns">'
                + insert_extended_template_table(zone_template,
                                         "Zone",
                                         zone_info.ID,
                                         "Tags") +
         '</div>\
        </div></form>'
    }

    $("#div_edit_rename_link").die();
    $(".input_edit_value_rename").die();

    // Listener for edit link for rename
    $("#div_edit_rename_link").live("click", function() {
        var value_str = $(".value_td_rename").text();
        $(".value_td_rename").html('<input class="input_edit_value_rename" id="input_edit_rename" type="text" value="'+value_str+'"/>');
    });

    $(".input_edit_value_rename").live("change", function() {
        var value_str = $(".input_edit_value_rename").val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var name_template = {"name": value_str};
            Sunstone.runAction("Zone.rename",zone_info.ID,name_template);
        }
    });

    //Sunstone.updateInfoPanelTab(info_panel_name,tab_name, new tab object);
    Sunstone.updateInfoPanelTab("zone_info_panel","zone_info_tab",info_tab);

    Sunstone.popUpInfoPanel("zone_info_panel", "zones-tab");

    $("#zone_info_panel_refresh", $("#zone_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Zone.showinfo', zone_info.ID);
    })
}

//Prepares the autorefresh for zones
function setZoneAutorefresh() {
    setInterval(function(){
        var checked = $('input.check_item:checked',dataTable_zones);
        var  filter = $("#zone_search").attr('value');
        if ((checked.length==0) && !filter){
            Sunstone.runAction("Zone.autorefresh");
        }
    },INTERVAL+someTime());
}

function zones_sel() {
    return zones_select;
}

//This is executed after the sunstone.js ready() is run.
//Here we can basicly init the zone datatable, preload it
//and add specific listeners
$(document).ready(function(){
    var tab_name = "zones-tab"

    if (Config.isTabEnabled(tab_name)) {
      //prepare zone datatable
      dataTable_zones = $("#datatable_zones",main_tabs_context).dataTable({
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

      setZoneAutorefresh();

      initCheckAllBoxes(dataTable_zones);
      tableCheckboxesListener(dataTable_zones);
      infoListener(dataTable_zones, "Zone.showinfo");
      dataTable_zones.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
