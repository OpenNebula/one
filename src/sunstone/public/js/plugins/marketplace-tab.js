/*Users tab plugin*/
var dataTable_marketplace;
/*var users_select="";
var $create_user_dialog;
var $update_pw_dialog;*/

function infoListenerMarket(dataTable){
    $('tbody tr',dataTable).live("click",function(e){
        if ($(e.target).is('input')) {return true;}

        var aData = dataTable.fnGetData(this);
        var id = aData["_id"]["$oid"];
        if (!id) return true;
console.log(id);
        popDialogLoading();

        $.ajax({
            url: "/marketplace/" + id,
            type: "GET",
            dataType: "json",
            success: function(response){
                return updateMarketInfo(null,response);
            },
            error: function(response)
            {
                return null;
            }
        });

        return false;
    });
}

var user_actions = {
    "Marketplace.refresh" : {
        type: "custom",
        call: function () {
            waitingNodes(dataTable_users);
            Sunstone.runAction("User.list");
        },
    },
    "Marketplace.autorefresh" : {
        type: "custom",
        call: function(){
            OpenNebula.User.list({
                timeout: true,
                success: updateUsersView,
                error: onError
            });
        }
    },
    "Marketplace.showinfo" : {
        type: "single",
        call: OpenNebula.User.show,
        callback: updateUserInfo,
        error: onError
    },
}

var user_buttons = {
    "Marketplace.refresh" : {
        type: "image",
        text: tr("Refresh list"),
        img: "images/Refresh-icon.png"
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
      <th>'+tr("ID")+'</th>\
      <th>'+tr("Name")+'</th>\
      <th>'+tr("Publisher")+'</th>\
      <th>'+tr("Hypervisor")+'</th>\
      <th>'+tr("Arch")+'</th>\
      <th>'+tr("Format")+'</th>\
    </tr>\
  </thead>\
  <tbody id="tbodymarketplace">\
  </tbody>\
</table>\
</div>';


var marketplace_tab = {
    title: tr("Marketplace"),
    content: marketplace_tab_content
};

Sunstone.addMainTab('marketplace_tab',marketplace_tab);



var marketplace_info_panel = {
    "marketplace_info_tab" : {
        title: tr("Appliance information"),
        content:""
    },
};

Sunstone.addInfoPanel("marketplace_info_panel",marketplace_info_panel);



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
                 </tbody>\
                </table>\
                <table id="info_marketplace_table2" class="info_table">\
                   <thead>\
                     <tr><th colspan="2">'+tr("Description")+'</th></tr>\
                   </thead>\
                   <tbody>\
                      <tr>\
                        <td class="value_td">'+app['description']+'</td>\
                      </tr>\
                    </tbody>\
                </table>'
    };

    Sunstone.updateInfoPanelTab("marketplace_info_panel","marketplace_info_tab",info_tab);
    Sunstone.popUpInfoPanel("marketplace_info_panel");
};


$(document).ready(function(){

    //prepare host datatable
    dataTable_marketplace = $("#datatable_marketplace",main_tabs_context).dataTable({
        "bJQueryUI": true,
        "bSortClasses": false,
        "sPaginationType": "full_numbers",
        "sDom" : '<"H"lfrC>t<"F"ip>',
        "sAjaxSource": "/marketplace",
        "sAjaxDataProp": "appliances",
        "oColVis": {
            "aiExclude": [ 0 ]
        },
        "bAutoWidth":false,
        "aoColumns": [
            { "mDataProp": "_id.$oid", "bVisible": false },
            { "mDataProp": "name" },
            { "mDataProp": "publisher" },
            { "mDataProp": "files.0.hypervisor"},
            { "mDataProp": "files.0.os-arch"},
            { "mDataProp": "files.0.format"}
          ],
        "oLanguage": (datatable_lang != "") ?
            {
                sUrl: "locale/"+lang+"/"+datatable_lang
            } : ""
    });

    infoListenerMarket(dataTable_marketplace);
});