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

var user_acct_graphs = [
    { title : tr("CPU"),
      monitor_resources : "CPU",
      humanize_figures : false
    },
    { title : tr("Memory"),
      monitor_resources : "MEMORY",
      humanize_figures : true
    }
];

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
<h3>' + tr("Resources and quotas") + '<i class="icon-refresh action_button" value="User.refresh" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
\
          <table class="info_table" id="quota_usage_table">\
             <tr id="vm_quotas"><td class="key_td">'+tr("Compute")+':</td>\
                 <td class="value_td">'+$vm_count+'</td></tr>\
             <tr id="ds_quotas"><td class="key_td">'+tr("Storage quotas")+':</td>\
                 <td class="value_td"></td></tr>\
             <tr id="image_quotas"><td class="key_td">'+tr("Images")+':</td>\
                 <td class="value_td">'+$storage_count+'</td></tr>\
             <tr id="network_quotas"><td class="key_td">'+tr("Networks")+':</td>\
                 <td class="value_td">'+$network_count+'</td></tr>\
          </table>\
\
        </div>\
      </div>\
    </td>\
  </tr>\
  <tr>\
    <td>\
      <div class="panel" id="user_acct_panel">\
<h3>' + tr("Usages") + '<i class="icon-refresh user_acct_date_ok" style="float:right;cursor:pointer"></i></h3>\
        <div class="panel_info">\
\
          <div style="margin-left:20px;text-align:center;">\
'+tr("From")+':&nbsp;<input type="text" style="font-size:12px;width: 80px;" id="user_acct_from" name="from"/>&nbsp;&nbsp;\
'+tr("To")+':&nbsp;<input type="text" style="font-size:12px;width: 80px;" id="user_acct_to" name="to"/>\
&nbsp;&nbsp;<a href="#" class="user_acct_date_ok">'+tr('Go!')+' <i class="icon-ok"></i></a>\
          </div>\
\
        <table class="info_table">\
           <tr><td id="legend_CPU"></td></tr>\
           <tr><td style="border:0;width:800px!important;">\
                 <div id="user_acct_CPU" style="height:100px;position:relative;left:0px;overflow: hidden;">'+
                  spinner+
                '</div>\
              </td>\
           </tr>\
        </table>\
        <table class="info_table">\
           <tr><td id="legend_MEMORY"></td></tr>\
           <tr><td style="border:0;width:800px!important;">\
                 <div id="user_acct_MEMORY" style="height:100px;position:relative;left:0px;overflow: hidden;">'+
                  spinner+
                '</div>\
              </td>\
           </tr>\
        </table>\
\
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
</tr></table>';

var dashboard_tab = {
    title: '<i class="icon-home"></i>'+tr("Dashboard"),
    content: dashboard_tab_content
}


Sunstone.addAction("User.show", {
    type: "single",
    call: OCCI.User.show,
    callback: dashboardQuotasHTML,
    error: onError
});

Sunstone.addAction('User.refresh', {
    type: "custom",
    call: function(){
        emptyDashboard();
        Sunstone.runAction('User.show', uid);
        Sunstone.runAction('VM.refresh');
        Sunstone.runAction('Image.refresh');
        Sunstone.runAction('Network.refresh');
    }
});

Sunstone.addAction('User.accounting', {
    type: "monitor",
    call: OCCI.User.accounting,
    callback: function(req, response){
        var info = req.request.data[0].monitor;
        plot_graph(response, '#user_acct_panel', 'user_acct_', info);
    },
    error: onError
});

Sunstone.addMainTab('dashboard_tab',dashboard_tab);

function generateDashboardLinks(){
    var links="<ul>";
    for (var i=0; i<dashboard_links.length;i++){
        links+='<li><a href="'+dashboard_links[i].href+'" target="_blank">'+dashboard_links[i].text+'</a></li>';
    };
    links+="</ul>";
    return links;
};


