/* -------------------------------------------------------------------------- */
/* Copyright 2002-2014, OpenNebula Project (OpenNebula.org), C12G Labs        */
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


var empty_graph_placeholder =
  '<span class="fa-stack fa-2x" style="color: #dfdfdf">'+
    '<i class="fa fa-cloud fa-stack-2x"></i>'+
    //'<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
  '</span>'+
  '<br>'+
  '<span style="color: #cfcfcf">'+
    tr("There is no information available")+
  '</span>';

var dashboard_tab_content = 
  '<div>\
    <div id="one_per_row">\
    </div>\
    <div id="three_per_row" class="row">\
    </div>\
    <div id="two_per_row" class="row">\
    </div>\
    <div id="one_footer">\
    </div>\
  </div>';

var widgets = {
  "storage" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-upload"></i> '+tr("Storage")+'</h5>\
        <div class="row totals-info dashboard-widget-footer">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="total_images subheader"></span><br>\
              <span class="size_images subheader"></span>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("IMAGES")+'</small><br>\
              <small>'+tr("USED")+'</small>\
              </h4>\
            </div>\
        </div>',
  "users" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-user"></i> '+tr("Users")+'</h5>\
        <div class="row totals-info">\
          <div class="large-3 small-3 columns">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="subheader total_users">-</span><br>\
              <span class="subheader total_groups">-</span>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("USERS")+'</small><br>\
              <small>'+tr("GROUPS")+'</small>\
              </h4>\
            </div>'+
          '</div>'+
          '<div class="large-9 small-9 columns" id="dashboard_vdc_user_accounting">'+
            '<input style="display:none;" value="user" id="acct_group_by"/>'+
            '<div class="small-6 large-6 columns">'+
                '<h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>'+
                '<div class="large-12 columns centered graph text-center" id="acct_cpu_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
            '</div>'+
            '<div class="small-6 large-6 columns">'+
                '<h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>'+
                '<div class="large-12 columns centered graph text-center" id="acct_mem_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
            '</div>'+
          '</div>'+
        '</div>\
        <div class="row dashboard-widget-footer">\
            <div class="small-3 large-3 columns text-center">\
            </div>\
            <div class="small-9 large-9 columns text-center">\
              <br>\
              <a class="button secondary radius large-3 small show_users_tab"><i class="fa fa-lg fa-list fa-fw"></i> Users</a>\
              <a class="button secondary radius large-3 small show_create_user"><i class="fa fa-lg fa-plus fa-fw"></i> Create</a>\
            </div>\
        </div>',
  "network" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-sitemap"></i> '+tr("Network")+'</h5>\
        <div class="row totals-info dashboard-widget-footer">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="total_vnets subheader"></span><br>\
              <span class="addresses_vnets subheader"></span>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("VNETS")+'</small><br>\
              <small>'+tr("USED IPs")+'</small>\
              </h4>\
            </div>\
        </div>',
  "hosts" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-hdd-o"></i> '+tr("Hosts")+'</h5>\
        <div class="row  totals-info">\
          <div class="small-3 large-3 columns centered">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
                <span class="total_hosts subheader"/><br>\
                <span class="on_hosts subheader success-color"/><br>\
                <span class="off_hosts subheader"/><br>\
                <span class="error_hosts subheader alert-color"/><br>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
                <small>'+tr("TOTAL")+'</small><br>\
                <small class="success-color">'+tr("ON")+'</small><br>\
                <small>'+tr("OFF")+'</small><br>\
                <small class="alert-color">'+tr("ERROR")+'</small><br>\
              </h4>\
            </div>\
          </div>\
          <div class="small-9 large-9 columns">\
            <div class="row">\
              <div class="small-6 large-6 columns">\
                <div id="dashboard_host_allocated_cpu" style="padding: 0px 40px">\
                </div>\
                <br>\
                <div id="dashboard_host_real_cpu" style="padding: 0px 40px">\
                </div>\
              </div>\
              <div class="small-6 large-6 columns">\
                <div id="dashboard_host_allocated_mem" style="padding: 0px 40px">\
                </div>\
                <br>\
                <div id="dashboard_host_real_mem" style="padding: 0px 40px">\
                </div>\
              </div>\
            </div>\
          </div>\
        </div>\
        <div class="row dashboard-widget-footer">\
            <div class="small-3 large-3 columns text-center">\
            </div>\
            <div class="small-9 large-9 columns text-center">\
              <br>\
              <a class="button secondary radius large-3 small show_hosts_tab"><i class="fa fa-lg fa-list fa-fw"></i> Hosts</a>\
              <a class="button secondary  radius large-3 small show_create_host"><i class="fa fa-lg fa-plus fa-fw"></i> Create</a>\
            </div>\
        </div>',
  "vms" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-th"></i> '+tr("Virtual Machines")+'</h5>\
        <div class="row totals-info">\
          <div class="small-3 large-3 columns">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="subheader total_vms"></span><br>\
              <span class="subheader active_vms success-color"></span><br>\
              <span class="subheader pending_vms"></span><br>\
              <span class="subheader failed_vms alert-color"></span>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("TOTAL")+'</small><br>\
              <small class="success-color">'+tr("ACTIVE")+'</small><br>\
              <small>'+tr("PENDING")+'</small><br>\
              <small class="alert-color">'+tr("FAILED")+'</small>\
              </h4>\
            </div>\
          </div>'+
          '<div class="large-9 small-9 columns" id="dashboard_vm_accounting">'+
            '<input style="display:none;" value="vm" id="acct_group_by"/>'+
            '<div class="small-6 large-6 columns">'+
                '<h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>'+
                '<div class="large-12 columns centered graph text-center" id="acct_cpu_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
            '</div>'+
            '<div class="small-6 large-6 columns">'+
                '<h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>'+
                '<div class="large-12 columns centered graph text-center" id="acct_mem_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row dashboard-widget-footer">\
            <div class="small-3 large-3 columns text-center">\
            </div>\
            <div class="small-9 large-9 columns text-center">\
              <br>\
              <a class="button secondary radius large-3 small show_vms_tab"><i class="fa fa-lg fa-list fa-fw"></i> VMs</a>\
              <a class="button secondary radius large-3 small show_create_vm"><i class="fa fa-lg fa-plus fa-fw"></i> Create</a>\
            </div>\
        </div>',
  "user_quotas" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-align-left"></i> '+tr("User Quotas")+'</h5>\
      <div class="row totals-info dashboard-widget-footer" id="quotas_tab_user">\
        <div class="large-12 small-12 columns">'+
          '<div class="row">'+
            '<div class="large-8 large-centered columns">'+
              '<div class="text-center">'+
                '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                  '<i class="fa fa-cloud fa-stack-2x"></i>'+
                  '<i class="fa fa-align-left fa-stack-1x fa-inverse"></i>'+
                '</span>'+
                '<br>'+
                '<p style="font-size: 18px; color: #999">'+
                  tr("There are no quotas defined")+
                '</p>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>\
      </div>',
  "group_quotas" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-align-left"></i> '+tr("Group Quotas")+'</h5>\
        <div id="quotas_tab_group_TabBody" class="row">\
          <div class="large-12 columns">'+
            '<div class="row">'+
              '<div class="large-8 large-centered columns">'+
                '<div class="text-center">'+
                  '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                    '<i class="fa fa-cloud fa-stack-2x"></i>'+
                    '<i class="fa fa-align-left fa-stack-1x fa-inverse"></i>'+
                  '</span>'+
                  '<br>'+
                  '<p style="font-size: 18px; color: #999">'+
                    tr("There are no quotas defined")+
                  '</p>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>\
        </div>\
        <div class="row dashboard-widget-footer">\
          <div class="large-12 columns">\
            <label>' + tr("Select group") + ':\
              <div id="quotas_tab_group_sel">\
              </div>\
            </label>\
          </div>\
        </div>',
  "accounting" : '<h5 class="subheader"><i class="fa fa-fw fa-lg fa-bar-chart-o"></i> '+tr("Accounting")+'</h5>\
        <div id="dashboard_vm_accounting" class="row dashboard-widget-footer">\
            <div id="user_dashboard_info_acct_div" class="large-12 columns columns">\
            </div>\
        </div>'
}

