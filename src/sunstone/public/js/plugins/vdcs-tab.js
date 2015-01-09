/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

var create_vdc_wizard_html =
    '<form data-abide="ajax" id="create_vdc_form_wizard" class="custom creation">\
      <div>\
        <dl id="vdc_create_tabs" class="tabs right-info-tabs text-center" data-tab>\
          <dd class="active"><a href="#vdcCreateGeneralTab"><i class="fa fa-globe"></i><br>'+tr("General")+'</a></dd>\
        </dl>\
        <div id="vdc_create_tabs_content" class="tabs-content">\
          <div class="content active" id="vdcCreateGeneralTab">\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="name" >' + tr("Name") + ':\
                  <span class="tip">'+tr("Name that the Virtual Data Center will get for description purposes.")+'</span>\
                </label>\
                <input type="text" wizard_field="NAME" required name="name" id="name"/>\
              </div>\
            </div>\
            <div class="row">\
              <div class="large-6 columns">\
                <label for="DESCRIPTION" >' + tr("Description") + ':\
                  <span class="tip">'+tr("Description of the Virtual Data Center")+'</span>\
                </label>\
                <textarea type="text" wizard_field="DESCRIPTION" id="DESCRIPTION" name="DESCRIPTION"/>\
              </div>\
            </div>\
            <br>\
            <div class="row">\
              <div class="large-12 columns">\
                <span>' + tr("Custom attributes") + '</span>\
                <br>\
                <br>\
              </div>\
            </div>'+
            customTagsHtml()+'\
          </div>\
        </div>\
      </div>\
    </form>';


var create_vdc_advanced_html =
 '<form data-abide="ajax" id="create_vdc_form_advanced" class="custom creation">' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<p>'+tr("Write the Virtual Data Center template here")+'</p>' +
      '</div>' +
    '</div>' +
    '<div class="row">' +
      '<div class="large-12 columns">' +
        '<textarea id="template" rows="15" required></textarea>' +
      '</div>' +
    '</div>' +
  '</form>';

var dataTable_vdcs;

//Setup actions

var vdc_actions = {
    "Vdc.create" : {
        type: "create",
        call: OpenNebula.Vdc.create,
        callback: function(request, response) {
            $("a[href=back]", $("#vdcs-tab")).trigger("click");
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            addVdcElement(request, response);
            notifyCustom(tr("Virtual Data Center created"), " ID: " + response.VDC.ID, false);
        },
        error: onError
    },

    "Vdc.create_dialog" : {
        type: "custom",
        call: function(){
            Sunstone.popUpFormPanel("create_vdc_form", "vdcs-tab", "create", true, function(context){
                refreshSecurityGroupTableSelect(context, "vdc_create");

                $("#default_sg_warning").show();
                $("input#name",context).focus();
            });
        }
    },

    "Vdc.list" : {
        type: "list",
        call: OpenNebula.Vdc.list,
        callback: updateVdcsView,
        error: onError
    },

    "Vdc.show" : {
        type: "single",
        call: OpenNebula.Vdc.show,
        callback: function(request, response) {
            updateVdcElement(request, response);
            if (Sunstone.rightInfoVisible($("#vdcs-tab"))) {
                updateVdcInfo(request, response);
            }
        },
        error: onError
    },

    "Vdc.refresh" : {
        type: "custom",
        call: function(){
          var tab = dataTable_vdcs.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Vdc.show", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_vdcs);
            Sunstone.runAction("Vdc.list", {force: true});
          }
        }
    },

    "Vdc.delete" : {
        type: "multiple",
        call: OpenNebula.Vdc.del,
        callback: deleteVdcElement,
        elements: vdcElements,
        error: onError
    },

    "Vdc.rename" : {
        type: "single",
        call: OpenNebula.Vdc.rename,
        callback: function(request) {
            Sunstone.runAction('Vdc.show',request.request.data[0][0]);
        },
        error: onError
    },

    "Vdc.update_dialog" : {
        type: "custom",
        call: function(){
            var selected_nodes = getSelectedNodes(dataTable_vdcs);
            if ( selected_nodes.length != 1 ) {
                notifyMessage("Please select one (and just one) Virtual Data Center to update.");
                return false;
            }

            var resource_id = ""+selected_nodes[0];
            Sunstone.runAction("Vdc.show_to_update", resource_id);
        }
    },

    "Vdc.show_to_update" : {
        type: "single",
        call: OpenNebula.Vdc.show,
        callback: function(request, response) {
            // TODO: global var, better use jquery .data
            vdc_to_update_id = response.VDC.ID;

            Sunstone.popUpFormPanel("create_vdc_form", "vdcs-tab", "update", true, function(context){
                fillVdcUpdateFormPanel(response.VDC, context);

                $("#default_sg_warning").hide();
            });
        },
        error: onError
    },

    "Vdc.update" : {
        type: "single",
        call: OpenNebula.Vdc.update,
        callback: function(request, response){
            $("a[href=back]", $("#vdcs-tab")).trigger("click");
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            notifyMessage(tr("Virtual Data Center updated correctly"));
        },
        error: function(request, response){
            popFormDialog("create_vdc_form", $("#vdcs-tab"));

            onError(request, response);
        }
    },

    "Vdc.update_template" : {
        type: "single",
        call: OpenNebula.Vdc.update,
        callback: function(request) {
            Sunstone.runAction('Vdc.show',request.request.data[0][0]);
        },
        error: onError
    }
};


