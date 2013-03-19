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

var config_response = {};
var config_tab_content =
'<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-cog"></i> '+tr("Configuration")+'\
      </span>\
      <span class="header-info">\
        <span/> <small></small>&emsp;\
      </span>\
      <span class="user-login">\
      </span>\
    </h4>\
  </div>\
</div>\
</div>\
<br>\
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
        <label class="right inline" for="wss_checkbox" >' + tr("Secure websockets connection") + ':</label>\
      </div>\
      <div class="four columns">\
        <input id="wss_checkbox" type="checkbox" value="yes" />\
      </div>\
      </div>\
    </div>\
  </div>';

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
        $('input#wss_checkbox').attr('checked','checked');
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
                $('#input#wss_checkbox').is(':checked') ? "yes" : "no";
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
    $.post('config',JSON.stringify({wss : ($('input#wss_checkbox').is(':checked') ? "yes" : "no")}));
};

$(document).ready(function(){
    Sunstone.runAction('Config.list');

    //Set the language select to correct value
    if (lang)
        $('#lang_sel option[value="'+lang+'"]').attr('selected','selected');

    //Listener to change language. setLang in locale.js
    $('#lang_sel').change(function(){
        setLang($(this).val());
    });

    //Listener to wss change
    $('#wss_checkbox').change(updateWss);
});