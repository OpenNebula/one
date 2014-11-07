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

var user_cookie = cookie["one-user"];

setInterval(function(){
    if (whichUI() == "sunstone") {
        var user_cookie = cookie["one-user"];
        readCookie();
        if ((cookie["one-user"] == null) || (cookie["one-user"] !== user_cookie)) {
            window.location.href='/';
        }
    }
},5000);

Config = {
    "isTabEnabled": function(tab_name){
      var enabled = config['view']['enabled_tabs'][tab_name];
      return enabled;
    },
    "isTabActionEnabled": function(tab_name, action_name, panel_name){
      var enabled;
      if (panel_name) {
        enabled = config['view']['tabs'][tab_name]['panel_tabs_actions'][panel_name][action_name];
      } else {
        enabled = config['view']['tabs'][tab_name]['actions'][action_name];
      }

      return enabled;
    },

    "isTabPanelEnabled": function(tab_name, panel_tab_name){
      if (config['view']['tabs'][tab_name]) {
        var enabled = config['view']['tabs'][tab_name]['panel_tabs'][panel_tab_name];
        return enabled;
      } else {
        return false;
      }
    },

    "tabTableColumns": function(tab_name){
      var columns = config['view']['tabs'][tab_name]['table_columns'];

      if (columns) {
        return columns;
      }
      else {
        return [];
      }
    },

    "isTemplateCreationTabEnabled": function(template_tab_name){
      if (config['view']['tabs']['templates-tab']){
        var enabled = config['view']['tabs']['templates-tab']['template_creation_tabs'][template_tab_name];
        return enabled;
      } else {
        return false;
      }
    },

    "dashboardWidgets": function(per_row){
      var widgets = config['view']['tabs']['dashboard-tab'][per_row];

      if (widgets) {
        return widgets;
      }
      else {
        return [];
      }
    },

    "tableOrder": function(){
        return config['user_config']["table_order"];
    },

    "provision": {
      "dashboard": {
        "isEnabled": function(widget) {
          if (config['view']['tabs']['provision-tab']){
            var enabled = config['view']['tabs']['provision-tab']['dashboard'][widget];
            return enabled;
          } else {
            return false;
          }
        }
      },
      "logo": (config['view']["provision_logo"] || "images/one_small_logo.png")
    }
}

var config_response = {};
var config_tab_content =
'<div class="row">\
    <div class="large-6 columns">\
      <h3 id="configuration_dialog" class="subheader">'+tr("Configuration")+'</h3>\
    </div>\
    <div class="large-6 columns">\
      <dl class="tabs right-info-tabs text-center right" data-tab>\
           <dd class="active"><a href="#info_configuration"><i class="fa fa-info-circle"></i><br>'+tr("Info")+'</a></dd>\
           <dd><a href="#conf_configuration"><i class="fa fa-cog"></i><br>'+tr("Conf")+'</a></dd>\
           <dd><a href="#quotas_configuration"><i class="fa fa-align-left"></i><br>'+tr("Quotas")+'</a></dd>\
      </dl>\
    </div>\
</div>\
<div class="reveal-body">\
  <form id="config_form" class="tabs-content">\
  <div class="tabs-content">\
    <div id="info_configuration" class="content active">\
      <div class="row">\
        <div class="large-7 columns">\
            <table id="user_information" class="dataTable extended_table">\
                <thead>\
                   <tr><th colspan="3">' + tr("User information") +'</th></tr>\
                </thead>\
                <tbody>\
                </tbody>\
            </table>\
        </div>\
      </div>\
      <div class="row">\
        <div id="setting_user_template" class="large-12 columns">'+
          '<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
            '</span>'+
          '</div>'+
        '</div>\
      </div>\
    </div>\
    <div id="conf_configuration" class="row content">\
        <div class="large-5 columns">\
          <div class="row">\
              <label for="lang_sel" >' + tr("Language") + ':\
                <select id="lang_sel">'+
                  language_options +
                '</select>\
              </label>\
          </div>\
          <div class="row">\
                <label for="view_sel" >' + tr("Views") + ':\
                   <select id="view_sel">\
                   </select>\
                </label>\
          </div>\
          <div class="row">\
                <label for="table_order" >' + tr("Default Table order") + ':\
                   <select id="table_order">\
                     <option value="asc">ascending</option>\
                     <option value="desc">descending</option>\
                   </select>\
                </label>\
          </div>\
          <div class="row">\
                <label for="wss_checkbox" >' + tr("VNC Secure websockets") + ':\
                  <input id="wss_checkbox" type="checkbox" value="yes" />\
                </label>\
          </div>\
      </div>\
    </div>\
    <div id="quotas_configuration" class="row content">\
      <div class="large-12 columns">\
          <dl class="tabs" data-tab>\
            <dd class="active"><a href="#user_quotas">User Quotas</a></dd>\
            <dd><a href="#group_quotas">Group Quotas</a></dd>\
          </dl>\
          <div class="tabs-content">\
            <div class="content active" id="user_quotas">\
            </div>\
            <div id="group_quotas" class="content">\
              <div class="row">\
                <div class="large-6 columns">\
                  <label>' + tr("Select group") + ':\
                    <select id="quota_group_sel">\
                    </select>\
                  </label>\
                </div>\
              </div>\
              <div id="group_quotasTabBody" class="row">\
              </div>\
            </div>\
          </div>\
      </div>\
    </div>\
    </div>\
    <div class="reveal-footer">\
        <div class="form_buttons">\
          <button class="button radius right success" id="config_submit" type="button" value="">'+tr("Update config")+'</button>\
        </div>\
    </div>\
  </form>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>';


