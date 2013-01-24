/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             */
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

var config_response = {};
var config_tab_content =
'<form>\
<table id="config_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Sunstone UI Configuration") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">' + tr("Language") + '</td>\
              <td class="value_td">\
                   <select id="lang_sel" style="width:20em;">\
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
              </td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Secure websockets connection") + '</td>\
              <td class="value_td">\
                   <input id="wss_checkbox" type="checkbox" value="yes" />\
              </td>\
            </tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
<div class="legend_div" style="position:relative;left:13px;bottom:5px;">\
  <span>?</span>\
  <p class="legend_p">\
'+tr("These options are stored in your OpenNebula user template.")+'\
  </p>\
  <p class="legend_p">\
'+tr("WSS connection requires additional configuration of Sunstone Server and that the SSL certificate is considered valid by your browser.")+'\
  </p>\
</div>\
</form>';

var config_actions = {
    "Config.list" : {
        type: "list",
        call: OpenNebula.Config.list,
        callback: updateConfig,
        error: onError
    }
};

var config_tab = {
    title: tr("Configuration"),
    content: config_tab_content,
    tabClass: "subTab",
    parentTab: "dashboard_tab"
};

Sunstone.addActions(config_actions);
Sunstone.addMainTab('config_tab',config_tab);

// Callback when configuration list is received
function updateConfig(request,response){
    config_response = response

    //Set wss checkbox to correct value
    if (config_response['user_config']["wss"] == "yes"){
        $('table#config_table input#wss_checkbox').attr('checked','checked');
    };
};

// Update secure websockets configuration
// First we perform a User.show(). In the callback we update the user template
// to include this parameter.
// Then we post to the server configuration so that it is saved for the session
// Note: the session is originally initialized to the user VNC_WSS if present
// otherwise it is set according to sunstone configuration
// TO DO improve this, server side should take care
function updateWss(){
    var user_info_req = {
        data : {
            id: uid
        },
        success: function(req,user_json) {
            var template = user_json.USER.TEMPLATE;
            var template_str="";
            template['VNC_WSS']=
                $('#config_table #wss_checkbox').is(':checked') ? "yes" : "no";
            //convert json to ONE template format - simple conversion
            $.each(template,function(key,value){
                template_str += (key + '=' + '"' + value + '"\n');
            });

            var request = {
                data: {
                    id: uid,
                    extra_param: template_str
                },
                error: onError
            };
            OpenNebula.User.update(request);
        }
    };
    OpenNebula.User.show(user_info_req);
    $.post('config',JSON.stringify({wss : ($('#config_table #wss_checkbox').is(':checked') ? "yes" : "no")}));
};

$(document).ready(function(){
    Sunstone.runAction('Config.list');

    //Set the language select to correct value
    if (lang)
        $('table#config_table #lang_sel option[value="'+lang+'"]').attr('selected','selected');

    //Listener to change language. setLang in locale.js
    $('table#config_table #lang_sel').change(function(){
        setLang($(this).val());
    });

    //Listener to wss change
    $('table#config_table #wss_checkbox').change(updateWss);
});