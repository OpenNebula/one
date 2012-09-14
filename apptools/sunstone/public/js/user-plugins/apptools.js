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
        <p class="dashboard_p"><img src="images/apptools_icon.png" height="80px" style="float:right;margin:15px 15px;" alt="apptools logo"/>AppTools is a group of tools for users and administrators of OpenNebula clouds to simplify and optimize application management. These tools enable the building, distribution and execution of multi-tier applications.</p>\
\
<ul>\
   <li>AppEnv performs the automatic installation and configuration of the software stack that constitute an application environment</li>\
   <li>AppFlow enables the automatic execution of multi-tiered applications composed of interconnected applications</li>\
   <li>AppPlace builds a centralized catalog of virtual appliances to easily share and distribute applications across OpenNebula instances</li>\
</ul>\
\
        <p class="dashboard_p">AppTools fills the gap between the application and the virtual infrastructure layer. While OpenNebula manages the execution of the virtual infrastructure, being fully application agnostic, AppTools manages the application being executed within the virtual infrastructure. AppTools leverages the OpenNebula contextualization framework and external APIs.</p>\
\
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
            <p class="dashboard_p"><img src="images/appenv_icon.png" height="64px" style="float:right;margin:15px 63px 15px 15px;" alt="appenv logo"/>Installing services can sometimes be tedious. Getting the VM ins good shape, installing the packages needed, deploying the application and configuring it. On case of disaster or scaling the service you will need to perform again these tasks. To automate all this burden we now have Configuration Management software like <a target="_blank" href="http://www.opscode.com/chef/">Chef</a>, <a target="_blank" href="http://puppetlabs.com/puppet/what-is-puppet/">Puppet</a> or <a target="_blank" href="http://cfengine.com/">CFEngine</a>.</p>\
\
            <p class="dashboard_p">With this software we can script the installation and configuration of applications and services. You can also describe the services and their configuration that will be installed on a node so we can automate its installation. We will also be sure that each installation will be equal to other using the same configuration.</p>\
\
            <p class="dashboard_p">The tool oneenv will make use of <a target="_blank" href="http://wiki.opscode.com/display/chef/Chef+Solo">Chef-solo</a>. It lets you register chef configurations and instantiate them using predefined templates and images.</p>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("AppFlow - Service deployment") + '</h3>\
        <div class="panel_info">\
            <p class="dashboard_p"><img src="images/appflow_icon.png" height="64px" style="float:right;margin:15px 63px 15px 15px;" alt="appflow logo"/>App flow desc</p>\
            <p class="dashboard_p">bla</p>\
            <p class="dashboard_p">blabla</p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("AppMarket - Image repository") + '</h3>\
        <div class="panel_info">\
            <p class="dashboard_p"><img src="images/appmarket_icon.png" height="64px" style="float:right;margin:15px 15px;" alt="appflow logo"/>App flow desc</p>\
            <p class="dashboard_p">bla</p>\
            <p class="dashboard_p">blabla</p>\
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