var widget_refresh = {
    "storage" : function(){
            Sunstone.runAction("Datastore.list");
        },
    "users" : function(){
            Sunstone.runAction("User.list");

            var start_time =  Math.floor(new Date().getTime() / 1000);
            // ms to s

            // 604800 = 7 days = 7*24*60*60
            start_time = start_time - 604800;

            // today
            var end_time = -1;

            var options = {
              "start_time": start_time,
              "end_time": end_time
            }

            var no_table = true;

            OpenNebula.VM.accounting({
                success: function(req, response){
                    fillAccounting($("#dashboard_vdc_user_accounting"), req, response, no_table);
                },
                error: onError,
                data: options
            });
        },
    "network" : function(){
            Sunstone.runAction("Network.list");
        },
    "hosts" : function(){
            Sunstone.runAction("Host.list");
        },
    "vms" : function(){
            Sunstone.runAction("VM.list");

            var start_time =  Math.floor(new Date().getTime() / 1000);
            // ms to s

            // 604800 = 7 days = 7*24*60*60
            start_time = start_time - 604800;

            // today
            var end_time = -1;

            var options = {
              "start_time": start_time,
              "end_time": end_time
            }

            var no_table = true;

            OpenNebula.VM.accounting({
                success: function(req, response){
                    fillAccounting($("#dashboard_vm_accounting"), req, response, no_table);
                },
                error: onError,
                data: options
            });
        },
    "accounting" : function(){
    },
    "user_quotas" : refreshDashboardUserQuotas,
    "group_quotas" : refreshDashboardGroupQuotas
}

