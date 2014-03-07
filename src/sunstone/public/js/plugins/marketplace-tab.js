/* -------------------------------------------------------------------------- */
/* Copyright 2010-2014, C12G Labs S.L                                         */
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

/* Marketpplace tab plugin */
var dataTable_marketplace;
var $marketplace_import_dialog;

var market_actions = {
    "Marketplace.list" : {
        type: "list",
        call: OpenNebula.Marketplace.list,
        callback: function(req,res){
            //data can be added to the table directly, without further
            //processing
            updateView(res.appliances,dataTable_marketplace);
        },
        error: onError
    },
    "Marketplace.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_marketplace.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Marketplace.showinfo", Sunstone.rightInfoResourceId(tab))
          } else {
            waitingNodes(dataTable_marketplace);
            Sunstone.runAction("Marketplace.list");
          }
        }
    },
    "Marketplace.import" : {
        //fetches images information and fills in the image creation
        //dialog with it.
        type: "multiple",
        elements: marketplaceElements,
        call: OpenNebula.Marketplace.show,
        callback: function(request,response){
            if (response['status'] && response['status'] != 'ready') {
                notifyError(tr("The appliance is not ready"));
                return;
            }

            if ($marketplace_import_dialog != undefined) {
              $marketplace_import_dialog.html("");
            }

            dialogs_context.append(marketplace_import_dialog);
            $marketplace_import_dialog = $('#marketplace_import_dialog',dialogs_context);
            $marketplace_import_dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");
            $marketplace_import_dialog.foundation().foundation('reveal', 'open');

            var tab_id = 1;

            $.each(response['files'], function(index, value){
                // Append the new div containing the tab and add the tab to the list
                var image_dialog = $('<div id="Tab'+tab_id+'" class="content disk wizard_internal_tab">'+
                  create_image_tmpl +
                '</div>').appendTo($("#marketplace_import_dialog_tabs_content"));

                var a_image_dialog = $("<dd>\
                  <a id='disk_tab"+tab_id+"' href='#Tab"+tab_id+"'>"+tr("Image")+"</a>\
                </dd>").appendTo($("dl#marketplace_import_dialog_tabs"));

                initialize_create_image_dialog(image_dialog);
                initialize_datastore_info_create_image_dialog(image_dialog);

                $('#img_name', image_dialog).val(value['name']||response['name']);
                $('#img_path', image_dialog).val(response['links']['download']['href']+'/'+index);
                $('#src_path_select input[value="path"]', image_dialog).trigger('click');
                $('select#img_type', image_dialog).val(value['type']);
                $('select#img_type', image_dialog).trigger('change');

                //remove any options from the custom vars dialog box
                $("#custom_var_image_box",image_dialog).empty();

                var md5 = value['md5']
                if ( md5 ) {
                    option = '<option value=\'' +
                        md5 + '\' name="MD5">MD5=' +
                        md5 + '</option>';
                    $("#custom_var_image_box",image_dialog).append(option);
                }

                var sha1 = value['sha1']
                if ( sha1 ) {
                    option = '<option value=\'' +
                        sha1 + '\' name="SHA1">SHA1=' +
                        sha1 + '</option>';
                    $("#custom_var_image_box",image_dialog).append(option);
                }

                a_image_dialog.on('click', function(){
                    $create_image_dialog = image_dialog;
                })

                image_dialog.on("close", function(){
                  a_image_dialog.html("");
                  image_dialog.html("");
                  if ($('a', $("dl#marketplace_import_dialog_tabs")).size > 0) {
                    $('a', $("dl#marketplace_import_dialog_tabs")).first().click();
                  } else {
                    $marketplace_import_dialog.trigger('close');
                  }
                  return false;
                });

                $("a[href='#img_manual']", image_dialog).closest('dl').remove();
                tab_id++;
            })

            if (response['opennebula_template'] && response['opennebula_template'] !== "CPU=1") {
              $create_template_dialog.html("");
              // Template
              // Append the new div containing the tab and add the tab to the list
              var template_dialog = $('<div id="'+tab_id+'Tab" class="content disk wizard_internal_tab">'+
                create_template_tmpl +
              '</div>').appendTo($("#marketplace_import_dialog_tabs_content"));

              var a_template_dialog = $("<dd>\
                <a id='disk_tab"+tab_id+"' href='#"+tab_id+"Tab'>"+tr("Template")+"</a>\
              </dd>").appendTo($("dl#marketplace_import_dialog_tabs"));

              initialize_create_template_dialog(template_dialog);
              fillTemplatePopUp(
                JSON.parse(response['opennebula_template']),
                template_dialog);

              a_template_dialog.on('click', function(){
                  $create_template_dialog = template_dialog;
              })

              template_dialog.on("close", function(){
                a_template_dialog.html("");
                template_dialog.html("");
                if ($('a', $("dl#marketplace_import_dialog_tabs")).size > 0) {
                  $('a', $("dl#marketplace_import_dialog_tabs")).first().click();
                } else {
                  $marketplace_import_dialog.trigger('close');
                }
                return false;
              });

              $("a[href='#manual']", template_dialog).closest('dl').remove();
            }

            $('a', $("dl#marketplace_import_dialog_tabs")).first().click();
        },
        error: onError
    },
    "Marketplace.showinfo" : {
        type: "single",
        call: OpenNebula.Marketplace.show,
        callback: updateMarketInfo,
        error: onError
    }
}

