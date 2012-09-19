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

var appenv_dashboard_tmpl = '\
<table class="dashboard_table" id="appenv_dashboard">\
<tr>\
<td style="width:100%">\
<table id="table_right" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("AppEnv - A tool to manage environments") + '</h3>\
        <div class="panel_info">\
\
            <p class="dashboard_p" style="margin-top: 10px"><img src="images/appenv_icon.png" height="80px" style="float:right;margin:15px 63px 15px 15px;" alt="appenv logo"/>AppEnv performs the automatic installation and configuration of the software stack that constitutes an application environment. With AppEnv you can easily define software configurations for your VMs and share them with other users.</p>\
            <p class="dashboard_p">&nbsp;</p>\
            <p class="dashboard_p">&nbsp;</p>\
            <p class="dashboard_p">&nbsp;</p>\
            <p class="dashboard_p">&nbsp;</p>\
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