function dashboardQuotaRow(quota_json){
    var row = '';

    var label = function(used, max, unit){
        max = parseInt(max,10) ? max : "unlimited";

        if (unit)
            return used+'&nbsp;'+unit+'&nbsp;/&nbsp'+max+'&nbsp;'+unit;

        return used + '&nbsp;/&nbsp'+ max

    }

    switch (quota_json.TYPE){
    case "VM":
        var vms_used = quota_json.VMS_USED;
        var vms = quota_json.VMS;
        var vms_ratio = vms_used * 100 / vms;
        row += '<tr class="quotas"><td class="padding1">'+tr("Virtual Machines quotas")+'</td>';
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
        var size_used = quota_json.SIZE_USED;
        var size = quota_json.SIZE;
        var size_ratio = parseInt(size,10) ? size_used * 100 / size: 0;
        row += '<tr class="quotas"><td class="padding1">'+tr("Storage size")+'</td>';
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

        row += '<tr class="quotas"><td class="padding1">'+tr("Number of images")+'</td>';
        row += '<td class="value_td">'+
            progressBar(images_ratio,
                        { width: '200px', height: '15px',
                          label: label(images_used, images),
                          fontSize: '1em', labelVPos: '0px' }) +
            '</td></tr>';
        break;
    case "IMAGE":
        row += '<tr class="quotas"><td class="padding1">'+tr("Image quota")+' (id '+quota_json.ID+'):</td><td></td></tr>';

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
        row += '<tr class="quotas"><td class="padding1">'+tr("Network quota")+' (id '+quota_json.ID+'):</td><td></td></tr>';

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
    return row;
}

function dashboardQuotasHTML(req, response){
    var user = response.USER;
    var html = '';

    var context = $('#dashboard_table table#quota_usage_table');

    var results = parseQuotas(user, dashboardQuotaRow);

    $('.quotas', context).remove();
    $('#vm_quotas', context).after(results.VM);
    $('#ds_quotas', context).after(results.DATASTORE);
    $('#image_quotas', context).after(results.IMAGE);
    $('#network_quotas', context).after(results.NETWORK);
};

//puts the dashboard values into "retrieving"
function emptyDashboard(){
    $("#dashboard_tab .value_td > span",main_tabs_context).html(spinner);
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

function accountingSetup(){
    var context = $('#dashboard_table', main_tabs_context);
    //Enable datepicker
    $("#user_acct_from", context).datepicker({
        defaultDate: "-1d",
        changeMonth: true,
        numberOfMonths: 1,
        dateFormat: "dd/mm/yy",
        defaultDate: '-1',
        onSelect: function( selectedDate ) {
            $( "#user_acct_to", context).datepicker("option",
                                                        "minDate",
                                                        selectedDate );
        }
    });
    $("#user_acct_from", context).datepicker('setDate', '-1');

    $("#user_acct_to", context).datepicker({
        defaultDate: "0",
        changeMonth: true,
        numberOfMonths: 1,
        dateFormat: "dd/mm/yy",
        maxDate: '+1',
        onSelect: function( selectedDate ) {
            $( "#user_acct_from", context).datepicker( "option",
                                                           "maxDate",
                                                           selectedDate );
        }
    });
    $("#user_acct_to", context).datepicker('setDate', 'Now');

    //Listen to set date button
    $('.user_acct_date_ok', context).click(function(){
        var from = $("#user_acct_from", context).val();
        var to = $("#user_acct_to", context).val();

        var start = $.datepicker.parseDate('dd/mm/yy', from)
        if (start){
            start = start.getTime();
            start = Math.floor(start / 1000);
        }

        var end = $.datepicker.parseDate('dd/mm/yy', to);
        if (end){
            end = end.getTime();
            end = Math.floor(end / 1000);
        }

        loadAccounting('User', null, user_acct_graphs,
                  { start : start, end: end });
        return false;
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

    accountingSetup();

    $('#li_dashboard_tab').click(function(){
        hideDialog();
    });

    //preload
    dashboardQuotasHTML(null, { USER : {
        VM_QUOTA: {},
        DATASTORE_QUOTA: {},
        IMAGE_QUOTA: {},
        NETWORK_QUOTA: {}
    }
                        });
    Sunstone.runAction("User.show", uid);
    loadAccounting('User', null, user_acct_graphs);
});