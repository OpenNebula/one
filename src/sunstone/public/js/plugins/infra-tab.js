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

var infra_tab_content =
'<table class="dashboard_table" id="infra_dashboard" style=>\
<tr>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of infrastructure resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr class="cluster_related">\
              <td class="key_td">' + tr("Clusters") + '</td>\
              <td class="value_td"><span id="infra_total_clusters"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Hosts") + '</td>\
              <td class="value_td"><span id="infra_total_hosts"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Datastores") + '</td>\
              <td class="value_td"><span id="infra_total_datastores"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Virtual Networks") + '</td>\
              <td class="value_td"><span id="infra_total_vnets"></span></td>\
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
             <p></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon cluster_related" /><a class="action_button cluster_related" href="#clusters_tab" value="Cluster.create_dialog">'+tr("Create new Cluster")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#hosts_tab" value="Host.create_dialog">'+tr("Create new Host")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#datastores_tab" value="Datastore.create_dialog">'+tr("Create new Datastore")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#vnets_tab" value="Network.create_dialog">'+tr("Create new Virtual Network")+'</a></br>\
             </p>\
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
        <h3>' + tr("Infrastructure resources") + '</h3>\
        <div class="panel_info">\
            <p><img src="images/network_icon.png" style="float:right;" alt="network icon"/>'+tr("The Infrastructure menu allows management of Hosts, Datastores, Virtual Networks. Users in the oneadmin group can manage clusters as well.")+'</p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://opennebula.org/documentation:rel3.4:hostsubsystem" target="_blank">Host subsystem</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:host_guide" target="_blank">Managing Hosts</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:nm" target="_blank">Networking subsystem</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:cluster_guide" target="_blank">Managing Clusters</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var infra_tab = {
    title: '<i class="icon-sitemap"></i>'+tr("Infrastructure"),
    content: infra_tab_content
}

Sunstone.addMainTab('infra_tab',infra_tab);

function updateInfraDashboard(what,json_info){
    var db = $('#infra_tab',main_tabs_context);
    switch (what){
    case "hosts":
        var total_hosts=json_info.length;
        $('#infra_total_hosts',db).html(total_hosts);
        break;
    case "vnets":
        var total_vnets=json_info.length;
        $('#infra_total_vnets',db).html(total_vnets);
        break;
    case "datastores":
        var total_datastores=json_info.length;
        $('#infra_total_datastores',db).html(total_datastores);
        break;
    case "clusters":
        var total_clusters=json_info.length;
        $('#infra_total_clusters',db).html(total_clusters);
        break;
    };
};

$(document).ready(function(){
    if (!mustBeAdmin())
        $('table#infra_dashboard .cluster_related', main_tabs_context).hide();
});