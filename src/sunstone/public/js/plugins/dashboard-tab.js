/* -------------------------------------------------------------------------- */
/* Copyright 2002-2011, OpenNebula Project Leads (OpenNebula.org)             */
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
        <h3><a href="#hosts_tab">Hosts</a>\
        <div class="new-resource">\
                <a class="action_button" href="#hosts_tab" value="Host.create_dialog">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_hosts"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td key_td_green">Active</td>\
                    <td class="value_td"><span id="active_hosts"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td>\
      <div class="panel">\
        <h3><a href="#hosts_tab">Clusters</a>\
            <div class="new-resource">\
                <a class="action_button" href="#hosts_tab" value="Cluster.create_dialog">+</a>\
            </div>\
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
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3><a href="#vms_tab">Virtual Machines</a>\
            <div class="new-resource">\
                <a class="action_button" href="#vms_tab" value="VM.create_dialog">+</a>\
            </div>\
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
        <h3><a href="#vnets_tab">Virtual Networks</a>\
            <div class="new-resource">\
                <a class="action_button" href="#vnets_tab" value="Network.create_dialog">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_vnets"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td">Public</td>\
                    <td class="value_td"><span id="public_vnets"></span></td>\
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
            <a href="#images_tab">Images</a>\
            <div class="new-resource">\
                <a class="action_button" href="#images_tab" value="Image.create_dialog">+</a>\
            </div>\
        </h3>\
        <div class="panel_info">\
            <table class="info_table">\
                <tr>\
                    <td class="key_td">Total</td>\
                    <td class="value_td"><span id="total_images"></span></td>\
                </tr>\
                <tr>\
                    <td class="key_td">Public</td>\
                    <td class="value_td"><span id="public_images"></span></td>\
                </tr>\
            </table>\
        </div>\
      </div>\
    </td>\
    <td class="oneadmin">\
      <div class="panel">\
       <h3><a href="#users_tab">Users</a>\
       <div class="new-resource">\
                <a class="action_button" href="#users_tab" value="User.create_dialog">+</a>\
            </div>\
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


Sunstone.addMainTab('dashboard_tab','Dashboard',dashboard_tab_content,null);

$(document).ready(function(){
    //Dashboard link listener
    $("#dashboard_table h3 a").live("click", function (){
        var tab = $(this).attr('href');
        showTab(tab);
        return false;
    });
    
    emptyDashboard();
    if (uid!=0) {
        $("td.oneadmin").hide();
    }
    
    
});

//puts the dashboard values into "retrieving"
function emptyDashboard(){
    $("#dashboard_tab .value_td span").html(spinner);
}


function updateDashboard(what,json_info){
	db = $('#dashboard_tab');
	switch (what){
		case "hosts":
			total_hosts=json_info.length;
			active_hosts=0;
			$.each(json_info,function(){
				if (parseInt(this.HOST.STATE) < 3){
					active_hosts++;}
			});
			$('#total_hosts',db).html(total_hosts);
			$('#active_hosts',db).html(active_hosts);
			break;
		case "clusters":
			total_clusters=json_info.length;
			$('#total_clusters',db).html(total_clusters);
			break;
		case "vms":
			total_vms=json_info.length;
			running_vms=0;
            failed_vms=0;
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
			public_vnets=0;
			total_vnets=json_info.length;
			$.each(json_info,function(){
				if (parseInt(this.VNET.PUBLIC)){
					public_vnets++;}
			});
			$('#total_vnets',db).html(total_vnets);
			$('#public_vnets',db).html(public_vnets);
			break;
		case "users":
			total_users=json_info.length;
			$('#total_users',db).html(total_users);
			break;
        case "images":
            total_images=json_info.length;
            public_images=0;
            $.each(json_info,function(){
				if (parseInt(this.IMAGE.PUBLIC)){
					public_images++;}
			});
            $('#total_images',db).html(total_images);
			$('#public_images',db).html(public_images);
            break;
	}
}
