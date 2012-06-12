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
                       <option value="en_US">'+tr("English")+'</option>\
                       <option value="fr_FR">'+tr("French")+'</option>\
                       <option value="it_IT">'+tr("Italian")+'</option>\
                       <option value="pt_PT">'+tr("Portuguese")+'</option>\
                       <option value="ru">'+tr("Russian")+'</option>\
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
    },
};

var config_tab = {
    title: tr("Configuration"),
    content: config_tab_content,
    tabClass: "subTab",
    parentTab: "dashboard_tab",
};

Sunstone.addActions(config_actions);
Sunstone.addMainTab('config_tab',config_tab);


function updateConfig(request,response){
    var config = response['user_config'];

    //Set wss checkbox to correct value
    if (config["wss"] == "yes"){
        $('table#config_table input#wss_checkbox').attr('checked','checked');
    };
};

function updateWss(){
    var user_info_req = {
        data : {
            id: uid,
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
        },
    };
    OpenNebula.User.show(user_info_req);
    $.post('config',JSON.stringify({wss : ($('#config_table #wss_checkbox').is(':checked') ? "yes" : "no")}));
};

$(document).ready(function(){
    Sunstone.runAction('Config.list');

    //Set the language select to correct value
    if (lang)
        $('table#config_table #lang_sel option[value="'+lang+'"]').attr('selected','selected');

    //Listener to change language
    $('table#config_table #lang_sel').change(function(){
        setLang($(this).val());
    });

    //Listener to wss change
    $('table#config_table #wss_checkbox').change(updateWss);
});