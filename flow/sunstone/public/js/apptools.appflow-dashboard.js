// ------------------------------------------------------------------------ //
// Copyright 2010-2013, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the Apache License, Version 2.0 (the "License"); you may  //
// not use this file except in compliance with the License. You may obtain  //
// a copy of the License at                                                 //
//                                                                          //
// http://www.apache.org/licenses/LICENSE-2.0                               //
//                                                                          //
// Unless required by applicable law or agreed to in writing, software      //
// distributed under the License is distributed on an "AS IS" BASIS,        //
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. //
// See the License for the specific language governing permissions and      //
// limitations under the License.                                           //
//------------------------------------------------------------------------- //

function updateAppFlowDashboard(what, json_info){
    var db = $('#appflow_dashboard_tab',main_tabs_context);
    switch (what){
    case "templates":
        $('#appflow_total_templates',db).html(json_info.length);
        break;
    case "services":
        $('#appflow_total_services',db).html(json_info.length);
        break;
    };
}

var appflow_dashboard_tmpl = '\
<table class="dashboard_table" id="appflow_dashboard">\
<tr>\
<td style="width:50%">\
<table id="system_information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of AppFlow resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">Templates</td>\
              <td class="value_td"><span id="appflow_total_templates"></span></td>\
            <tr>\
            </tr>\
              <td class="key_td">Services</td>\
              <td class="value_td"><span id="appflow_total_services"></span></td>\
            </tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Quickstart") + '</h3>\
        <div class="panel_info dashboard_p">\
             <ul>\
                <li><a class="action_button" href="#service_templates_tab" value="ServiceTemplate.create_dialog">Create a new Service Template</a></li>\
             </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td style="width:50%">\
<table id="table_right" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Appflow - A tool to manage environments") + '</h3>\
        <div class="panel_info">\
            <p>\
              <img src="images/appflow_icon.png" height="80px" style="float:right;margin:0px 15px 15px 15px;" alt="appflow logo"/>\
              AppFlow enables the automatic execution of multi-tiered applications. With AppFlow you can define multi-tier applications composed of interconnected VMs and manage them as a single entity.\
            </p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://doc.opennebula.pro/doku.php?id=appflow" target="_blank">AppFlow Documentation</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var appflow_dashboard_tab = {
    title: '<i class="icon-sitemap"></i>AppFlow',
    content: appflow_dashboard_tmpl,
}


Sunstone.addMainTab('appflow_dashboard_tab',appflow_dashboard_tab);
