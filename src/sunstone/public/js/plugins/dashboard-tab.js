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

/*
var dashboard_tab_content =
'<table class="dashboard_table">\
<tr>\
<td>\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
          <h4 class="subheader">' + tr("Hosts") + '<i class="icon-refresh action_button" value="Host.refresh" style="float:right;cursor:pointer"></i></h4>\
        <div class="panel_info">\
          <table class="info_table">\
\
            <tr>\
              <td class="key_td">' + tr("Total Hosts") + '</td>\
              <td class="key_td">' + tr("State") + '</td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="totalHosts" class="big_text" style="float:left;width:50%;padding-top:12px;"></div>\
                 <div id="statePie" style="float:right;width:50%;height:100px;"></div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Global CPU Usage") + '</td>\
              <td></td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="globalCpuUsage" style="width:100%;height:100px;"></div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max CPU") + '</td>\
              <td><div id="cpuUsageBar_legend"></div></td>\
            </tr>\
            <tr>\
              <td colspan="2">\
               <div id="cpuUsageBar" style="width:95%;height:50px"></div>\
              </td>\
           </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max Memory") + '</td>\
              <td><div id="memoryUsageBar_legend"></div></td>\
            </tr>\
            <tr>\
              <td colspan="2">\
               <div id="memoryUsageBar" style="width:95%;height:50px"></div>\
              </td>\
            </tr>\
\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
         <h3>' + tr("Clusters") + '<i class="icon-refresh action_button" value="Host.refresh" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
\
            <tr>\
              <td class="key_td">' + tr("Allocated CPU per cluster") + '</td>\
              <td class="value_td"></td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="cpuPerCluster" style="width:100%;height:100px;overflow:hidden;"></div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Allocated Memory per cluster") + '</td>\
              <td class="value_td"></td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="memoryPerCluster" style="width:100%;height:100px;overflow:hidden;"></div></td>\
            </tr>\
\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td>\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Virtual Machines") + '<i class="icon-refresh action_button" value="VM.refresh" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
          <table class="info_table">\
\
            <tr>\
              <td class="key_td">' + tr("Total VMs") + '</td>\
              <td class="key_td">' + tr("State") + '</td>\
            </tr>\
\
            <tr>\
              <td colspan="2"><div id="totalVMs" class="big_text" style="float:left;width:50%;padding-top:12px;"></div>\
                  <div id="vmStatePie" style="float:right;width:50%;height:100px"></div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Bandwidth - Upload") + '</td>\
              <td class="key_td">' + tr("Bandwidth - Download") + '</td>\
            </tr>\
            <tr>\
              <td id="bandwidth_up" class="big_text"></td>\
              <td id="bandwidth_down" class="big_text"></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Global transfer rates") + '</td>\
              <td colspan="2"><div id="netUsageBar_legend" style="float:right;"></div></td>\
            </tr>\
            <tr>\
              <td colspan="3">\
               <div id="netUsageBar" style="float:left;width:92%;height:50px"></div>\
              </td>\
            </tr>\
\
          </table>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("System Information") + '</h3>\
        <div class="panel_info">\
          <table class="info_table">\
\
            <tr>\
              <td class="key_td">' + tr("Total Users") + '</td>\
              <td class="key_td">' + tr("Total Groups") + '</td>\
            </tr>\
\
            <tr>\
              <td class="big_text" id="totalUsers"></td>\
              <td class="big_text" id="totalGroups"></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Users per group") + '</td>\
              <td class="value_td"><i class="icon-refresh action_button" value="User.refresh" style="float:right;cursor:pointer"></i></td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="usersPerGroup" style="width:100%;height:100px;overflow:hidden;"></div></td>\
            </tr>\
\
          </table>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';
*/