var settings_update_password = '<div class="row">\
  <div class="large-12 columns">\
    <h3 id="create_vnet_header" class="subheader">'+tr("Update Password")+'</h3>\
  </div>\
</div>\
<form id="settings_update_password_form" action="">\
      <div class="row ">\
          <div class="large-12 columns">\
              <label for="new_password">'+tr("New password")+'</label>\
              <input type="password" name="new_password" id="new_password" />\
          </div>\
      </div>\
      <div class="row centered">\
          <div class="large-12 columns">\
              <label for="confirm_password">'+tr("Confirm Password")+'</label>\
              <input type="password" name="confirm_password" id="confirm_password" />\
          </div>\
      </div>\
      <div class="form_buttons">\
          <button class="button radius right success" id="update_pw_submit" type="submit" value="User.update">'+tr("Change")+'</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';


Sunstone.addActions({
    "UserSettings.update_template" : {
        type: "single",
        call: OpenNebula.User.update,
        callback: function(request) {
            fillUserInfo();
        },
        error: onError
    },
    "UserSettings.passwd" : {
        type: "multiple",
        call: OpenNebula.User.passwd,
        callback: function(req,res){
        },
        error: onError
    }
});

function setupUpdatePassword() {
    dialogs_context.append('<div title="'+tr("Change password")+'" id="settings_update_password"></div>');
    var dialog = $('#settings_update_password',dialogs_context);
    dialog.html(settings_update_password);

    dialog.addClass("reveal-modal").attr("data-reveal", "");

    $('#update_password').live('click', function(){
        $('#settings_update_password',dialogs_context).foundation().foundation('reveal', 'open');
        return false;
    });

    $('#settings_update_password_form',dialog).submit(function(){
        var pw=$('#new_password',this).val();
        var confirm_password=$('#confirm_password',this).val();

        if (!pw.length){
            notifyError(tr("Fill in a new password"));
            return false;
        }

        if (pw !== confirm_password){
            notifyError(tr("Passwords do not match"));
            return false;
        }

        Sunstone.runAction("UserSettings.passwd",[-1],pw);
        dialog.foundation('reveal', 'close');
        return false;
    });
}

function setupConfigDialog() {
    dialogs_context.append('<div id="config_dialog"></div>');
    //Insert HTML in place
    $config_dialog = $('#config_dialog')
    var dialog = $config_dialog;
    dialog.html(config_tab_content);

    dialog.addClass("reveal-modal large max-height").attr("data-reveal", "");

    setupTips(dialog);

    if (config['user_config']["vnc_wss"] == "yes"){
        $('input#wss_checkbox').attr('checked','checked');
    };

    $('#table_order option[value="'+config['user_config']["table_order"]+'"]', dialog).attr('selected','selected');

    $('#lang_sel option[value="'+config['user_config']["lang"]+'"]', dialog).attr('selected','selected');

    $.each( config['available_views'], function(id, view) {
      $('select#view_sel', $config_dialog).append('<option value="'+view+'">'+view+'</option>')
    });

    $('#view_sel option[value="'+config['user_config']["default_view"]+'"]', dialog).attr('selected','selected');

    $('#config_submit', dialog).live('click',function(){
      var lang = $('#lang_sel', dialog).val();
      var vnc_wss = $('input#wss_checkbox', dialog).is(':checked') ? "yes" : "no";
      var table_order = $('#table_order', dialog).val();
      var default_view = $('#view_sel', dialog).val();

      OpenNebula.User.show({
        data : {
            id: "-1"
        },
        success: function(request,user_json){
          var template = user_json.USER.TEMPLATE;

          template["LANG"] = lang;
          template['VNC_WSS'] = vnc_wss;
          template['TABLE_ORDER'] = table_order;
          template["DEFAULT_VIEW"] = default_view;

          template_str = "";
          $.each(template,function(key,value){
            template_str += (key + '=' + '"' + value + '"\n');
          });

          var data = OpenNebula.Helper.action('update', {"template_raw" : template_str });

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(){
                window.location.href = ".";
            },
            error: function(response){
            }
          });
        }
      })
    });

    $("#quota_group_sel").die();

    $("#quota_group_sel").live("change", function() {
        var value_str = $('select#quota_group_sel').val();
        if(value_str!="")
        {
            fillGroupQuotas(value_str)
        }
    });
}

