/* -------------------------------------------------------------------------- */
/* Copyright 2010-2012, C12G Labs S.L                                         */
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
            waitingNodes(dataTable_marketplace);
            Sunstone.runAction('Marketplace.list');
        }
    },
    "Marketplace.import" : {
        //fetches images information and fills in the image creation
        //dialog with it.
        type: "multiple",
        elements: marketplaceElements,
        call: OpenNebula.Marketplace.show,
        callback: function(request,response){
            $('#img_name', $create_image_dialog).val(response['name']);
            $('#img_path', $create_image_dialog).val(response['links']['download']['href']);
            $('#src_path_select input[value="path"]', $create_image_dialog).trigger('click');
            $('select#img_type', $create_image_dialog).val('OS');
            $('select#img_type', $create_image_dialog).trigger('change');

            if (response['files'][0]['hypervisor'] == "KVM") {
              $('#img_driver', $create_image_dialog).val(response['files'][0]['format'])
            }

            //remove any options from the custom vars dialog box
            $("#custom_var_image_box",$create_image_dialog).empty();

            var md5 = response['files'][0]['md5']
            if ( md5 ) {
                option = '<option value=\'' +
                    md5 + '\' name="MD5">MD5=' +
                    md5 + '</option>';
                $("#custom_var_image_box",$create_image_dialog).append(option);
            }

            var sha1 = response['files'][0]['sha1']
            if ( sha1 ) {
                option = '<option value=\'' +
                    sha1 + '\' name="SHA1">SHA1=' +
                    sha1 + '</option>';
                $("#custom_var_image_box",$create_image_dialog).append(option);
            }

            popUpCreateImageDialog();
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
        text: '<i class="icon-refresh icon-large">',
        alwaysActive: true
    },
    "Marketplace.import" : {
        type: "action",
        text: tr('Import to local infrastructure')
    }
};

var marketplace_tab_content = '\
<h2><i class="icon-shopping-cart"></i> '+tr("OpenNebula Marketplace")+'</h2>\
<form id="marketplace_form" action="" action="javascript:alert(\'js error!\');">\
  <div class="action_blocks">\
  </div>\
<table id="datatable_marketplace" class="display">\
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
</table>\
</div>';


var marketplace_tab = {
    title: '<i class="icon-shopping-cart"></i>' + tr("Marketplace"),
    content: marketplace_tab_content,
    buttons: market_buttons
};

Sunstone.addMainTab('marketplace_tab', marketplace_tab);
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
        title : tr("Appliance information"),
        content :
        '<table id="info_marketplace_table" class="info_table">\
            <thead>\
              <tr><th colspan="2">'+tr("Appliance information")+'</th></tr>\
            </thead>\
            <tbody>\
              <tr>\
                <td class="key_td">' + tr("ID") + '</td>\
                <td class="value_td">'+app['_id']["$oid"]+'</td>\
              </tr>\
              <tr>\
                <td class="key_td">' + tr("URL") + '</td>\
                <td class="value_td"><a href="'+config_response.system_config.marketplace_url+'/'+app['_id']["$oid"]+'" target="_blank">'+config_response.system_config.marketplace_url+'/'+app['_id']["$oid"]+'</a></td>\
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
        <table id="info_marketplace_table2" class="info_table">\
           <thead>\
             <tr><th colspan="2">'+tr("Description")+'</th></tr>\
           </thead>\
           <tbody>\
              <tr>\
                <td class="value_td">'+app['description'].replace(/\n/g, "<br />")+'</td>\
              </tr>\
            </tbody>\
        </table>'
    };

    Sunstone.updateInfoPanelTab("marketplace_info_panel", "marketplace_info_tab", info_tab);
    Sunstone.popUpInfoPanel("marketplace_info_panel");
};

function infoListenerMarket(dataTable){
    $('tbody tr',dataTable).live("click",function(e){
        if ($(e.target).is('input')) {return true;}

        var aData = dataTable.fnGetData(this);
        var id = aData["_id"]["$oid"];
        if (!id) return true;

        var count = $('tbody .check_item:checked', dataTable).length;

        //If ctrl is pressed we check the column instead of
        //doing showinfo()
        if (e.ctrlKey || count >= 1){
            $('.check_item',this).trigger('click');
            return false;
        }

        popDialogLoading();

        Sunstone.runAction('Marketplace.showinfo',id);
        return false;
    });
}


/*
 * onlyOneCheckboxListener: Only one box can be checked
 */

function onlyOneCheckboxListener(dataTable) {
    $('tbody input.check_item', dataTable).live("change", function(){
        var checked = $(this).is(':checked');
        $('input.check_item:checked', dataTable).removeAttr('checked');
        $(this).attr('checked', checked);
    });
}

/*
 * Document
 */

$(document).ready(function(){
    dataTable_marketplace = $("#datatable_marketplace", main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "bAutoWidth":false,
        "aoColumns": [
            { "bSortable": false,
              "fnRender": function ( o, val ) {
                  //we render 1st column as a checkbox directly
                  return '<input class="check_item" type="checkbox" id="marketplace_'+
                      o.aData['_id']['$oid']+
                      '" name="selected_items" value="'+
                      o.aData['_id']['$oid']+'"/>'
              },
              "sWidth" : "60px"
            },
            { "mDataProp": "_id.$oid", "bVisible": false, "sWidth" : "200px" },
            { "mDataProp": "name" },
            { "mDataProp": "publisher" },
            { "mDataProp": "files.0.hypervisor", "sWidth" : "100px"},
            { "mDataProp": "files.0.os-arch", "sWidth" : "100px"},
            { "mDataProp": "files.0.format", "sWidth" : "100px"},
            { "mDataProp": "tags", "bVisible": false}
          ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    tableCheckboxesListener(dataTable_marketplace);
    onlyOneCheckboxListener(dataTable_marketplace);

    infoListenerMarket(dataTable_marketplace);

    Sunstone.runAction('Marketplace.list');
});