var dashboard_tab_actions = {
    "Dashboard.refresh" : {
        type: "custom",
        call: refreshDashboard
    },
    "dashboard-tab.refresh" : {
        type: "custom",
        call: refreshDashboard
    },
}

var quotas_tab_buttons = {
    "Dashboard.refresh" : {
        type: "action",
        layout: "refresh",
        alwaysActive: true
    },
    "Sunstone.toggle_top" : {
        type: "custom",
        layout: "top",
        alwaysActive: true
    }
}

var dashboard_tab = {
    title: '<i class="fa fa-lg fa-fw fa-tachometer"></i>&emsp;'+tr("Dashboard"),
    buttons: quotas_tab_buttons,
    content: dashboard_tab_content,
    showOnTopMenu: false,
    list_header: '<i class="fa fa-fw fa-tachometer"></i>&emsp;'+tr("Dashboard")
}

Sunstone.addActions(dashboard_tab_actions);
Sunstone.addMainTab('dashboard-tab',dashboard_tab);

var $dashboard;

// Quotas calls

function fillUserQuotasInfo(){
    OpenNebula.User.show({
        data : {
            id: '-1'
        },
        success: updateUserQuotasInfo
    });
}

var dashboard_current_gid = "-1";

function updateUserQuotasInfo(request,user_json) {
    var info = user_json.USER;

    dashboard_current_gid = user_json.USER.GID;

    var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS)
    var quotas_tab_html = Quotas.vms(info, default_user_quotas);
    quotas_tab_html += Quotas.cpu(info, default_user_quotas);
    quotas_tab_html += Quotas.memory(info, default_user_quotas);
    quotas_tab_html += Quotas.volatile_size(info, default_user_quotas);
    quotas_tab_html += Quotas.image(info, default_user_quotas);
    quotas_tab_html += Quotas.network(info, default_user_quotas);
    quotas_tab_html += Quotas.datastore(info, default_user_quotas);

    if (emptyQuotas(info)) {
        quotas_tab_html = '<div class="row">'+
                    '<div class="large-8 large-centered columns">'+
                      '<div class="text-center">'+
                        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                          '<i class="fa fa-cloud fa-stack-2x"></i>'+
                          '<i class="fa fa-align-left fa-stack-1x fa-inverse"></i>'+
                        '</span>'+
                        '<br>'+
                        '<p style="font-size: 18px; color: #999">'+
                          tr("There are no quotas defined")+
                        '</p>'+
                      '</div>'+
                    '</div>'+
                  '</div>'
    }

    $("#quotas_tab_user", $dashboard).html(quotas_tab_html);
}

function fillGroupQuotasInfo(group_id){
      OpenNebula.Group.show({
        data : {
            id: group_id
        },
        success: updateGroupQuotasInfo
      });
}