function updateUserConfigInfo(request,user_json) {
    var info = user_json.USER;

    var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS);

    var quotas_tab_html = initQuotasPanel(info, default_user_quotas,
                                        "#user_quotas", false);

    $("#user_quotas").html(quotas_tab_html);

    setupQuotasPanel(info,
        "#user_quotas",
        false,
        "User");

    $("#user_information tbody").html('<tr>\
        <td class="key_td">' + tr("ID") + '</td>\
        <td class="value_td" colspan="2">'+info.ID+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Name") + '</td>\
        <td class="value_td" colspan="2">'+info.NAME+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Group ID") + '</td>\
        <td class="value_td" colspan="2">'+info.GID+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Group") + '</td>\
        <td class="value_td_group">'+ info.GNAME +'</td>\
        <td>\
            <div id="div_edit_chg_group">\
                <a id="div_edit_chg_group_link" class="edit_e" href="#"><i class="fa fa-pencil-square-o right"/></a>\
            </div>\
        </td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Secondary groups") + '</td>\
        <td class="value_td" colspan="2">'+(typeof info.GROUPS.ID == "object" ? info.GROUPS.ID.join(",") : "-")+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Password") + '</td>\
        <td class="value_td" colspan="2"><button id="update_password" type="button" class="button tiny radius" >' + tr("Update password") + '</button></td>\
    </tr>')

    $("#setting_user_template").html(
        insert_extended_template_table(info.TEMPLATE,
                                          "UserSettings",
                                          "-1",
                                          tr("Custom Attributes"))
    )

    $("#div_edit_chg_group_link").die();
    $("#group_confirm_select").die();

    // Listener for key,value pair edit action
    $("#div_edit_chg_group_link").live("click", function() {
        // TODO: do not call group.list again, use the callback from
        // $("span.user-login a.configuration").click
        OpenNebula.Group.list(
        {
            success: function(request, group_list) {
                var value_str = $(".value_td_group").text();
                var select_str='<select style="margin: 10px 0;" id="group_confirm_select">';

                $.each(group_list,function(){
                    select_str +='<option elem_id="'+this.GROUP.ID
                        +'" value="'+this.GROUP.ID+'">'
                        +this.GROUP.NAME+' (id:'+this.GROUP.ID+')</option>';
                });

                select_str+="</select>";
                $(".value_td_group").html(select_str);
                $("select#group_confirm_select").val(info.GID);
            },
            error: onError
        })
    });

    $("#group_confirm_select").live("change", function() {
        var value_str = $('select#group_confirm_select').val();
        if(value_str!="")
        {
            // Let OpenNebula know
            var resource_struct = new Array();
            resource_struct[0]  = info.ID;
            Sunstone.runAction("User.chgrp",resource_struct,value_str);
            fillUserInfo();
        }
    });
}

function fillGroupQuotas(group_id){
      OpenNebula.Group.show({
        data : {
            id: group_id
        },
        success: function(request,group_json){
            var info = group_json.GROUP;

            var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);

            var quotas_tab_html = initQuotasPanel(info, default_group_quotas,
                                                "#group_quotasTabBody", false);

            $("#group_quotasTabBody").html(quotas_tab_html);

            setupQuotasPanel(info,
                "#group_quotasTabBody",
                false,
                "Group");

            $("select#quota_group_sel").val(info.ID);
        }
      });
}

function fillUserInfo(){
    OpenNebula.User.show({
        data : {
            id: '-1'
        },
        success: updateUserConfigInfo
    });
}

$(document).ready(function(){
    setupConfigDialog();
    setupUpdatePassword();

    $(".user-zone-info a.configuration").click(function(){
        $(document).foundation('dropdown', 'closeall');
        fillUserInfo();

        OpenNebula.Group.list(
        {
            success: function(request, group_list) {
                var group_dropdown_options = "";
                $.each(group_list,function(){
                    group_dropdown_options +=
                        '<option elem_id="'+this.GROUP.ID
                        +'" value="'+this.GROUP.ID+'">'
                        +this.GROUP.NAME+' (id:'+this.GROUP.ID+')</option>';
                });

                $('select#quota_group_sel', $config_dialog).html(group_dropdown_options);

                fillGroupQuotas('-1');
            }
        });

        $config_dialog.foundation().foundation('reveal', 'open');
    });
});
