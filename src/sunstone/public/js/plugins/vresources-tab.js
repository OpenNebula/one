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

var vres_tab_content =
'<table class="dashboard_table" style=>\
<tr>\
<td style="width:50%">\
<table style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Summary of virtual resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">' + tr("VM Templates") + '</td>\
              <td class="value_td"><span id="vres_total_templates"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' +
    tr("VM Instances")+ ' (' + 
    tr("total") + '/<span class="green">' +
    tr("running") + '</span>/<span class="red">' + 
    tr("failed") + '</span>)</td>\
              <td class="value_td"><span id="vres_total_vms"></span><span id="vres_running_vms" class="green"></span><span id="vres_failed_vms" class="red"></span></td>\
            </tr>\
<!--\
            <tr>\
              <td class="key_td">' + tr("Virtual Networks") + '</td>\
              <td class="value_td"><span id="vres_total_vnets"></span></td>\
            </tr>-->\
            <tr>\
              <td class="key_td">' + tr("Images") + '</td>\
              <td class="value_td"><span id="vres_total_images"></span></td>\
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
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#vms_tab" value="VM.create_dialog">'+tr("Create new Virtual Machine")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#templates_tab" value="Template.create_dialog">'+tr("Create new VM Template")+'</a></br>\
             <span class="ui-icon ui-icon-arrowreturnthick-1-e inline-icon" /><a class="action_button" href="#images_tab" value="Image.create_dialog">'+tr("Create new Image")+'</a></br>\
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
        <h3>' + tr("Virtual Resources") + '</h3>\
        <div class="panel_info">\
            <p><img src="images/server_icon.png" alt="server" width="128" height="128" style="float:right;" />'+tr("The Virtual Resources menu allows management of Virtual Machine Templates, Instances and storage (Images).")+'</p>\
            <p>'+tr("Virtual Machine templates can be instantiated as many times as you want. You can do it from the Templates tab or by creating a new VM in the VM tab. The second method allows you to customize the name and the number of VMs you want to launch.")+'</p>\
            <p>'+tr("You can find further information on the following links:")+'</p>\
            <ul>\
               <li><a href="http://opennebula.org/documentation:rel3.4:vm_guide" target="_blank">Creating Virtual Machines</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:vm_guide_2" target="_blank">Managing Virtual Machines</a></li>\
               <li><a href="http://opennebula.org/documentation:rel3.4:img_guide" target="_blank">Managing Virtual Machine Images</a></li>\
            </ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var vres_tab = {
    title: '<i class="icon-list-alt"></i>'+tr("Virtual Resources"),
    content: vres_tab_content
}

Sunstone.addMainTab('vres_tab',vres_tab);

function updateVResDashboard(what,json_info){
    var db = $('#vres_tab',main_tabs_context);
    switch (what){
    case "vms":
        var total_vms=json_info.length;
        var running_vms=0;
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
        $('#vres_total_vms',db).html(total_vms+'&nbsp;/&nbsp;');
        $('#vres_running_vms',db).html(running_vms+'&nbsp;/&nbsp;');
        $('#vres_failed_vms',db).html(failed_vms);
        break;
    case "vnets":
        var total_vnets=json_info.length;
        $('#vres_total_vnets',db).html(total_vnets);
        break;
    case "images":
        var total_images=json_info.length;
        $('#vres_total_images',db).html(total_images);
        break;
    case "templates":
        var total_templates=json_info.length;
        $('#vres_total_templates',db).html(total_templates);
        break;
    };
};

$(document).ready(function(){

});