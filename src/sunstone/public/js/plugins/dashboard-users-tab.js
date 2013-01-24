/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project Leads (OpenNebula.org)             */
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
         <h3>' + tr("User quotas") + '<i class="icon-refresh action_button" value="User.refresh" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
          <table id="dashboard_user_info" class="info_table">\
\
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
</table>\
</td>\
</tr></table>';

var dashboard_tab = {
    title: '<i class="icon-dashboard"></i>'+tr("Dashboard"),
    content: dashboard_tab_content,
    showOnTopMenu: false
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

var $dashboard;


function dashboardQuotaRow(quota_json){
    var row = '';

   var label = function(used, max, unit){
        max = parseInt(max,10) ? max : "unlimited";

        if (unit)
            return used+'&nbsp;'+unit+'&nbsp;/&nbsp;'+max+'&nbsp;'+unit;

        return used + '&nbsp;/&nbsp;'+ max

    }

    switch (quota_json.TYPE){
    case "VM":
        row += '<tr class="quotas"><td class="padding1">'+tr("Virtual Machines")+'</td>';

        var vms_used = quota_json.VMS_USED;
        var vms = quota_json.VMS;
        var vms_ratio = vms_used * 100 / vms;

        row += '<td class="value_td">'+
            progressBar(vms_ratio,
                        { width: '200px', height: '15px',
                          label: label(vms_used,vms),
                          fontSize: '1em', labelVPos: '0px' }) +
            '</td></tr>';
        var memory_used = quota_json.MEMORY_USED;
        var memory = quota_json.MEMORY;
        var memory_ratio = memory_used * 100 / memory;

        row += '<tr class="quotas"><td class="padding1">'+tr("Memory")+'</td>';
        row += '<td class="value_td">'+
            progressBar(memory_ratio,
                        { width: '200px', height: '15px',
                          label: label(memory_used, memory, 'MB'),
                          fontSize: '1em', labelVPos: '0px',
                          labelHPos: '65px' }) +
            '</td></tr>';

        var cpu_used = quota_json.CPU_USED;
        var cpu = quota_json.CPU;
        var cpu_ratio = cpu_used * 100 / cpu;

        row += '<tr class="quotas"><td class="padding1">'+tr("CPU")+'</td>';
        row += '<td class="value_td">'+
            progressBar(cpu_ratio,
                        { width: '200px', height: '15px',
                          label: label(cpu_used, cpu),
                          fontSize: '1em', labelVPos: '0px' }) +
            '</td></tr>';
        break;
    case "DATASTORE":
        row += '<tr><td class="padding1">'+tr("Datastore")+' id '+quota_json.ID+':</td><td></td></tr>';

        var size_used = quota_json.SIZE_USED;
        var size = quota_json.SIZE;
        var size_ratio = parseInt(size,10) ? size_used * 100 / size: 0;
        row += '<tr class="quotas"><td class="padding2">'+tr("Storage size")+'</td>';
        row += '<td class="value_td">'+
            progressBar(size_ratio,
                        { width: '200px', height: '15px',
                          label: label(size_used, size, 'MB'),
                          fontSize: '1em', labelVPos: '0px',
                          labelHPos: '65px' }) +
            '</td></tr>';

        var images_used = quota_json.IMAGES_USED;
        var images = quota_json.IMAGES;
        var images_ratio = images_used * 100 / images;

        row += '<tr class="quotas"><td class="padding2">'+tr("Number of images")+'</td>';
        row += '<td class="value_td">'+
            progressBar(images_ratio,
                        { width: '200px', height: '15px',
                          label: label(images_used, images),
                          fontSize: '1em', labelVPos: '0px' }) +
            '</td></tr>';
        break;


    case "IMAGE":
        row += '<tr><td class="padding1">'+tr("Image")+' id '+quota_json.ID+':</td><td></td></tr>';

        var rvms_used = quota_json.RVMS_USED;
        var rvms = quota_json.RVMS;
        var rvms_ratio = parseInt(rvms,10) ? rvms_used * 100 / rvms : 0;

        row += '<tr class="quotas"><td class="padding2">'+tr("RVMs")+'</td>';
        row += '<td class="value_td">'+
            progressBar(rvms_ratio,
                        { width: '200px', height: '15px',
                          label: label(rvms_used, rvms),
                          fontSize: '1em', labelVPos: '0px' }) +
            '</td></tr>';
        break;
    case "NETWORK":
        row += '<tr><td class="padding1">'+tr("Network")+'&nbsp;id&nbsp;'+quota_json.ID+':</td><td></td></tr>';

        var leases_used = quota_json.LEASES_USED
        var leases = quota_json.LEASES
        var leases_ratio = leases_used * 100 / leases;

        row += '<tr class="quotas"><td class="padding2">'+tr("Leases")+'</td>';

        row += '<td class="value_td">'+
            progressBar(leases_ratio,
                        { width: '200px', height: '15px',
                          label: label(leases_used, leases),
                          fontSize: '1em', labelVPos: '0px' }) +
            '</td></tr>';
        break;
    }
    return row
}

function dashboardQuotasHTML(user){
    var html = '';

    var results = parseQuotas(user, dashboardQuotaRow);

    html += '<tr><td class="key_td">'+tr("VM quota")+':</td>\
                 <td class="value_td">'+
        (results.VM.length ? "" : tr("None"))+'</td></tr>'

    html += results.VM;

    html += '<tr>\
                <td class="key_td"></td><td class="value_td"></td>\
              </tr>';

    html += '<tr><td class="key_td">'+tr("Datastore quotas")+':</td>\
                 <td class="value_td">'+
        (results.DATASTORE.length ? "" : tr("None"))+'</td></tr>'

    html += results.DATASTORE;

    html += '<tr>\
                <td class="key_td"></td><td class="value_td"></td>\
              </tr>';

    html += '<tr><td class="key_td">'+tr("Image quotas")+':</td>\
                 <td class="value_td">'+
        (results.IMAGE.length ? "" : tr("None"))+'</td></tr>'

    html += results.IMAGE;

    html += '<tr>\
                <td class="key_td"></td><td class="value_td"></td>\
              </tr>';

    html += '<tr><td class="key_td">'+tr("Network quotas")+':</td>\
                 <td class="value_td">'+
        (results.NETWORK.length ? "" : tr("None"))+'</td></tr>'

    html += results.NETWORK;

    html += '<tr>\
                <td class="key_td"></td><td class="value_td"></td>\
              </tr>';

    $('#dashboard_user_info', $dashboard).html(html);
}

$(document).ready(function(){
    $dashboard = $('#dashboard_tab', main_tabs_context);
});