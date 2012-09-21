//--------------------------------------------------------------------------//
// Copyright 2010-2012, C12G Labs S.L.                                      //
//                                                                          //
// Licensed under the C12G Commercial Open-source License (the              //
// "License"); you may not use this file except in compliance               //
// with the License. You may obtain a copy of the License as part           //
// of the software distribution.                                            //
//                                                                          //
// Unless agreed to in writing, software distributed under the              //
// License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES           //
// OR CONDITIONS OF ANY KIND, either express or implied. See the            //
// License for the specific language governing permissions and              //
// limitations under the License.                                           //
//--------------------------------------------------------------------------//

function updateAppEnvDashboard(what, json_info){
    var db = $('#appenv_dashboard_tab',main_tabs_context);
    switch (what){
    case "environments":
        var total_envs=json_info.length;
        $('#appenv_total_environments',db).html(total_envs);
        break;
    };
}

var appenv_dashboard_tmpl = '\
<table class="dashboard_table" id="appenv_dashboard">\
<tr>\
<td style="width:50%">\
<table id="system_information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of AppEnv resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">Environments</td>\
              <td class="value_td"><span id="appenv_total_environments"></span></td>\
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
                <li><a class="action_button" href="#appenvs_tab" value="AppEnv.create_dialog">Create a new Environment</a></li>\
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
        <h3>' + tr("AppEnv") + '</h3>\
        <div class="panel_info">\
            <p>\
              <img src="images/appenv_icon.png" height="80px" style="float:right;margin:0px 15px 15px 15px;" alt="appenv logo"/>\
              AppEnv performs the automatic installation and configuration of the software stack that constitutes an application environment. With AppEnv you can easily define software configurations for your VMs and share them with other users.\
            </p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://doc.opennebula.pro/doku.php?id=appenv" target="_blank">AppEnv Documentation</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var appenv_dashboard_tab = {
    title: '<i class="icon-magic"></i>AppEnv',
    content: appenv_dashboard_tmpl,
}


Sunstone.addMainTab('appenv_dashboard_tab',appenv_dashboard_tab);
