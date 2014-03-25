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

var quotas_tab_actions = {
    "Quotas.refresh" : {
        type: "custom",
        call: refreshQuotasTab
    }
}

var quotas_tab_buttons = {
    "Quotas.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Sunstone.toggle_top" : {
        type: "custom",
        layout: "top",
        alwaysActive: true
    }
}

var quotas_tab_content = 
'<div id="quotas_tab_body" class="row content">\
  <div class="large-12 columns">\
      <dl class="tabs" data-tab>\
        <dd class="active"><a href="#quotas_tab_user">User Quotas</a></dd>\
        <dd><a href="#quotas_tab_group">Group Quotas</a></dd>\
      </dl>\
      <div class="tabs-content">\
        <div class="content active" id="quotas_tab_user">\
          <div class="large-12 columns">\
            <p class="subheader">'+tr("No quotas defined")+'</p>\
          </div>\
        </div>\
        <div id="quotas_tab_group" class="content">\
          <div class="row">\
            <div class="large-6 columns">\
              <label>' + tr("Select group") + ':\
                <div id="quotas_tab_group_sel">\
                </div>\
              </label>\
            </div>\
          </div>\
          <div id="quotas_tab_group_TabBody" class="row">\
            <div class="large-12 columns">\
              <p class="subheader">'+tr("No quotas defined")+'</p>\
            </div>\
          </div>\
        </div>\
      </div>\
  </div>\
</div>';


var quotas_tab = {
    title: '<i class="fa fa-align-left"></i>'+tr("Quotas"),
    buttons: quotas_tab_buttons,
    content: quotas_tab_content,
    showOnTopMenu: false,
    list_header: '<i class="fa fa-tachometer"></i> '+tr("Quotas")
}

Sunstone.addActions(quotas_tab_actions);
Sunstone.addMainTab('quotas-tab',quotas_tab);

var $quotas_tab;


function fillUserInfo(){
    OpenNebula.User.show({
        data : {
            id: '-1'
        },
        success: updateUserQuotasInfo
    });
}

function updateUserQuotasInfo(request,user_json) {
    var info = user_json.USER;

    var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS)
    var quotas_tab_html = Quotas.vms(info, default_user_quotas);
    quotas_tab_html += Quotas.cpu(info, default_user_quotas);
    quotas_tab_html += Quotas.memory(info, default_user_quotas);
    quotas_tab_html += Quotas.volatile_size(info, default_user_quotas);
    quotas_tab_html += Quotas.image(info, default_user_quotas);
    quotas_tab_html += Quotas.network(info, default_user_quotas);
    quotas_tab_html += Quotas.datastore(info, default_user_quotas);

    if (quotas_tab_html == ""){
        quotas_tab_html =
        '<div class="large-12 columns">\
            <p class="subheader">'+tr("No quotas defined")+'</p>\
        </div>'
    }

    $("#quotas_tab_user", $quotas_tab).html(quotas_tab_html);
}

function fillGroupQuotasInfo(group_id){
      OpenNebula.Group.show({
        data : {
            id: group_id
        },
        success: updateGroupQuotasInfo
      });
}

function updateGroupQuotasInfo(request,group_json){
    var info = group_json.GROUP;

    var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);

    var quotas_tab_html = Quotas.vms(info, default_group_quotas);
    quotas_tab_html += Quotas.cpu(info, default_group_quotas);
    quotas_tab_html += Quotas.memory(info, default_group_quotas);
    quotas_tab_html += Quotas.volatile_size(info, default_group_quotas);
    quotas_tab_html += Quotas.image(info, default_group_quotas);
    quotas_tab_html += Quotas.network(info, default_group_quotas);
    quotas_tab_html += Quotas.datastore(info, default_group_quotas);

    if (quotas_tab_html == ""){
        quotas_tab_html =
        '<div class="large-12 columns">\
            <p class="subheader">'+tr("No quotas defined")+'</p>\
        </div>'
    }

    $("#quotas_tab_group_TabBody", $quotas_tab).html(quotas_tab_html);
}

function refreshQuotasTab(){
    fillUserInfo();

    gid = $("#quotas_tab_group_sel .resource_list_select", $quotas_tab).val();

    if (gid == ""){
        gid = "-1";
    }

    fillGroupQuotasInfo(gid);

    insertSelectOptions('div#quotas_tab_group_sel', $quotas_tab, "Group", gid, false);
}

$(document).ready(function(){
    $quotas_tab = $('#quotas-tab', main_tabs_context);

    $quotas_tab.off("change", "#quotas_tab_group_sel .resource_list_select");
    $quotas_tab.on("change", "#quotas_tab_group_sel .resource_list_select", function() {
        var value_str = $(this).val();
        if(value_str!="")
        {
            fillGroupQuotasInfo(value_str);
        }
    });

    fillUserInfo();

    OpenNebula.Group.show({
        data : {
            id: '-1'
        },
        success: function(request, group_json){
            updateGroupQuotasInfo(request, group_json);

            insertSelectOptions('div#quotas_tab_group_sel', $quotas_tab, "Group", group_json.GROUP.ID, false);
        }
    });
});
