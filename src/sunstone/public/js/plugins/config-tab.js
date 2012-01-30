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
</table></form>';

var config_tab = {
    title: tr("Configuration"),
    content: config_tab_content
}

Sunstone.addMainTab('config_tab',config_tab);

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
};

$(document).ready(function(){
    if (lang)
        $('table#config_table #lang_sel option[value="'+lang+'"]').attr('selected','selected');
    $('table#config_table #lang_sel').change(function(){
        setLang($(this).val());
    });

    $('table#config_table #wss_checkbox').change(updateWss);

    $.get('config/wss',function(response){
        if (response != "no")
            $('table#config_table input#wss_checkbox').attr('checked','checked');
    });
});