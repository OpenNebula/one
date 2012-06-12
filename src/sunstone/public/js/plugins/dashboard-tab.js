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

var dashboard_tab_content =
'<table class="dashboard_table">\
<tr>\
<td>\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
         <h3>' + tr("Hosts") + '<i class="icon-refresh action_button" value="Host.refresh" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
          <table class="info_table">\
\
            <tr>\
              <td class="key_td">' + tr("Total Hosts") + '</td>\
              <td class="key_td">' + tr("State") + '</td>\
              <td class="key_td">' + tr("Global CPU Usage") + '</td>\
            </tr>\
            <tr>\
              <td id="totalHosts" class="big_text"></td>\
              <td colspan="2"><div id="statePie" style="width:45%;display:inline-block;height:100px;"></div>\
                  <div id="globalCpuUsage" style="display:inline-block;width:50%;height:100px;"></div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max CPU") + '</td>\
              <td></td>\
              <td><div id="cpuUsageBar_legend"></div></td>\
            </tr>\
            <tr>\
              <td colspan="3">\
               <div id="cpuUsageBar" style="width:95%;height:50px"></div>\
              </td>\
           </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Used vs. Max Memory") + '</td>\
              <td></td>\
              <td><div id="memoryUsageBar_legend"></td>\
            </tr>\
            <tr>\
              <td colspan="3">\
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
              <td colspan="2"><div id="cpuPerCluster" style="width:97%;height:100px"></div></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("Allocated Memory per cluster") + '</td>\
              <td class="value_td"></td>\
            </tr>\
            <tr>\
              <td colspan="2"><div id="memoryPerCluster" style="width:97%;height:100px"></div></td>\
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
              <td class="key_td">' + tr("Bandwidth - Upload") + '</td>\
              <td class="key_td">' + tr("Bandwidth - Download") + '</td>\
            </tr>\
\
            <tr>\
              <td id="totalVMs" class="big_text"></td>\
              <td id="bandwidth_up" class="big_text"></td>\
              <td id="bandwidth_down" class="big_text"></td>\
            </tr>\
\
            <tr>\
              <td class="key_td">' + tr("State") + '</td>\
              <td class="value_td"></td>\
              <td class="value_td"></td>\
            </tr>\
            <tr>\
              <td colspan="3"><div id="vmStatePie" style="width:100%;height:100px"></div></td>\
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
              <td class="key_td">' + tr("Total ACLs") + '</td>\
            </tr>\
\
            <tr>\
              <td class="big_text" id="totalUsers"></td>\
              <td class="big_text" id="totalGroups"></td>\
              <td class="big_text" id="totalAcls"></td>\
            </tr>\
\
            <tr>\
              <td class="key_td" colspan="2">' + tr("Users per group") + '</td>\
              <td class="value_td"><i class="icon-refresh action_button" value="User.refresh" style="float:right;cursor:pointer"></i></td>\
            </tr>\
            <tr>\
              <td colspan="3"><div id="usersPerGroup" style="width:100%;height:100px"></div></td>\
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

var dashboard_tab = {
    title: '<i class="icon-home"></i>'+tr("Dashboard"),
    content: dashboard_tab_content,
    showOnTopMenu: false,
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

var $dashboard;

function updateDashboard(){
    //mock
}

function plotHostMonitoring(monitoring){
    $('#totalHosts', $dashboard).text(monitoring['totalHosts'])
    delete monitoring['totalHosts']

    if (!$dashboard.is(':visible')) return;
    
    for (plotID in monitoring){
        var container = $('div#'+plotID,$dashboard);
        SunstoneMonitoring.plot("HOST",
                                plotID,
                                container,
                                monitoring[plotID]);
    };
}

function plotUserMonitoring(monitoring){
    $('#totalUsers', $dashboard).text(monitoring['totalUsers'])

    if (!$dashboard.is(':visible')) return;

    var container = $('div#usersPerGroup',$dashboard);
    SunstoneMonitoring.plot('USER',
                            'usersPerGroup',
                            container,
                            monitoring['usersPerGroup']);
}

function plotAclMonitoring(monitoring){
    $('#totalAcls', $dashboard).text(monitoring['totalAcls'])
}

function plotGroupMonitoring(monitoring){
    $('#totalGroups', $dashboard).text(monitoring['totalGroups'])
}

//Permanent storage for last value of aggregated network usage
//Used to calculate bandwidth
var netUsage = {
    time : new Date().getTime(),
    up : 0,
    down : 0
}

function plotVMMonitoring(monitoring){
    $('#totalVMs', $dashboard).text(monitoring['totalVMs'])

    var t = ((new Date().getTime()) - netUsage.time) / 1000 //in secs
    var bandwidth_up = monitoring['netUsageBar'][1].data[0][0] - netUsage.up
    bandwidth_up /= t
    var bandwidth_up_str = humanize_size(bandwidth_up) + "/s" //bytes /sec
    var bandwidth_down = monitoring['netUsageBar'][0].data[0][0] - netUsage.down
    bandwidth_down /= t
    var bandwidth_down_str = humanize_size(bandwidth_down) + "/s" //bytes /sec
    
    if (bandwidth_up >= 0)
        $('#bandwidth_up', $dashboard).text(bandwidth_up_str)
    if (bandwidth_down >= 0)
        $('#bandwidth_down', $dashboard).text(bandwidth_down_str)

    netUsage.time = new Date().getTime()
    netUsage.up = monitoring['netUsageBar'][1].data[0][0]
    netUsage.down = monitoring['netUsageBar'][0].data[0][0]

    if (!$dashboard.is(':visible')) return;

    var container = $('div#vmStatePie',$dashboard);
    SunstoneMonitoring.plot('VM',
                            'statePie',
                            container,
                            monitoring['statePie']);

    container = $('div#netUsageBar',$dashboard);
    SunstoneMonitoring.plot('VM',
                            'netUsageBar',
                            container,
                            monitoring['netUsageBar']);
}

function plot_global_graph(data,info){
    var context = $('#historical_table',main_tabs_context);
    var id = info.title;
    var monitoring = data.monitoring;
    var serie;
    var series = [];
    var width = ($(window).width()-129)*48/100;
    var mon_count = 0;
    var labels_array = info.monitor_resources.split(',');

    $('#'+id,context).html('<div id="'+id+'_graph" style="height:70px;width:'+width+'px;margin-bottom:10px;"><div>');

    for (var i=0; i<labels_array.length; i++) {
        serie = {
            label: tr(labels_array[i]),
            data: monitoring[labels_array[i]]
        };
        series.push(serie);
        mon_count++;
    };

    var options = {
        legend : {
            show : true,
            noColumns: mon_count,
            container: $('#'+id+'_legend')
        },
        xaxis : {
            tickFormatter: function(val,axis){
                return pretty_time_axis(val);
            },
        },
        yaxis : { labelWidth: 20 }
    }

    switch (id){
    case "graph2":
    case "graph4":
        options["yaxis"]["tickFormatter"] = function(val,axis) {
            return humanize_size(val);
        }
    }

    $.plot($('#'+id+'_graph',context),series,options);
}


$(document).ready(function(){
        $dashboard = $('#dashboard_tab', main_tabs_context);
});