var vdc_buttons = {
    "Vdc.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },

//    "Sunstone.toggle_top" : {
//        type: "custom",
//        layout: "top",
//        alwaysActive: true
//    },

    "Vdc.create_dialog" : {
        type: "create_dialog",
        layout: "create"
    },
    "Vdc.update_dialog" : {
        type: "action",
        layout: "main",
        text: tr("Update")
    },

    "Vdc.delete" : {
        type: "confirm",
        layout: "del",
        text: tr("Delete")
    }
}

var vdc_info_panel = {
    "vdc_info_tab" : {
        title: tr("Virtual Data Center information"),
        content: ""
    }
}

var vdcs_tab = {
    title: tr("Virtual Data Centers"),
    resource: 'Vdc',
    buttons: vdc_buttons,
    tabClass: "subTab",
    parentTab: "system-tab",
    search_input: '<input id="vdc_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-globe"></i>&emsp;'+tr("Virtual Data Centers"),
    info_header: '<i class="fa fa-fw fa-globe"></i>&emsp;'+tr("Virtual Data Center"),
    subheader: '<span class="total_vdcs"/> <small>'+tr("TOTAL")+'</small>',
    table: '<table id="datatable_vdcs" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"><input type="checkbox" class="check_all" value=""></input></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Name")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodyvdcs">\
      </tbody>\
    </table>',
    forms: {
        "create_vdc_form": {
            actions: {
                create: {
                    title: tr("Create Virtual Data Center"),
                    submit_text: tr("Create")
                },
                update: {
                    title: tr("Update Virtual Data Center"),
                    submit_text: tr("Update"),
                    reset_button: false
                }
            },
            wizard_html: create_vdc_wizard_html,
            advanced_html: create_vdc_advanced_html,
            setup: initialize_create_vdc_dialog
        }
    }
}

Sunstone.addActions(vdc_actions);
Sunstone.addMainTab('vdcs-tab',vdcs_tab);
Sunstone.addInfoPanel('vdc_info_panel',vdc_info_panel);

// return list of selected elements in list
function vdcElements(){
    return getSelectedNodes(dataTable_vdcs);
}

//returns an array with the VDC information fetched from the JSON object
function vdcElementArray(vdc_json){
    var vdc = vdc_json.VDC;

    return [
        '<input class="check_item" type="checkbox" id="vdc_'+vdc.ID+'" name="selected_items" value="'+vdc.ID+'"/>',
        vdc.ID,
        vdc.NAME
    ];
}

//Callback to update a vdc element after an action on it
function updateVdcElement(request, vdc_json){
    id = vdc_json.VDC.ID;
    element = vdcElementArray(vdc_json);
    updateSingleElement(element,dataTable_vdcs,'#vdc_'+id);
}

//Callback to delete a vdc element from the table
function deleteVdcElement(req){
    deleteElement(dataTable_vdcs,'#vdc_'+req.request.data);
}

//Callback to add a new element
function addVdcElement(request,vdc_json){
    var element = vdcElementArray(vdc_json);
    addElement(element,dataTable_vdcs);
}

//updates the list of vdcs
function updateVdcsView(request, vdc_list){
    var vdc_list_array = [];

    $.each(vdc_list,function(){
        vdc_list_array.push(vdcElementArray(this));
    });

    updateView(vdc_list_array,dataTable_vdcs);

    $(".total_vdcs").text(vdc_list.length);
}

