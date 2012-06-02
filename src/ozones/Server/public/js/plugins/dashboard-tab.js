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
'<table id="dashboard_table">\
  <tr>\
      <td>\
      <div class="panel">\
        <h3><a href="#zones_tab">Zones</a>\
        <div class="new-resource">\
                <a class="action_button" href="#zones_tab" value="Zone.create_dialog">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_zones"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#vdcs_tab">Virtual Data Centers</a>\
            <div class="new-resource">\
                <a class="action_button" href="#vdcs_tab" value="VDC.create_dialog">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_vdcs"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
  </tr>\
 <tr>\
    <td>\
      <div class="panel">\
        <h3><a href="#agg_clusters_tab">Clusters</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_clusters"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#agg_datastores_tab">Datastores</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_datastores"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
      </div>\
    </td>\
  </tr>\
 <tr>\
    <td>\
      <div class="panel">\
        <h3><a href="#agg_hosts_tab">Hosts</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_hosts"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_green">Enabled</td>\
                    <td class="value_td"><span id="active_hosts"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#agg_templates_tab">VM Templates</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_templates"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3><a href="#agg_vms_tab">Virtual Machines</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_vms"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_green">Running</td>\
                    <td class="value_td"><span id="running_vms"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_red">Failed</td>\
                    <td class="value_td"><span id="failed_vms"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#agg_vns_tab">Virtual Networks</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_vnets"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>\
            <a href="#agg_images_tab">Images</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_images"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td class="oneadmin">\
      <div class="panel">\
       <h3><a href="#agg_users_tab">Users</a>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_users"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>';


var dashboard_tab = {
    title: '<i class="icon-home"></i>'+'Dashboard',
    content: dashboard_tab_content
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

$(document).ready(function(){
    $("#dashboard_table h3 a").live("click", function (){
        var tab = $(this).attr('href');
        showTab(tab);
        return false;
    });

    emptyDashboard();

});

//puts the dashboard values into "retrieving"
function emptyDashboard(){
    $("#dashboard_tab .value_td span").html(spinner);
}


function updateZonesDashboard(what,json_info){
    db = $('#dashboard_tab');
    switch (what){
    case "zones":
        var total_zones=json_info.length;
        $('#total_zones',db).html(total_zones);
        break;
    case "vdcs":
        var total_vdcs=json_info.length;
        $('#total_vdcs',db).html(total_vdcs);
        break;
    case "hosts":
        var total_hosts=json_info.length;
        var active_hosts=0;
        $.each(json_info,function(){
            if (parseInt(this.HOST.STATE) < 3){
                active_hosts++;}
        });
        $('#total_hosts',db).html(total_hosts);
        $('#active_hosts',db).html(active_hosts);
        break;
    case "templates":
        var total_templates=json_info.length;
        $('#total_templates',db).html(total_templates);
        break;
    case "vms":
        var total_vms=json_info.length;
        var running_vms=0;
        var failed_vms=0;
        $.each(json_info,function(){
            vm_state = parseInt(this.VM.STATE);
            if (vm_state == 3){
                running_vms++;
            }
            else if (vm_state == 7) {
                failed_vms++;
            }
        });
        $('#total_vms',db).html(total_vms);
        $('#running_vms',db).html(running_vms);
        $('#failed_vms',db).html(failed_vms);
        break;
    case "vnets":
        var total_vnets=json_info.length;
        $('#total_vnets',db).html(total_vnets);
        break;
    case "users":
        var total_users=json_info.length;
        $('#total_users',db).html(total_users);
        break;
    case "images":
        var total_images=json_info.length;
        $('#total_images',db).html(total_images);
        break;
    case "clusters":
        var total_clusters=json_info.length;
        $('#total_clusters',db).html(total_clusters);
        break;
    case "datastores":
        var total_datastores=json_info.length;
        $('#total_datastores',db).html(total_datastores);
        break;
    };
};
