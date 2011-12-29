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
<td style="width:50%">\
<table id="information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Welcome to OpenNebula Self-Service") + '</h3>\
        <div class="panel_info dashboard_p">\
<p><img style="float:left;width:100px;" src="images/opennebula-selfservice-icon.png" />'+tr("OpenNebula Self-Service is a simplified user interface to manage OpenNebula compute, storage and network resources. It is focused on easiness and usability and features a limited set of operations directed towards end-users.")+'</p>\
<p>'+tr("Additionally, OpenNebula Self-Service allows easy customization of the interface (e.g. this text) and brings multi-language support.")+'</p>\
<p>'+tr("Have a cloudy experience!")+'</p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
<h3>' + tr("Current resources") + '</h3>\
        <div class="panel_info">\
\
          <table class="info_table">\
            <tr>\
              <td class="key_td">'+tr("Compute")+'</td>\
              <td class="value_td"><span id="total_vms"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Network") + '</td>\
              <td class="value_td"><span id="total_vnets"></span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Storage") + '</td>\
              <td class="value_td"><span id="total_images"></span></td>\
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
        <h3>' + tr("Useful links") + '</h3>\
        <div class="panel_info dashboard_p">\
        <ul><li><a href="http://opennebula.org/documentation:documentation" target="_blank">Documentation</a></li>\
            <li><a href="http://opennebula.org/support:support" target="_blank">Support</a></li>\
            <li><a href="http://opennebula.org/community:community" target="_blank">Community</a></li></ul>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
<td style="width:50%">\
<table id="hosts" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Compute") + '</h3>\
        <div class="panel_info dashboard_p">\
<p><img style="float:right;width:100px;" src="images/server_icon.png" />'+tr("Compute resources are Virtual Machines attached to storage and network resources. OpenNebula Self-Service allows you to easily create, remove and manage them, including the possibility of pausing a Virtual Machine or taking a snapshot of one of their disks.")+'</p>\
<p><span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="action_link" href="#vms_tab" action="VM.create_dialog">Create new compute resource</a><br />\
<span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="tab_link" href="#vms_tab">See more</a></p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Storage") + '</h3>\
        <div class="panel_info dashboard_p">\
<p><img style="float:right;width:100px;" src="images/storage_icon.png" />'+tr("Storage pool is formed by several images. These images can contain from full operating systems to be used as base for compute resources, to simple data. OpenNebula Self-Service offers you the possibility to create or upload your own images.")+'</p>\
<p><span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="action_link" href="#images_tab" action="Image.create_dialog">Create new storage resource</a><br />\
<span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="tab_link" href="#images_tab">See more</a></p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + tr("Network") + '</h3>\
        <div class="panel_info dashboard_p">\
<p><img style="float:right;width:100px;" src="images/network_icon.png" />'+tr("Your compute resources connectivity is performed using pre-defined virtual networks. You can create and manage these networks using OpenNebula Self-Service.")+'</p>\
<p><span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="action_link" href="#vnets_tab" action="Network.create_dialog">Create new network resource</a><br />\
<span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="tab_link" href="#vnets_tab">See more</a><br /></p>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var dashboard_tab = {
    title: tr("Dashboard"),
    content: dashboard_tab_content
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

function quickstart_setup(){

    $('#dashboard_table #quickstart_form input',main_tabs_context).click(function(){
        Sunstone.runAction($(this).val());
    });
}

$(document).ready(function(){
    //Dashboard link listener
    $("#dashboard_table h3 a",main_tabs_context).live("click", function (){
        var tab = $(this).attr('href');
        showTab(tab);
        return false;
    });

    $('.tab_link').click(function(){
        var to= $(this).attr('href');
        $('.outer-west ul li.topTab a[href="'+to+'"]').trigger("click");
        return false;
    });

    $('.action_link').click(function(){
        var to= $(this).attr('href');
        $('.outer-west ul li.topTab a[href="'+to+'"]').trigger("click");
        var action = $(this).attr('action');
        Sunstone.runAction(action);

        //var to= $(this).attr('href');
        //$('.outer-west ul li.topTab a[href="'+to+'"]').trigger("click");
        return false;
    });

    emptyDashboard();

    quickstart_setup();

    $('#li_dashboard_tab a').click(function(){
        hideDialog();
    });

});

//puts the dashboard values into "retrieving"
function emptyDashboard(){
    $("#dashboard_tab .value_td span",main_tabs_context).html(spinner);
}


function updateDashboard(what,json_info){
    var db = $('#dashboard_tab',main_tabs_context);
    switch (what){
    case "vms":
        var total_vms=json_info.length;
        $('#total_vms',db).html(total_vms);
        break;
    case "vnets":
        var total_vnets=json_info.length;
        $('#total_vnets',db).html(total_vnets);
        break;
    case "images":
        var total_images=json_info.length;
        $('#total_images',db).html(total_images);
        break;
    }
}