var market_buttons = {
    "Marketplace.refresh" : {
        type: "action",
        layout: "refresh",
        text: '<i class="fa fa-refresh fa fa-lg">',
        alwaysActive: true
    },
    "Marketplace.import" : {
        type: "action",
        layout: "main",
        text: tr('Import')
    }
};

var marketplace_import_dialog =
'<div id="marketplace_import_dialog">'+
  '<div class="row">'+
    '<h3 class="subheader">'+tr("Import Appliance")+'</h3>'+
  '</div>'+
  '<div class="reveal-body">'+
    '<dl class="tabs" id="marketplace_import_dialog_tabs" data-tab>'+
    '</dl>'+
    '<div class="tabs-content" id="marketplace_import_dialog_tabs_content">'+
    '</div>'+
  '</div>'+
  '<a class="close-reveal-modal">&#215;</a>'+
'</div>';


var marketplace_tab = {
    title: '<i class="fa fa-shopping-cart"></i>' + tr("Marketplace"),
    buttons: market_buttons,
    search_input: '<input id="marketplace_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-shopping-cart"></i> '+tr("OpenNebula Marketplace"),
    info_header: '<i class="fa fa-shopping-cart"></i> '+tr("Appliance"),
    subheader: '<span/> <small></small>&emsp;',
    table: '<table id="datatable_marketplace" class="datatable twelve">\
      <thead>\
        <tr>\
          <th class="check"></th>\
          <th>'+tr("ID")+'</th>\
          <th>'+tr("Name")+'</th>\
          <th>'+tr("Publisher")+'</th>\
          <th>'+tr("Hypervisor")+'</th>\
          <th>'+tr("Arch")+'</th>\
          <th>'+tr("Format")+'</th>\
          <th>'+tr("Tags")+'</th>\
        </tr>\
      </thead>\
      <tbody id="tbodymarketplace">\
      </tbody>\
    </table>'
};

Sunstone.addMainTab('marketplace-tab', marketplace_tab);
Sunstone.addActions(market_actions);


/*
 * INFO PANEL
 */

var marketplace_info_panel = {
    "marketplace_info_tab" : {
        title: tr("Appliance information"),
        content:""
    }
};

Sunstone.addInfoPanel("marketplace_info_panel", marketplace_info_panel);

function marketplaceElements(){
    return getSelectedNodes(dataTable_marketplace);
}

