/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
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

/*Marketpplace tab plugin*/
var dataTable_marketplace;

/*
 * fnReloadAjax: re-read the Ajax source and update the table
 */

$.fn.dataTableExt.oApi.fnReloadAjax = function ( oSettings, sNewSource, fnCallback, bStandingRedraw )
{
    if ( typeof sNewSource != 'undefined' && sNewSource != null )
    {
        oSettings.sAjaxSource = sNewSource;
    }
    this.oApi._fnProcessingDisplay( oSettings, true );
    var that = this;
    var iStart = oSettings._iDisplayStart;
    var aData = [];

    this.oApi._fnServerParams( oSettings, aData );

    oSettings.fnServerData( oSettings.sAjaxSource, aData, function(json) {
        /* Clear the old information from the table */
        that.oApi._fnClearTable( oSettings );

        /* Got the data - add it to the table */
        var aData =  (oSettings.sAjaxDataProp !== "") ?
            that.oApi._fnGetObjectDataFn( oSettings.sAjaxDataProp )( json ) : json;

        for ( var i=0 ; i<aData.length ; i++ )
        {
            that.oApi._fnAddData( oSettings, aData[i] );
        }

        oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();
        that.fnDraw();

        if ( typeof bStandingRedraw != 'undefined' && bStandingRedraw === true )
        {
            oSettings._iDisplayStart = iStart;
            that.fnDraw( false );
        }

        that.oApi._fnProcessingDisplay( oSettings, false );

        /* Callback user function - for event handlers etc */
        if ( typeof fnCallback == 'function' && fnCallback != null )
        {
            fnCallback( oSettings );
        }
    }, oSettings );
}


/*
 * MAIN TAB
 */

var market_actions = {
    "Marketplace.refresh" : {
        type: "custom",
        call: function () {
            dataTable_marketplace.fnReloadAjax();
        }
    },
    "Marketplace.import" : {
        type: "single",
        call: function () {
            var app_id = getSelectedNodes(dataTable_marketplace)[0];

            $.ajax({
                url: "/marketplace/" + app_id,
                type: "GET",
                dataType: "json",
                success: function(response){
                    document.getElementById("img_name").value = response['name'];
                    document.getElementById("img_path").value = response['links']['download']['href'];
                    popUpCreateImageDialog();
                },
                error: function(response)
                {
                    return onError(null, OpenNebula.Error(response));
                }
            });
        }
    }
}

var market_buttons = {
    "Marketplace.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
    },
    "Marketplace.import" : {
        type: "action",
        text: tr('Import to local infrastructure')
    }
};

var marketplace_tab_content = '\
<h2>'+tr("OpenNebula Marketplace")+'</h2>\
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
    buttons: market_buttons,
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
    },
};

Sunstone.addInfoPanel("marketplace_info_panel", marketplace_info_panel);


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
                <td class="value_td">'+app['files'][0]['size']+'</td>\
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

        popDialogLoading();

        $.ajax({
            url: "/marketplace/" + id,
            type: "GET",
            dataType: "json",
            success: function(response){
                return updateMarketInfo(null, response);
            },
            error: function(response)
            {
                return onError(null, OpenNebula.Error(response));
            }
        });

        return false;
    });
}


/*
 * onlyOneCheckboxListener: Only one box can be checked
 */

function onlyOneCheckboxListener(dataTable) {
    $('tbody input.check_item', dataTable).live("change", function(){
        var checked = $('input.check_item:checked', $('tr', dataTable));
        var self = this;
        checked.each(function(){
          if(this!=self) this.checked = ''
        })
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
        "sAjaxSource": "/marketplace",
        "sAjaxDataProp": "appliances",
        "bAutoWidth":false,
        "aoColumns": [
            { "bSortable": false,
              "fnRender": function ( o, val ) {
                  return '<input class="check_item" type="checkbox" id="marketplace_'+o.aData['_id']['$oid']+'" name="selected_items" value="'+o.aData['_id']['$oid']+'"/>'
            } },
            { "mDataProp": "_id.$oid", "bVisible": false },
            { "mDataProp": "name" },
            { "mDataProp": "publisher" },
            { "mDataProp": "files.0.hypervisor"},
            { "mDataProp": "files.0.os-arch"},
            { "mDataProp": "files.0.format"},
            { "mDataProp": "tags", "bVisible": false}
          ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });


    initCheckAllBoxes(dataTable_marketplace);
    tableCheckboxesListener(dataTable_marketplace);
    onlyOneCheckboxListener(dataTable_marketplace);

    infoListenerMarket(dataTable_marketplace);
});