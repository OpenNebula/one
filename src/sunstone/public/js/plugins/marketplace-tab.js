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
            updateView(res.appliances,dataTable_marketplace);
        }
    },
    "Marketplace.refresh" : {
        type: "custom",
        call: function () {
          var tab = dataTable_marketplace.parents(".tab");
          if (Sunstone.rightInfoVisible(tab)) {
            Sunstone.runAction("Marketplace.show", Sunstone.rightInfoResourceId(tab))
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
        callback: function(request,appliance){
            if (appliance['status'] && appliance['status'] != 'ready') {
                notifyError(tr("The appliance is not ready"));
                return;
            }

            if ($('#market_import_dialog',dialogs_context) != undefined) {
              $('#market_import_dialog',dialogs_context).remove();
            }

            dialogs_context.append(marketplace_import_dialog);
            $marketplace_import_dialog = $('#market_import_dialog',dialogs_context);
            $marketplace_import_dialog.addClass("reveal-modal medium").attr("data-reveal", "");

            //var tab_id = 1;
            $('<div class="row">'+
                '<div class="large-12 columns">'+
                    '<p style="font-size:14px">'+
                        tr("The following images will be created in OpenNebula.")+ ' '+
                        tr("If you want to edit parameters of the image you can do it later in the images tab")+ ' '+
                    '</p>'+
                '</div>'+
            '</div>').appendTo($("#market_import_dialog_content"));

            $('<div class="row">'+
                '<div class="large-10 large-centered columns">'+
                    '<div class="large-10 columns">'+
                        '<label for="market_img_datastore">'+tr("Select the datastore for the images")+
                        '</label>'+
                        '<div id="market_img_datastore" name="market_img_datastore">'+
                        '</div>'+
                    '</div>'+
                    '<div class="large-2 columns">'+
                    '</div>'+
                '</div>'+
            '</div>').appendTo($("#market_import_dialog_content"));

            // Filter out DS with type system (1) or file (2)
            var filter_att = ["TYPE", "TYPE"];
            var filter_val = ["1", "2"];

            insertSelectOptions('div#market_img_datastore', $marketplace_import_dialog, "Datastore",
                                null, false, null, filter_att, filter_val);

            $.each(appliance['files'], function(index, value){
                $('<div class="row" id="market_import_file_'+index+'">'+
                    '<div class="large-10 large-centered columns">'+
                        '<div class="large-10 columns">'+
                            '<label>'+
                                '<i class="fa fa-fw fa-download"/>&emsp;'+
                                index+' - '+tr("Image Name")+
                                '<span class="right">'+
                                    humanize_size(value['size'], true)+
                                '</span>'+
                            '</label>'+
                            '<input type="text" class="name"    value="' + (value['name']||appliance['name']) +'" />'+
                        '</div>'+
                        '<div class="large-2 columns market_image_result">'+
                        '</div>'+
                    '</div>'+
                    '<div class="large-10 large-centered columns market_image_response">'+
                    '</div>'+
                '</div>').appendTo($("#market_import_dialog_content"));
            })

            if (appliance['opennebula_template'] && appliance['opennebula_template'] !== "CPU=1") {
                $('<br>'+
                '<div class="row">'+
                    '<div class="large-12 columns">'+
                        '<p style="font-size:14px">'+
                            tr("The following template will be created in OpenNebula and the previous images will be referenced in the disks")+ ' '+
                            tr("If you want to edit parameters of the template you can do it later in the templates tab")+ ' '+
                        '</p>'+
                    '</div>'+
                '</div>').appendTo($("#market_import_dialog_content"));

                $('<div class="row" id="market_import_file_template">'+
                    '<div class="large-10 large-centered columns">'+
                        '<div class="large-10 columns">'+
                            '<label>'+
                                '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                                tr("Template Name")+
                            '</label>'+
                            '<input type="text" class="name" value="' + (appliance['opennebula_template']['NAME']||appliance['name']) +'" />'+
                        '</div>'+
                        '<div class="large-2 columns market_template_result">'+
                        '</div>'+
                    '</div>'+
                    '<div class="large-10 large-centered columns market_template_response">'+
                    '</div>'+
                '</div>').appendTo($("#market_import_dialog_content"));
            }

            $marketplace_import_dialog.foundation().foundation('reveal', 'open');

            var images_information = [];

            $("#market_import_form").submit(function(){
                function try_to_create_template(){
                    var images_created = $(".market_image_result.success", $marketplace_import_dialog).length;
                    if ((images_created == number_of_files) && !template_created) {
                        template_created = true;

                        if (appliance['opennebula_template'] && appliance['opennebula_template'] !== "CPU=1") {
                            var vm_template
                            try {
                                vm_template = JSON.parse(appliance['opennebula_template'])
                            } catch (error) {
                                $(".market_template_result", template_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                                      '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                                    '</span>');

                                $(".market_template_response", template_context).html('<p style="font-size:12px" class="error-color">'+
                                      (error.message || tr("Cannot contact server: is it running and reachable?"))+
                                    '</p>');

                                $("input", template_context).removeAttr("disabled");
                                $("button", $marketplace_import_dialog).removeAttr("disabled");
                                template_created = false;
                                return;
                            }

                            if ($.isEmptyObject(vm_template.DISK))
                                vm_template.DISK = []
                            else if (!$.isArray(vm_template.DISK))
                                vm_template.DISK = [vm_template.DISK]

                            vm_template.NAME = $("input", template_context).val();
                            if (!vm_template.CPU)
                                vm_template.CPU = "1"
                            if (!vm_template.MEMORY)
                                vm_template.MEMORY = "1024"

                            $.each(images_information, function(image_index, image_info){
                                if (!vm_template.DISK[image_index]) {
                                    vm_template.DISK[image_index] = {}
                                }

                                vm_template.DISK[image_index].IMAGE = image_info.IMAGE.NAME;
                                vm_template.DISK[image_index].IMAGE_UNAME = image_info.IMAGE.UNAME;
                            })

                            vm_template.FROM_APP = appliance['_id']["$oid"];
                            vm_template.FROM_APP_NAME = appliance['name'];

                            OpenNebula.Template.create({
                                timeout: true,
                                data: {vmtemplate: vm_template},
                                success: function (request, response){
                                    $(".market_template_result", template_context).addClass("success").html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                                          '<i class="fa fa-cloud fa-stack-2x"></i>'+
                                          '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
                                        '</span>');

                                    $(".market_template_response", template_context).html('<p style="font-size:12px" class="running-color">'+
                                          tr("Template created successfully")+' ID:'+response.VMTEMPLATE.ID+
                                        '</p>');

                                    $("button", $marketplace_import_dialog).hide();
                                },
                                error: function (request, error_json){
                                    $(".market_template_result", template_context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                                          '<i class="fa fa-cloud fa-stack-2x"></i>'+
                                          '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                                        '</span>');

                                    $(".market_template_response", template_context).html('<p style="font-size:12px" class="error-color">'+
                                          (error_json.error.message || tr("Cannot contact server: is it running and reachable?"))+
                                        '</p>');

                                    $("input", template_context).removeAttr("disabled");
                                    $("button", $marketplace_import_dialog).removeAttr("disabled");
                                    template_created = false;
                                }
                            });
                        } else {
                            $("button", $marketplace_import_dialog).hide();
                        }
                    };
                }

                var number_of_files = appliance['files'].length;
                var template_created = false;

                $("input, button", $marketplace_import_dialog).attr("disabled", "disabled");
                $(".market_image_result:not(.success)",  $marketplace_import_dialog).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
                    '</span>');
                $(".market_template_result",  $marketplace_import_dialog).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
                    '</span>');

                var template_context = $("#market_import_file_template",  $marketplace_import_dialog);

                $.each(appliance['files'], function(index, value){
                    var context = $("#market_import_file_"+index,  $marketplace_import_dialog);

                    if ($(".market_image_result:not(.success)", context).length > 0) {
                        img_obj = {
                            "image" : {
                                "NAME": $("input.name",context).val(),
                                "PATH": appliance['links']['download']['href']+'/'+index,
                                "TYPE": value['type'],
                                "MD5": value['md5'],
                                "SHA1": value['sha1'],
                                "TYPE": value['type'],
                                "DRIVER": value['driver'],
                                "DEV_PREFIX": value['dev_prefix'],
                                "FROM_APP": appliance['_id']["$oid"],
                                "FROM_APP_NAME": appliance['name'],
                                "FROM_APP_FILE": index
                            },
                            "ds_id" : $("#market_img_datastore select", $marketplace_import_dialog).val()
                        };

                        OpenNebula.Image.create({
                            timeout: true,
                            data: img_obj,
                            success: function (file_index, file_context){
                                return function(request, response) {
                                    $(".market_image_result", file_context).addClass("success").html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                                          '<i class="fa fa-cloud fa-stack-2x"></i>'+
                                          '<i class="fa  fa-check fa-stack-1x fa-inverse"></i>'+
                                        '</span>');

                                    $(".market_image_response", file_context).html('<p style="font-size:12px" class="running-color">'+
                                          tr("Image created successfully")+' ID:'+response.IMAGE.ID+
                                        '</p>');

                                    images_information[file_index] = response;

                                    try_to_create_template();
                                };
                            }(index, context),
                            error: function (request, error_json){
                                $(".market_template_result", template_context).html('');

                                $(".market_image_result", context).html('<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
                                      '<i class="fa fa-cloud fa-stack-2x"></i>'+
                                      '<i class="fa  fa-warning fa-stack-1x fa-inverse"></i>'+
                                    '</span>');

                                $(".market_image_response", context).html('<p style="font-size:12px" class="error-color">'+
                                      (error_json.error.message || tr("Cannot contact server: is it running and reachable?"))+
                                    '</p>');

                                $("input", template_context).removeAttr("disabled");
                                $("input", context).removeAttr("disabled");
                                $("button", $marketplace_import_dialog).removeAttr("disabled");
                            }
                        });
                    }
                });

                try_to_create_template();

                return false;
            })
        },
        error: onError
    },

    "Marketplace.show" : {
        type: "single",
        call: OpenNebula.Marketplace.show,
        callback: function(request, response) {
//            updateMarketElement(request, response);
            if (Sunstone.rightInfoVisible($("#marketplace-tab"))) {
                updateMarketInfo(request, response);
            }
        },
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
'<div id="market_import_dialog">'+
  '<div class="row">'+
    '<div class="large-12">'+
      '<h3 class="subheader">'+tr("Import Appliance")+'</h3>'+
    '</div>'+
  '</div>'+
  '<form id="market_import_form">'+
      '<div id="market_import_dialog_content">'+
      '</div>'+
      '<div class="form_buttons">'+
          '<button class="button radius right success" id="market_import_button" type="submit">'+tr("Import")+'</button>'+
      '</div>'+
  '</form>'+
  '<a class="close-reveal-modal">&#215;</a>'+
'</div>';


var marketplace_tab = {
    title: '<i class="fa fa-lg fa-fw fa-shopping-cart"></i>&emsp;' + tr("Marketplace"),
    buttons: market_buttons,
    search_input: '<input id="marketplace_search" type="text" placeholder="'+tr("Search")+'" />',
    list_header: '<i class="fa fa-fw fa-shopping-cart"></i>&emsp;'+tr("OpenNebula Marketplace"),
    info_header: '<i class="fa fa-fw fa-shopping-cart"></i>&emsp;'+tr("Appliance"),
    subheader: '<span/> <small></small>&emsp;',
    content:   '<div class="row marketplace_error_message" hidden>\
        <div class="small-6 columns small-centered text-center">\
            <div class="alert-box alert radius">'+tr("Cannot connect to OpenNebula Marketplace")+'</div>\
        </div>\
    </div>',
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
    var url = app.links.download.href;
    url = url.replace(/\/download$/, '');

    var files_table = '<table id="info_marketplace_table2" class="dataTable">\
         <thead>\
           <tr><th colspan="2">'+tr("Images")+'</th></tr>\
         </thead>\
         <tbody>';

    if (app['files']) {
        $.each(app['files'], function(index, value){
            files_table +=  '<tr>\
                      <td class="value_td">'+value['name']+'</td>\
                      <td class="value_td">'+humanize_size(value['size'], true)+'</td>\
                    </tr>'
        });
    } else {
        files_table +=  '<tr>\
                  <td colspan="2" class="value_td">'+tr("No Images defined")+'</td>\
                </tr>'
    }

    files_table += '</tbody>\
      </table>';

    var info_tab = {
        title : tr("Info"),
        icon: "fa-info-circle",
        content: '<div class="row">\
        <div class="large-6 columns">\
        <table id="info_marketplace_table" class="dataTable">\
            <thead>\
              <tr><th colspan="2">'+tr("Information")+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+app['_id']["$oid"]+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Name") + '</td>\
                <td class="value_td">'+app['name']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("URL") + '</td>\
                <td class="value_td"><a href="'+url+'" target="_blank">'+tr("link")+'</a></td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Publisher") + '</td>\
                <td class="value_td">'+app['publisher']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Downloads") + '</td>\
                <td class="value_td">'+app['downloads']+'</td>'+
              (app['status'] ? '<tr>\
                <td class="key_td">' + tr("Status") + '</td>\
                <td class="value_td">'+app['status']+'</td>\
              </tr>' : '') +
              (app['tags'] ? '<tr>\
                <td class="key_td">' + tr("Tags") + '</td>\
                <td class="value_td">'+app['tags'].join(' ')+'</td>\
              </tr>' : '') +
              (app['catalog'] ? '<tr>\
                <td class="key_td">' + tr("Catalog") + '</td>\
                <td class="value_td">'+app['catalog']+'</td>\
              </tr>' : '') +
              '<tr>\
                <td class="key_td">' + tr("OS") + '</td>\
                <td class="value_td">'+app['os-id']+' '+app['os-release']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Arch") + '</td>\
                <td class="value_td">'+app['os-arch']+'</td>\
              </tr>' +
              (app['files'] ? '<tr>\
                <td class="key_td">' + tr("Size") + '</td>\
                <td class="value_td">'+humanize_size(app['files'][0]['size'],true)+'</td>\
              </tr>' : '') +
              '<tr>\
                <td class="key_td">' + tr("Hypervisor") + '</td>\
                <td class="value_td">'+app['hypervisor']+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("Format") + '</td>\
                <td class="value_td">'+app['format']+'</td>\
              </tr>' +
            '</tbody>\
        </table>\
        </div>\
        <div class="large-6 columns">'+
          (app['short_description'] ? '<table class="dataTable">\
             <thead>\
               <tr><th colspan="2">'+tr("Short Description")+'</th></tr>\
             </thead>\
             <tbody>\
                <tr>\
                  <td class="value_td">'+app['short_description'].replace(/\n/g, "<br />")+'</td>\
                </tr>\
              </tbody>\
          </table>' : '') +
          '<table id="info_marketplace_table2" class="dataTable">\
             <thead>\
               <tr><th colspan="2">'+tr("Description")+'</th></tr>\
             </thead>\
             <tbody>\
                <tr>\
                  <td class="value_td">'+app['description'].replace(/\n/g, "<br />")+'</td>\
                </tr>\
              </tbody>\
          </table>'+
          files_table+
          (app['opennebula_template'] ? '<table class="dataTable">\
             <thead>\
               <tr><th colspan="2">'+tr("OpenNebula Template")+'</th></tr>\
             </thead>\
             <tbody>\
                <tr>\
                  <td class="value_td">'+app['opennebula_template'].replace(/\n/g, "<br />")+'</td>\
                </tr>\
              </tbody>\
          </table>' : '') +
        '</div>\
      </div>'
    };

    Sunstone.updateInfoPanelTab("marketplace_info_panel", "marketplace_info_tab", info_tab);
    Sunstone.popUpInfoPanel("marketplace_info_panel", "marketplace-tab");
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
          popDialogLoading($("#marketplace-tab"));
          Sunstone.runAction("Marketplace.show",id);
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
            "bSortClasses" : false,
            "bDeferRender": true,
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