function updateMarketInfo(request,app){
    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content :
        '<form class="custom"><div class="">\
        <div class="large-6 columns">\
        <table id="info_marketplace_table" class="dataTable extended_table">\
            <thead>\
              <tr>\
                <th colspan="2">'+tr("Information") + '</th>\
              </tr>\
            </thead>\
            <tbody>\
              <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+app['_id']["$oid"]+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("URL") + '</td>\
                <td class="value_td"><a href="'+config.system_config.marketplace_url+'/'+app['_id']["$oid"]+'" target="_blank">'+tr("link")+'</a></td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Publisher") + '</td>\
                <td class="value_td">'+app['publisher']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Downloads") + '</td>\
                <td class="value_td">'+app['downloads']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("OS") + '</td>\
                <td class="value_td">'+app['files'][0]['os-id']+' '+app['files'][0]['os-release']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Arch") + '</td>\
                <td class="value_td">'+app['files'][0]['os-arch']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Size") + '</td>\
                <td class="value_td">'+humanize_size(app['files'][0]['size'],true)+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Hypervisor") + '</td>\
                <td class="value_td">'+app['files'][0]['hypervisor']+'</td>\
              </tr>\
            </tbody>\
        </table>\
        </div>\
        <div class="large-6 columns">\
        <table id="info_marketplace_table2" class="dataTable extended_table">\
           <thead>\
             <tr><th>'+tr("Description")+'</th></tr>\
           </thead>\
           <tbody>\
              <tr>\
                <td class="">'+app['description'].replace(/\n/g, "<br />")+'</td>\
              </tr>\
            </tbody>\
        </table>\
      </div>\
    </form>'
    };

    Sunstone.updateInfoPanelTab("marketplace_info_panel", "marketplace_info_tab", info_tab);
    Sunstone.popUpInfoPanel("marketplace_info_panel", "marketplace-tab");

    $("#marketplace_info_panel_refresh", $("#marketplace_info_panel")).click(function(){
      $(this).html(spinner);
      Sunstone.runAction('Marketplace.showinfo', app['_id']["$oid"]);
    })
};

 function infoListenerMarket(dataTable){
    $('tbody tr',dataTable).live("click",function(e){

    if ($(e.target).is('input') ||
        $(e.target).is('select') ||
        $(e.target).is('option')) return true;

      var aData = dataTable.fnGetData(this);
      var id =aData["_id"]["$oid"];

      if (!id) return true;

      if (e.ctrlKey || e.metaKey || $(e.target).is('input')) {
          $('.check_item',this).trigger('click');
      } else {
          var context = $(this).parents(".tab");
          popDialogLoading();
          Sunstone.runAction("Marketplace.showinfo",id);
          $(".resource-id", context).html(id);
          $('.top_button, .list_button', context).attr('disabled', false);
      }

      return false;
    });
}


/*
 * onlyOneCheckboxListener: Only one box can be checked
 */

function onlyOneCheckboxListener(dataTable) {
    $('tbody input.check_item', dataTable).live("change", function(){
        var checked = $(this).is(':checked');
        $('td', dataTable).removeClass('markrowchecked');
        $('input.check_item:checked', dataTable).removeAttr('checked');
        $("td", $(this).closest('tr')).addClass('markrowchecked')
        $(this).attr('checked', checked);
    });
}

/*
 * Document
 */

$(document).ready(function(){
    var tab_name = 'marketplace-tab';

    if (Config.isTabEnabled(tab_name)) {
      dataTable_marketplace = $("#datatable_marketplace", main_tabs_context).dataTable({
          "bSortClasses": true,
          "aoColumns": [
              { "bSortable": false,
                "mData": function ( o, val, data ) {
                    //we render 1st column as a checkbox directly
                    return '<input class="check_item" type="checkbox" id="marketplace_'+
                        o['_id']['$oid']+
                        '" name="selected_items" value="'+
                        o['_id']['$oid']+'"/>'
                },
                "sWidth" : "60px"
              },
              { "mDataProp": "_id.$oid", "sWidth" : "200px" },
              { "mDataProp": "name" },
              { "mDataProp": "publisher" },
              { "mDataProp": "files.0.hypervisor", "sWidth" : "100px"},
              { "mDataProp": "files.0.os-arch", "sWidth" : "100px"},
              { "mDataProp": "files.0.format", "sWidth" : "100px"},
              { "mDataProp": "tags"}
            ],
            "aoColumnDefs": [
              { "bVisible": true, "aTargets": Config.tabTableColumns(tab_name)},
              { "bVisible": false, "aTargets": ['_all']}
          ]
      });


      $('#marketplace_search').keyup(function(){
        dataTable_marketplace.fnFilter( $(this).val() );
      })

      dataTable_marketplace.on('draw', function(){
        recountCheckboxes(dataTable_marketplace);
      })

      tableCheckboxesListener(dataTable_marketplace);
      onlyOneCheckboxListener(dataTable_marketplace);

      infoListenerMarket(dataTable_marketplace);

      Sunstone.runAction('Marketplace.list');
    }
});
