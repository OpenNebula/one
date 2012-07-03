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
         <h3>' + tr("User information") + '</h3>\
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
    showOnTopMenu: false,
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

var $dashboard;


function dashboardQuotaRow(quota_json){
    var row = '';

    switch (quota_json.TYPE){
    case "VM":
        row += '<tr><td class="padding1">'+tr("VMS")+'</td>';
        row += '<td class="value_td">'+quota_json.VMS_USED+' / '+quota_json.VMS+'</td></tr>';
        row += '<tr><td class="padding1">'+tr("Memory")+'</td>';
        row += '<td class="value_td">'+quota_json.MEMORY_USED+' / '+quota_json.MEMORY+'</td></tr>';
        row += '<tr><td class="padding1">'+tr("CPU")+'</td>';
        row += '<td class="value_td">'+quota_json.CPU_USED+' / '+quota_json.CPU+'</td></tr>';
        break;
    case "DATASTORE":
        row += '<tr><td class="padding1">'+tr("Datastore")+' id '+quota_json.ID+':</td><td></td></tr>';

        row += '<tr><td class="padding2">'+tr("Size")+'</td>';
        row += '<td class="value_td">'+quota_json.SIZE_USED+' / '+quota_json.SIZE+'</td>';

        row += '<tr><td class="padding2">'+tr("Images")+'</td>';
        row += '<td class="value_td">'+quota_json.IMAGES_USED+' / '+quota_json.IMAGES+'</td>';
        break;
    case "IMAGE":
        row += '<tr><td class="padding1">'+tr("Image")+' id '+quota_json.ID+':</td><td></td></tr>';

        row += '<tr><td class="padding2">'+tr("RVMs")+'</td>';
        row += '<td class="value_td">'+quota_json.RVMS_USED+' / '+quota_json.RVMS+'</td>';
        break;
    case "NETWORK":
        row += '<tr><td class="padding1">'+tr("Network")+' id '+quota_json.ID+':</td><td></td></tr>';

        row += '<tr><td class="padding2">'+tr("Leases")+'</td>';
        row += '<td class="value_td">'+quota_json.RVMS_USED+' / '+quota_json.RVMS+'</td>';
        break;
    }
    return row
}

function dashboardQuotasHTML(user){
    var html = '<tr>\
                   <td class="key_td">' + tr("Resource quotas") + '</td>\
                   <td class="value_td">' + tr("Used&nbsp;/&nbsp;Allowed") + '</td>\
                </tr>\
                <tr>\
                  <td class="key_td"></td><td class="value_td"></td>\
                </tr>';

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