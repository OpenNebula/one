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
<td style="width:50%">\
<table id="information_table" style="width:100%">\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + dashboard_welcome_title + '</h3>\
        <div class="panel_info dashboard_p">\
<img style="float:left;width:100px;" src="'+
    dashboard_welcome_image+'" />'+
    dashboard_welcome_html+'\
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
              <td class="value_td">'+$vm_count+'</span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Storage") + '</td>\
              <td class="value_td">'+$storage_count+'</span></td>\
            </tr>\
            <tr>\
              <td class="key_td">' + tr("Network") + '</td>\
              <td class="value_td">'+$network_count+'</span></td>\
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
        <div class="panel_info dashboard_p">'+
    generateDashboardLinks() +'\
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
        <h3>' + compute_box_title + '</h3>\
        <div class="panel_info dashboard_p">\
<img style="float:right;width:100px;" src="'+ 
    compute_box_image + '" />'+ 
    compute_box_html +
    '<p><span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="action_link" href="#vms_tab" action="VM.create_dialog">'+tr("Create new compute resource")+'</a><br />\
<span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="tab_link" href="#vms_tab">'+tr("See more")+'</a></p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + storage_box_title + '</h3>\
        <div class="panel_info dashboard_p">\
<img style="float:right;width:100px;" src="'+
    storage_box_image +'" />' + 
    storage_box_html +
    '<p><span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="action_link" href="#images_tab" action="Image.create_dialog">'+tr("Create new storage resource")+'</a><br />\
<span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="tab_link" href="#images_tab">'+tr("See more")+'</a></p>\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel">\
        <h3>' + network_box_title + '</h3>\
        <div class="panel_info dashboard_p">\
<p><img style="float:right;width:100px;" src="' +
    network_box_image +'" />' +
    network_box_html +
    '<p><span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="action_link" href="#vnets_tab" action="Network.create_dialog">'+tr("Create new network resource")+'</a><br />\
<span class="ui-icon ui-icon-arrowreturnthick-1-e" style="display:inline-block;vertical-align:middle;"/><a class="tab_link" href="#vnets_tab">'+tr("See more")+'</a><br /></p>\
        </div>\
      </div>\
    </td>\
  </tr>\
</table>\
</td>\
</tr></table>';

var dashboard_tab = {
    title: '<i class="icon-home"></i>'+tr("Dashboard"),
    content: dashboard_tab_content
}

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

function quickstart_setup(){

    $('#dashboard_table #quickstart_form input',main_tabs_context).click(function(){
        Sunstone.runAction($(this).val());
    });
};

function generateDashboardLinks(){
    var links="<ul>";
    for (var i=0; i<dashboard_links.length;i++){
        links+='<li><a href="'+dashboard_links[i].href+'" target="_blank">'+dashboard_links[i].text+'</a></li>';
    };
    links+="</ul>";
    return links;
};


$(document).ready(function(){
    //Dashboard link listener
    $("#dashboard_table h3 a",main_tabs_context).live("click", function (){
        var tab = $(this).attr('href');
        showTab(tab);
        return false;
    });

    $('.tab_link').click(function(){
        var to= $(this).attr('href').slice(1);
        $('.outer-west ul li#li_'+to).trigger("click");
        return false;
    });

    $('.action_link').click(function(){
        var to= $(this).attr('href').slice(1);
        $('.outer-west ul li#li_'+to).trigger("click");
        var action = $(this).attr('action');
        Sunstone.runAction(action);

        //var to= $(this).attr('href');
        //$('.outer-west ul li.topTab a[href="'+to+'"]').trigger("click");
        return false;
    });

    emptyDashboard();

    quickstart_setup();

    $('#li_dashboard_tab').click(function(){
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
        $('.vm_count',db).html(total_vms);
        break;
    case "vnets":
        var total_vnets=json_info.length;
        $('.network_count',db).html(total_vnets);
        break;
    case "images":
        var total_images=json_info.length;
        $('.storage_count',db).html(total_images);
        break;
    }
}
