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

var apptools_dashboard_tmpl = '\
<table class="dashboard_table" id="apptools_dashboard">\
<tr>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("AppTools") + '</h3>\
        <div class="panel_info">\
\
        <p class="dashboard_p"><img src="images/apptools_icon.png" height="80px" style="float:right;margin:15px 15px;" alt="apptools logo"/>AppTools is a group of tools for users and administrators of OpenNebula to simplify and optimize cloud application management. With AppTools you can configure the software stack in the applications, manage multi-tiered applications, and build your own private market to distribute applications across several OpenNebula instances.</p>\
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
<h3>' + tr("AppEnv - A tool to manage environments") + '</h3>\
        <div class="panel_info">\
\
            <p class="dashboard_p"><img src="images/appenv_icon.png" height="64px" style="float:right;margin:15px 63px 15px 15px;" alt="appenv logo"/>AppEnv performs the automatic installation and configuration of the software stack that constitutes an application environment. With AppEnv you can easily define software configurations for your VMs and share them with other users.</p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("AppFlow - Service deployment") + '</h3>\
        <div class="panel_info">\
            <p class="dashboard_p"><img src="images/appflow_icon.png" height="64px" style="float:right;margin:15px 63px 15px 15px;" alt="appflow logo"/>AppFlow enables the automatic execution of multi-tiered applications. With AppFlow you can define multi-tier applications composed of interconnected VMs and manage them as a single entity.</p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("AppMarket - Image repository") + '</h3>\
        <div class="panel_info">\
            <p class="dashboard_p"><img src="images/appmarket_icon.png" height="64px" style="float:right;margin:15px 15px;" alt="appflow logo"/>AppMarket builds a centralized catalog of cloud applications. With AppMarket you can build a private repository to share and distribute virtual appliances across OpenNebula instances.</p>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var apptools_tab = {
    title: '<i class="icon-briefcase"></i>AppTools',
    content: apptools_dashboard_tmpl,
}


Sunstone.addMainTab('apptools_tab',apptools_tab);