var dashboard_tab_content = '\
<div class="dashboard">\
<div class="panel">\
<div class="row">\
  <div class="twelve columns">\
    <h4 class="subheader header">\
      <span class="header-resource">\
        <i class="icon-dashboard"></i> '+tr("Dashboard")+'\
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
  <div class="row">\
    <div class="six columns">\
      <div class="panel dashboard-panel">\
        <div class="row">\
          <h5 class="subheader header-dashboard"><span class="span-dashboard"><i class="icon-hdd"></i> '+tr("Hosts")+'</span></h5>\
        </div>\
        <div class="row">\
          <div class="twelve columns centered">\
            <h3 class="subheader">\
              <span id="total_hosts" class="subheader"/>\
              <small>'+tr("TOTAL")+'</small>&emsp;\
              <span id="on_hosts" class="subheader"/>\
              <small>'+tr("ON")+'</small>&emsp;\
              <span id="off_hosts" class="subheader"/>\
              <small>'+tr("OFF")+'</small>&emsp;\
              <span id="error_hosts" class="subheader"/>\
              <small>'+tr("ERROR")+'</small>\
            </h3>\
          </div>\
        </div>\
        <br>\
        <div class="row graph_legend">\
          <h3 class="subheader"><small>'+tr("CPU")+'</small></h3>\
        </div>\
        <div class="row">\
          <div class="ten columns centered graph" id="dash_host_cpu_graph" style="height: 100px;">\
          </div>\
        </div>\
        <div class="row graph_legend">\
          <div class="ten columns centered" id="dash_host_cpu_legend" ></div>\
        </div>\
        <div class="row graph_legend">\
          <h3 class="subheader"><small>'+tr("MEMORY")+'</small></h3>\
        </div>\
        <div class="row">\
          <div class="ten columns centered graph" id="dash_host_mem_graph" style="height: 100px;">\
          </div>\
        </div>\
        <div class="row graph_legend">\
          <div class="ten columns centered" id="dash_host_mem_legend">\
          </div>\
        </div>\
      </div>\
    </div>\
    <div class="six columns">\
      <div class="panel dashboard-panel">\
        <div class="row">\
          <h5 class="subheader header-dashboard"><span class="span-dashboard"><i class="icon-cloud"></i> '+tr("Virtual Machines")+'</span></h5>\
        </div>\
        <div class="row">\
          <div class="twelve columns centered">\
            <h3 class="subheader">\
              <span id="total_vms" class="subheader"/>\
              <small>'+tr("TOTAL")+'</small>&emsp;\
              <span id="active_vms" class="subheader"/>\
              <small>'+tr("ACTIVE")+'</small>&emsp;\
              <span id="pending_vms" class="subheader"/>\
              <small>'+tr("PENDING")+'</small>&emsp;\
            </h3>\
          </div>\
        </div>\
        <div class="row">\
          <div class="twelve columns centered">\
            <h3 class="subheader">\
              <span id="off_vms" class="subheader"/>\
              <small>'+tr("STOPPED")+'</small>&emsp;\
              <span id="failed_vms" class="subheader"/>\
              <small>'+tr("FAILED")+'</small>\
            </h3>\
          </div>\
        </div>\
        <br>\
        <div class="row  graph_legend">\
          <h3 class="subheader"><small>'+tr("NET DOWNLOAD SPEED")+'</small></h3>\
          <div class="ten columns " id="dash_vm_net_rx_legend">\
          </div>\
        </div>\
        <div class="row">\
          <div class="ten columns centered graph" id="dash_vm_net_rx_graph"  style="height: 100px;">\
          </div>\
        </div>\
        <br>\
        <div class="row graph_legend">\
          <h3 class="subheader"><small>'+tr("NET UPLOAD SPEED")+'</small></h3>\
          <div class="ten columns" id="dash_vm_net_tx_legend">\
          </div>\
        </div>\
        <div class="row">\
          <div class="ten columns centered graph" id="dash_vm_net_tx_graph" style="height: 100px;">\
          </div>\
        </div>\
      </div>\
    </div>\
  </div>\
  <div class="row">\
    <div class="four columns">\
      <div class="panel">\
        <div class="row">\
          <h5 class="subheader header-dashboard"><span class="span-dashboard"><i class="icon-upload"></i> '+tr("Storage")+'</span></h5>\
        </div>\
        <div class="row">\
          <div class="twelve columns centered">\
            <h3 class="subheader">\
              <span id="total_images" class="subheader"/>\
              <small>'+tr("IMAGES")+'</small>&emsp;\
              <span id="size_images" class="subheader"/>\
              <small>'+tr("USED")+'</small>\
            </h3>\
          </div>\
        </div>\
      </div>\
    </div>\
    <div class="four columns">\
      <div class="panel">\
        <div class="row">\
          <h5 class="subheader header-dashboard"><span class="span-dashboard"><i class="icon-user"></i> '+tr("Users")+'</span></h5>\
        </div>\
        <div class="row">\
          <div class="twelve columns centered">\
            <h3 class="subheader">\
              <span id="total_users" class="subheader"/>\
              <small>'+tr("USERS")+'</small>&emsp;\
              <span id="total_groups" class="subheader"/>\
              <small>'+tr("GROUPS")+'</small>\
            </h3>\
          </div>\
        </div>\
      </div>\
    </div>\
    <div class="four columns">\
      <div class="panel">\
        <div class="row">\
          <h5 class="subheader header-dashboard"><span class="span-dashboard"><i class="icon-sitemap"></i> '+tr("Network")+'</span></h5>\
        </div>\
        <div class="row">\
          <div class="twelve columns centered">\
            <h3 class="subheader">\
              <span id="total_vnets" class="subheader"/>\
              <small>'+tr("VNETS")+'</small>&emsp;\
              <span id="addresses_vnets" class="subheader"/>\
              <small>'+tr("ADDRESSES")+'</small>\
            </h3>\
          </div>\
        </div>\
      </div>\
    </div>\
  </div>\
</div>\
';

var dashboard_tab = {
    title: '<i class="icon-dashboard"></i>'+tr("Dashboard"),
    content: dashboard_tab_content,
    showOnTopMenu: false
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

var $dashboard;

// All monitoring calls and config are called from the Sunstone plugins.

function dashboardQuotasHTML(){}

$(document).ready(function(){
        $dashboard = $('#dashboard_tab', main_tabs_context);
});
