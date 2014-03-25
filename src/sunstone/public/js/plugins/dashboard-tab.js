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

var dashboard_tab_content = '<div>\
  <div id="one_per_row">\
  </div>\
  <div id="three_per_row" class="row">\
  </div>\
  <div id="two_per_row" class="row">\
  </div>\
</div>\
';

var widgets = {
  "storage" : '<fieldset>\
        <legend class="span-dashboard"><i class="fa fa-upload"></i> '+tr("Storage")+'</legend>\
        <div class="row totals-info">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="total_images subheader"/><br>\
              <span class="size_images subheader"/>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("IMAGES")+'</small><br>\
              <small>'+tr("USED")+'</small>\
              </h4>\
            </div>\
        </div>\
      </fieldset>',
  "users" : '<fieldset>\
        <legend class="span-dashboard"><i class="fa fa-user"></i> '+tr("Users")+'</legend>\
        <div class="row totals-info">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="subheader total_users"/><br>\
              <span class="subheader total_groups"/>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("USERS")+'</small><br>\
              <small>'+tr("GROUPS")+'</small>\
              </h4>\
            </div>\
        </div>\
      </fieldset>',
  "network" : '<fieldset>\
        <legend class="span-dashboard"><i class="fa fa-sitemap"></i> '+tr("Network")+'</legend>\
        <div class="row totals-info">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="total_vnets subheader"/><br>\
              <span class="addresses_vnets subheader"/>\
              </h4>\
            </div>\
            <div class="small-6 large-6 columns text-left">\
              <h4 class="subheader">\
              <small>'+tr("VNETS")+'</small><br>\
              <small>'+tr("USED IPs")+'</small>\
              </h4>\
            </div>\
        </div>\
      </fieldset>',
  "hosts" : '<fieldset class="dashboard-panel">\
        <legend class="span-dashboard"><i class="fa fa-hdd-o"></i> '+tr("Hosts")+'</legend>\
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
          <div class="small-4 large-4 columns">\
            <div class="row graph_legend text-center">\
              <div class="small-6 large-6 columns">\
                <h4 class="subheader"><small>'+tr("CPU")+'</small></h4>\
              </div>\
            </div>\
            <div class="row">\
              <h4 class="subheader">\
                <small class="subheader small-4 large-4 columns">'+tr("Allocated")+
                '</small>\
              </h4>\
              <div class="small-8 large-8 columns" id="dash_host_allocated_cpu" >\
              </div>\
            </div>\
            <div class="row">\
              <h4 class="subheader">\
                <small class="subheader small-4 large-4 columns">'+tr("Real")+
                '</small>\
              </h4>\
              <div class="small-8 large-8 columns" id="dash_host_real_cpu" >\
              </div>\
            </div>\
          </div>\
          <div class="small-4 large-4 columns">\
            <div class="row graph_legend text-center">\
              <div class="small-6 large-6 columns">\
                <h4 class="subheader"><small>'+tr("MEMORY")+'</small></h4>\
              </div>\
            </div>\
            <div class="row">\
              <h4 class="subheader">\
                <small class="subheader small-4 large-4 columns">'+tr("Allocated")+
                '</small>\
              </h4>\
              <div class="small-8 large-8 columns" id="dash_host_allocated_mem" >\
              </div>\
            </div>\
            <div class="row">\
              <h4 class="subheader">\
                <small class="subheader small-4 large-4 columns">'+tr("Real")+
                '</small>\
              </h4>\
              <div class="small-8 large-8 columns" id="dash_host_real_mem" >\
              </div>\
            </div>\
          </div>\
        </div>\
      </fieldset>',
  "vms" : '<fieldset class="dashboard-panel">\
        <legend class="span-dashboard"><i class="fa fa-cloud"></i> '+tr("Virtual Machines")+'</legend>\
        <div class="row totals-info">\
          <div class="small-3 large-3 columns">\
            <div class="small-6 large-6 columns text-right">\
              <h4 class="subheader">\
              <span class="subheader total_vms"/><br>\
              <span class="subheader active_vms success-color"/><br>\
              <span class="subheader pending_vms"/><br>\
              <span class="subheader failed_vms alert-color"/>\
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
          </div>\
          <div class="small-9 large-9 columns">\
            <div class="row graph_legend text-center">\
              <div class="small-6 large-6 columns">\
                <h4 class="subheader"><small>'+tr("REAL CAPACITY USAGE")+'</small></h4>\
              </div>\
            </div>\
            <div class="row">\
              <h4 class="subheader">\
                <small class="subheader small-4 large-4 columns">'+tr("CPU")+
                '</small>\
              </h4>\
              <div class="small-8 large-8 columns" id="dash_vm_real_cpu" >\
              </div>\
            </div>\
            <div class="row">\
              <h4 class="subheader">\
                <small class="subheader small-4 large-4 columns">'+tr("Memory")+
                '</small>\
              </h4>\
              <div class="small-8 large-8 columns" id="dash_vm_real_mem" >\
              </div>\
            </div>\
          </div>\
        </div>\
      </fieldset>'
}

var dashboard_tab = {
    title: '<i class="fa fa-tachometer"></i>'+tr("Dashboard"),
    content: dashboard_tab_content,
    showOnTopMenu: false,
    list_header: '<i class="fa fa-tachometer"></i> '+tr("Dashboard")
}

Sunstone.addMainTab('dashboard-tab',dashboard_tab);

var $dashboard;

// All monitoring calls and config are called from the Sunstone plugins.

function dashboardQuotasHTML(){}

$(document).ready(function(){
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
      var html = '<div class="row"><div class="large-12 columns">'+widgets[widget]+'</div></div><br>';
      $('#one_per_row', $dashboard).append(html);
    })
});
