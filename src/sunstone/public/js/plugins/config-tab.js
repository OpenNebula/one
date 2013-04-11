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


Config = {
    "isTabEnabled": function(tab_name){
      var enabled = config['view']['tabs'][tab_name]['enabled'];
      return enabled;
    },
    "isTabActionEnabled": function(tab_name, action_name){
      var enabled = config['view']['tabs'][tab_name]['actions'][action_name];
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
    <div class="row">\
        <div class="eight columns">\
          <label class="right inline" for="lang_sel" >' + tr("Language") + ':</label>\
        </div>\
        <div class="four columns">\
           <select id="lang_sel">\
               <option value="ca">'+tr("Catalan")+'</option>\
               <option value="zh_TW">'+tr("Chinese (TW)")+'</option>\
               <option value="cs_CZ">'+tr("Czech (CZ)")+'</option>\
               <option value="en_US">'+tr("English (US)")+'</option>\
               <option value="fr_FR">'+tr("French (FR)")+'</option>\
               <option value="de">'+tr("German")+'</option>\
               <option value="el_GR">'+tr("Greek (GR)")+'</option>\
               <option value="it_IT">'+tr("Italian (IT)")+'</option>\
               <option value="fa_IR">'+tr("Persian (IR)")+'</option>\
               <option value="pt_BR">'+tr("Portuguese (BR)")+'</option>\
               <option value="pt_PT">'+tr("Portuguese (PT)")+'</option>\
               <option value="ru_RU">'+tr("Russian (RU)")+'</option>\
               <option value="sk_SK">'+tr("Slovak (SK)")+'</option>\
               <option value="es_ES">'+tr("Spanish (SP)")+'</option>\
           </select>\
        </div>\
    </div>\
    <div class="row">\
        <div class="eight columns">\
          <label class="right inline" for="view_sel" >' + tr("Views") + ':</label>\
        </div>\
        <div class="four columns">\
           <select id="view_sel">\
           </select>\
        </div>\
    </div>\
    <div class="row">\
        <div class="eight columns">\
          <label class="right inline" for="wss_checkbox" >' + tr("Secure websockets connection") + ':</label>\
        </div>\
        <div class="four columns">\
          <input id="wss_checkbox" type="checkbox" value="yes" />\
        </div>\
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


function setupConfigDialog() {
    dialogs_context.append('<div id="config_dialog"></div>');
    //Insert HTML in place
    $config_dialog = $('#config_dialog')
    var dialog = $config_dialog;
    dialog.html(config_tab_content);

    dialog.addClass("reveal-modal large max-height");

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
      var vnc_wss = $('#input#wss_checkbox', dialog).is(':checked') ? "yes" : "no";
      var default_view = $('#view_sel', dialog).val()

      OpenNebula.User.show({
        data : {
            id: uid
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


$(document).ready(function(){
  setupConfigDialog();
});