function updateGroupQuotasInfo(request,group_json){
    var info = group_json.GROUP;

    var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);

    var quotas_tab_html = Quotas.vms(info, default_group_quotas);
    quotas_tab_html += Quotas.cpu(info, default_group_quotas);
    quotas_tab_html += Quotas.memory(info, default_group_quotas);
    quotas_tab_html += Quotas.volatile_size(info, default_group_quotas);
    quotas_tab_html += Quotas.image(info, default_group_quotas);
    quotas_tab_html += Quotas.network(info, default_group_quotas);
    quotas_tab_html += Quotas.datastore(info, default_group_quotas);

    if (emptyQuotas(info)) {
        quotas_tab_html = '<div class="row">'+
                    '<div class="large-8 large-centered columns">'+
                      '<div class="text-center">'+
                        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                          '<i class="fa fa-cloud fa-stack-2x"></i>'+
                          '<i class="fa fa-align-left fa-stack-1x fa-inverse"></i>'+
                        '</span>'+
                        '<br>'+
                        '<p style="font-size: 18px; color: #999">'+
                          tr("There are no quotas defined")+
                        '</p>'+
                      '</div>'+
                    '</div>'+
                  '</div>'
    }

    $("#quotas_tab_group_TabBody", $dashboard).html(quotas_tab_html);
}

function refreshDashboardUserQuotas(){
    fillUserQuotasInfo();
}

function refreshDashboardGroupQuotas(){
    gid = $("#quotas_tab_group_sel .resource_list_select", $dashboard).val();

    if (gid == "" || gid == undefined){
        gid = dashboard_current_gid;
    }

    fillGroupQuotasInfo(gid);

    insertSelectOptions('div#quotas_tab_group_sel', $dashboard, "Group", gid, false);
}

function refreshDashboard(){
    widget_types = ['widgets_three_per_row', 'widgets_two_per_row',
        'widgets_one_per_row', 'widgets_one_footer'];

    $.each(widget_types, function(index, widget_type){
        $.each(Config.dashboardWidgets(widget_type), function(id, widget){
            widget_refresh[widget]();
        })
    });
}

$(document).ready(function(){
    var tab_name = 'dashboard-tab';

    if (Config.isTabEnabled(tab_name)) {
        $dashboard = $('#dashboard-tab', main_tabs_context);

        $.each(Config.dashboardWidgets('widgets_three_per_row'), function(id, widget){
            var html = '<div class="small-4 large-4 columns">'+widgets[widget]+'</div>';
            $('#three_per_row', $dashboard).append(html);
        })

        $.each(Config.dashboardWidgets('widgets_two_per_row'), function(id, widget){
            var html = '<div class="small-6 large-6 columns">'+widgets[widget]+'</div>';
            $('#two_per_row', $dashboard).append(html);
        })

        $.each(Config.dashboardWidgets('widgets_one_per_row'), function(id, widget){
            var html = '<div class="row"><div class="large-12 columns">'+widgets[widget]+'</div></div>';
            $('#one_per_row', $dashboard).append(html);
        })

        $.each(Config.dashboardWidgets('widgets_one_footer'), function(id, widget){
            var html = '<div class="row"><div class="large-12 columns">'+widgets[widget]+'</div></div>';
            $('#one_footer', $dashboard).append(html);
        });

        $dashboard.off("change", "#quotas_tab_group_sel .resource_list_select");
        $dashboard.on("change", "#quotas_tab_group_sel .resource_list_select", function() {
            var value_str = $(this).val();
            if(value_str!="")
            {
                fillGroupQuotasInfo(value_str);
            }
        });

        $(".show_vms_tab").on("click", function(){
          showTab('vms-tab');
          return false;
        })

        $(".show_hosts_tab").on("click", function(){
          showTab('hosts-tab');
          return false;
        })

        $(".show_users_tab").on("click", function(){
          showTab('users-tab');
          return false;
        })

        $(".show_create_vm").on("click", function(){
          window.scrollTo(0, 0);
          popUpCreateVMDialog();
          return false;
        })

        $(".show_create_host").on("click", function(){
          window.scrollTo(0, 0);
          popUpCreateHostDialog();
          return false;
        })

        $(".show_create_user").on("click", function(){
          window.scrollTo(0, 0);
          popUpCreateUserDialog();
          return false;
        })
        accountingGraphs(
            $("#user_dashboard_info_acct_div"),
            {   no_table: true,
                fixed_user: config["user_id"],
                fixed_group_by: "vm"
            }
        );

        $(document).foundation();
    }
});
