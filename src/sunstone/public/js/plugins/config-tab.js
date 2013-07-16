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

var user_cookie = $.cookie("one-user");

setInterval(function(){
    if (whichUI() == "sunstone") {
        var user_cookie = cookie["one-user"];
        readCookie();
        if ((cookie["one-user"] == null) || (cookie["one-user"] !== user_cookie)) {
            window.location.href='/';
        }
    } else if (whichUI() == "ozones") {
        var user_cookie = cookie["ozones-user"];
        readCookie();
        if ((cookie["ozones-user"] == null) || (cookie["ozones-user"] !== user_cookie)) {
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
      var enabled = config['view']['tabs'][tab_name]['panel_tabs'][panel_tab_name];
      return enabled;
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
      var enabled = config['view']['tabs']['templates-tab']['template_creation_tabs'][template_tab_name];
      return enabled;
    },

    "dashboardWidgets": function(per_row){
      var widgets = config['view']['tabs']['dashboard-tab'][per_row];

      if (widgets) {
        return widgets;
      }
      else {
        return [];
      }
    }
}

var config_response = {};
var config_tab_content =
'<div class="panel">\
    <h3>\
      <small id="configuration_dialog">'+tr("Configuration")+'</small>\
    </h3>\
  </div>\
  <div class="reveal-body">\
  <form id="config_form">\
    <div class="row">\
        <div class="six columns">\
            <table id="user_information" class="twelve datatable extended_table">\
                <thead>\
                   <tr><th colspan="2">' + tr("User information") +'</th></tr>\
                </thead>\
                <tbody>\
                </tbody>\
            </table>\
            <div id="setting_user_template"></div>\
        </div>\
        <div class="six columns">\
        <div class="row">\
          <div class="six columns">\
            <label class="right inline" for="lang_sel" >' + tr("Language") + ':</label>\
          </div>\
          <div class="six columns">\
             <select id="lang_sel">\
                 <option value="en_US">English (en_US)</option>\
                 <option value="ca">Catalan (ca)</option>\
                 <option value="cs_CZ">Czech (cs_CZ)</option>\
                 <option value="nl_NL">Dutch (nl_NL)</option>\
                 <option value="da">Danish (da)</option>\
                 <option value="fr_FR">French (fr_FR)</option>\
                 <option value="de">German (de)</option>\
                 <option value="el_GR">Greek (el_GR)</option>\
                 <option value="it_IT">Italian (el_GR)</option>\
                 <option value="fa_IR">Persian (fa_IR)</option>\
                 <option value="pl">Polish (pl)</option>\
                 <option value="pt_BR">Portuguese (pt_BR)</option>\
                 <option value="pt_PT">Portuguese (pt_PT)</option>\
                 <option value="ru_RU">Russian (ru_RU)</option>\
                 <option value="zh_CN">Simplified Chinese (zh_CN)</option>\
                 <option value="sk_SK">Slovak (sk_SK)</option>\
                 <option value="es_ES">Spanish (es_ES)</option>\
                 <option value="zh_TW">Traditional Chinese (zh_TW)</option>\
             </select>\
          </div>\
        </div>\
        <div class="row">\
            <div class="six columns">\
              <label class="right inline" for="view_sel" >' + tr("Views") + ':</label>\
            </div>\
            <div class="six columns">\
               <select id="view_sel">\
               </select>\
            </div>\
        </div>\
        <div class="row">\
            <div class="six columns">\
              <label class="right inline" for="wss_checkbox" >' + tr("VNC Secure websockets") + ':</label>\
            </div>\
            <div class="six columns">\
              <input id="wss_checkbox" type="checkbox" value="yes" />\
            </div>\
        </div>\
        <div class="">\
            <dl class="tabs">\
              <dd class="active"><a href="#user_quotas">User Quotas</a></dd>\
              <dd><a href="#group_quotas">Group Quotas</a></dd>\
            </dl>\
            <ul class="tabs-content">\
              <li class="active" id="user_quotasTab"></li>\
              <li id="group_quotasTab"></li>\
            </ul>\
        </div>\
      </div>\
    </div>\
    <div class="reveal-footer">\
        <hr>\
        <div class="form_buttons">\
          <button class="button radius right success" id="config_submit" type="button" value="">'+tr("Update config")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
        </div>\
    </div>\
  </form>\
  </div>\
  <a class="close-reveal-modal">&#215;</a>';


var settings_update_password = '<div class="panel">\
  <h3>\
    <small id="create_vnet_header">'+tr("Update Password")+'</small>\
  </h3>\
</div>\
<form id="settings_update_password_form" action="">\
      <div class="row centered">\
          <div class="four columns">\
              <label class="inline right" for="new_password">'+tr("New password")+':</label>\
          </div>\
          <div class="seven columns">\
              <input type="password" name="new_password" id="new_password" />\
          </div>\
          <div class="one columns">\
              <div class=""></div>\
          </div>\
      </div>\
      <hr>\
      <div class="form_buttons">\
          <button class="button radius right success" id="update_pw_submit" type="submit" value="User.update">'+tr("Change")+'</button>\
          <button class="close-reveal-modal button secondary radius" type="button" value="close">' + tr("Close") + '</button>\
      </div>\
  <a class="close-reveal-modal">&#215;</a>\
</form>';


Sunstone.addActions({
    "UserSettings.update_template" : {
        type: "single",
        call: OpenNebula.User.update,
        callback: function(request) {
            notifyMessage(tr("Template updated correctly"));
            OpenNebula.User.show({
                data : {
                    id: "-1"
                },
                success: updateUserConfigInfo
              });
        },
        error: onError
    },
    "UserSettings.passwd" : {
        type: "multiple",
        call: OpenNebula.User.passwd,
        callback: function(req,res){
            notifyMessage(tr("Change password successful"));
        },
        error: onError
    }
});

function setupUpdatePassword() {
    dialogs_context.append('<div title="'+tr("Change password")+'" id="settings_update_password"></div>');
    var dialog = $('#settings_update_password',dialogs_context);
    dialog.html(settings_update_password);

    dialog.addClass("reveal-modal");

    $('#update_password').live('click', function(){
        $('#settings_update_password',dialogs_context).reveal();
        return false;
    });

    $('#settings_update_password_form',dialog).submit(function(){
        var pw=$('#new_password',this).val();

        if (!pw.length){
            notifyError(tr("Fill in a new password"));
            return false;
        }

        Sunstone.runAction("UserSettings.passwd",[-1],pw);
        $('#settings_update_password',dialogs_context).trigger("reveal:close")
        return false;
    });
}

function setupConfigDialog() {
    dialogs_context.append('<div id="config_dialog"></div>');
    //Insert HTML in place
    $config_dialog = $('#config_dialog')
    var dialog = $config_dialog;
    dialog.html(config_tab_content);

    dialog.addClass("reveal-modal xlarge max-height");

    setupTips(dialog);

    if (config['user_config']["vnc_wss"] == "yes"){
        $('input#wss_checkbox').attr('checked','checked');
    };

    $('#lang_sel option[value="'+config['user_config']["lang"]+'"]', dialog).attr('selected','selected');

    $.each( config['available_views'], function(id, view) {
      $('select#view_sel', $config_dialog).append('<option value="'+view+'">'+view+'</option>')
    });

    $('#view_sel option[value="'+config['user_config']["default_view"]+'"]', dialog).attr('selected','selected');

    $('#config_submit', dialog).live('click',function(){
      var lang = $('#lang_sel', dialog).val();
      var vnc_wss = $('input#wss_checkbox', dialog).is(':checked') ? "yes" : "no";
      var default_view = $('#view_sel', dialog).val()

      OpenNebula.User.show({
        data : {
            id: "-1"
        },
        success: function(request,user_json){
          var template = user_json.USER.TEMPLATE;

          template["LANG"] = lang;
          template['VNC_WSS'] = vnc_wss;
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
}

function tr(str){
    var tmp = locale[str];
    if ( tmp == null || tmp == "" ) {
        //console.debug("Missing translation: "+str);
        tmp = str;
    }
    return tmp;
};

function updateUserConfigInfo(request,user_json) {
    var info = user_json.USER;

    var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS)
    var quotas_tab_html = Quotas.vms(info, default_user_quotas);
    quotas_tab_html += Quotas.cpu(info, default_user_quotas);
    quotas_tab_html += Quotas.memory(info, default_user_quotas);
    quotas_tab_html += Quotas.image(info, default_user_quotas);
    quotas_tab_html += Quotas.network(info, default_user_quotas);
    quotas_tab_html += Quotas.datastore(info, default_user_quotas);

    $("#user_quotasTab").html(quotas_tab_html);

    $("#user_information tbody").html('<tr>\
        <td class="key_td">' + tr("ID") + '</td>\
        <td class="value_td">'+info.ID+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Name") + '</td>\
        <td class="value_td">'+info.NAME+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Group ID") + '</td>\
        <td class="value_td">'+info.GID+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Group Name") + '</td>\
        <td class="value_td">'+info.GNAME+'</td>\
    </tr>\
    <tr>\
        <td class="key_td">' + tr("Password") + '</td>\
        <td class="value_td"><button id="update_password" type="button" class="button tiny secondary radius" >' + tr("Update password") + '</button></td>\
    </tr>')

    $("#setting_user_template").html(
        insert_extended_template_table(info.TEMPLATE,
                                          "UserSettings",
                                          "-1",
                                          tr("Custom Attributes"))
    )
}

$(document).ready(function(){
  setupConfigDialog();
  setupUpdatePassword();

  $("span.user-login a.configuration").click(function(){
      OpenNebula.User.show({
        data : {
            id: '-1'
        },
        success: updateUserConfigInfo
      });

      OpenNebula.Group.show({
        data : {
            id: '-1'
        },
        success: function(request,group_json){
            var info = group_json.GROUP;

            var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS)
            var quotas_tab_html = Quotas.vms(info, default_group_quotas);
            quotas_tab_html += Quotas.cpu(info, default_group_quotas);
            quotas_tab_html += Quotas.memory(info, default_group_quotas);
            quotas_tab_html += Quotas.image(info, default_group_quotas);
            quotas_tab_html += Quotas.network(info, default_group_quotas);
            quotas_tab_html += Quotas.datastore(info, default_group_quotas);

            $("#group_quotasTab").html(quotas_tab_html);
        }
      });

      $config_dialog.reveal();
  });
});