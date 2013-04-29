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

function updateAppStageDashboard(what, json_info){
    var db = $('#appstage_dashboard_tab',main_tabs_context);
    switch (what){
    case "environments":
        var total_envs=json_info.length;
        $('#appstage_total_environments',db).html(total_envs);
        break;
    };
}

var appstage_dashboard_tmpl = '\
<table class="dashboard_table" id="appstage_dashboard">\
<tr>\
<td style="width:50%">\
<table id="system_information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of AppStage resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">Environments</td>\
              <td class="value_td"><span id="appstage_total_environments"></span></td>\
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
                <li><a class="action_button" href="#appstages_tab" value="AppStage.create_dialog">Create a new Environment</a></li>\
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
        <h3>' + tr("AppStage") + '</h3>\
        <div class="panel_info">\
            <p>\
              <img src="images/appstage_icon.png" height="80px" style="float:right;margin:0px 15px 15px 15px;" alt="appstage logo"/>\
              AppStage performs the automatic installation and configuration of the software stack that constitutes an application environment. With AppStage you can easily define software configurations for your VMs and share them with other users.\
            </p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://doc.opennebula.pro/doku.php?id=appstage" target="_blank">AppStage Documentation</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var appstage_dashboard_tab = {
    title: '<i class="icon-magic"></i>AppStage',
    content: appstage_dashboard_tmpl,
}


Sunstone.addMainTab('appstage_dashboard_tab',appstage_dashboard_tab);
