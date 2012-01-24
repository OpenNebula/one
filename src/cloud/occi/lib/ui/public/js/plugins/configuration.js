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
<h3>' + tr("Self-Service UI Configuration") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">' + tr("Language") + '</td>\
              <td class="value_td">\
                   <select id="lang_sel" style="width:20em;">\
                       <option value="en_US">'+tr("English")+'</option>\
                       <option value="es_ES">'+tr("Spanish")+'</option>\
                   </select>\
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

$(document).ready(function(){
    if (lang)
        $('table#config_table #lang_sel option[value="'+lang+'"]').attr('selected','selected');
    $('table#config_table #lang_sel').change(function(){
        setLang($(this).val());
    });

    $('#li_config_tab').click(function(){
        hideDialog();
    });

    $('div#logo img').attr('src',logo_small);

});