//updates the information panel tabs and pops the panel up
function updateVdcInfo(request,vdc){
    var vdc_info = vdc.VDC;

    $(".resource-info-header", $("#vdcs-tab")).html(vdc_info.NAME);

    var info_tab_content =
        '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_vdc_table" class="dataTable extended_table">\
            <thead>\
               <tr><th colspan="3">'+tr("Information")+'</th></tr>\
            </thead>\
            <tr>\
              <td class="key_td">'+tr("ID")+'</td>\
              <td class="value_td">'+vdc_info.ID+'</td>\
              <td></td>\
            </tr>'+
            insert_rename_tr(
                'vdcs-tab',
                "Vdc",
                vdc_info.ID,
                vdc_info.NAME)+
        '</table>\
        </div>\
      </div>\
      <div class="row">\
        <div class="large-9 columns">' +
            insert_extended_template_table(vdc_info.TEMPLATE,
                                                       "Vdc",
                                                       vdc_info.ID,
                                                       tr("Attributes")) +
        '</div>\
      </div>';

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: info_tab_content
    };

    Sunstone.updateInfoPanelTab("vdc_info_panel","vdc_info_tab",info_tab);

    Sunstone.popUpInfoPanel("vdc_info_panel", "vdcs-tab");
}

function initialize_create_vdc_dialog(dialog) {

    setupCustomTags($("#vdcCreateGeneralTab", dialog));

    dialog.foundation();

    //Process form
    $('#create_vdc_form_wizard',dialog).on('invalid.fndtn.abide', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vdc_form", $("#vdcs-tab"));
    }).on('valid.fndtn.abide', function() {
        //Fetch values
        var vdc_json = {};

        retrieveWizardFields($("#vdcCreateGeneralTab", dialog), vdc_json);

        retrieveCustomTags($("#vdcCreateGeneralTab", dialog), vdc_json);

        if ($('#create_vdc_form_wizard',dialog).attr("action") == "create") {
            vdc_json = {
                "vdc" : vdc_json
            };

            Sunstone.runAction("Vdc.create",vdc_json);
            return false;
        } else if ($('#create_vdc_form_wizard',dialog).attr("action") == "update") {
            Sunstone.runAction("Vdc.update", vdc_to_update_id, convert_template_to_string(vdc_json));
            return false;
        }
    });

    $('#create_vdc_form_advanced',dialog).on('invalid.fndtn.abide', function () {
        notifyError(tr("One or more required fields are missing or malformed."));
        popFormDialog("create_vdc_form", $("#vdcs-tab"));
    }).on('valid.fndtn.abide', function() {
        if ($('#create_vdc_form_advanced',dialog).attr("action") == "create") {

            var template = $('textarea#template',dialog).val();
            var vdc_json = {vdc: {vdc_raw: template}};
            Sunstone.runAction("Vdc.create",vdc_json);
            return false;

        } else if ($('#create_vdc_form_advanced',dialog).attr("action") == "update") {
            var template_raw = $('textarea#template',dialog).val();

            Sunstone.runAction("Vdc.update",vdc_to_update_id,template_raw);
            return false;
          }
    });

    setupTips(dialog);
}

function fillVdcUpdateFormPanel(vdc, dialog){

    // Populates the Avanced mode Tab
    $('#template',dialog).val(convert_template_to_string(vdc.TEMPLATE).replace(/^[\r\n]+$/g, ""));

    $('[wizard_field="NAME"]',dialog).val(
        escapeDoubleQuotes(htmlDecode( vdc.NAME ))).
        prop("disabled", true).
        prop('wizard_field_disabled', true);

    fillWizardFields($("#vdcCreateGeneralTab", dialog), vdc.TEMPLATE);

    // Delete so these attributes don't end in the custom tags table also
    var fields = $('[wizard_field]', dialog);

    fields.each(function(){
        var field = $(this);
        var field_name = field.attr('wizard_field');

        delete vdc.TEMPLATE[field_name];
    });

    fillCustomTags($("#vdcCreateGeneralTab", dialog), vdc.TEMPLATE);
}

//The DOM is ready and the ready() from sunstone.js
//has been executed at this point.
$(document).ready(function(){
    var tab_name = 'vdcs-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_vdcs = $("#datatable_vdcs",main_tabs_context).dataTable({
            "bSortClasses": false,
            "bDeferRender": true,
            "aoColumnDefs": [
              { "bSortable": false, "aTargets": ["check"] },
              { "sWidth": "35px", "aTargets": [0] },
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });

      $('#vdc_search').keyup(function(){
        dataTable_vdcs.fnFilter( $(this).val() );
      })

      dataTable_vdcs.on('draw', function(){
        recountCheckboxes(dataTable_vdcs);
      })

      Sunstone.runAction("Vdc.list");

      initCheckAllBoxes(dataTable_vdcs);
      tableCheckboxesListener(dataTable_vdcs);
      infoListener(dataTable_vdcs,'Vdc.show');

      $('div#vdcs_tab div.legend_div').hide();

      dataTable_vdcs.fnSort( [ [1,config['user_config']['table_order']] ] );
    }
});
