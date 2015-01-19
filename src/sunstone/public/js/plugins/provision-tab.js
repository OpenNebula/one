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

var empty_quota_placeholder = 0

var provision_quotas_dashboard =
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Quotas")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<span id="provision_dashboard_rvms_percentage"  style="font-size:50px">'+
              empty_quota_placeholder +
            '</span>'+
            '<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span id="provision_dashboard_cpu_percentage"  style="font-size:50px">'+
              empty_quota_placeholder +
            '</span>'+
            '<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span id="provision_dashboard_memory_percentage"  style="font-size:50px">'+
              empty_quota_placeholder +
            '</span>'+
            '<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="provision_dashboard_rvms_meter" class="meter"></span>'+
            '</div>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="provision_dashboard_cpu_meter" class="meter"></span>'+
            '</div>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="provision_dashboard_memory_meter" class="meter"></span>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<span>'+tr("RUNNING VMS")+'</span>'+
            '<br>'+
            '<span id="provision_dashboard_rvms_str" style="color: #999; font-size: 14px;"></span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span>'+tr("CPU")+'</span>'+
            '<br>'+
            '<span id="provision_dashboard_cpu_str" style="color: #999; font-size: 14px;"></span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span>'+tr("MEMORY")+'</span>'+
            '<br>'+
            '<span id="provision_dashboard_memory_str" style="color: #999; font-size: 14px;"></span>'+
          '</div>'+
        '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>';

var provision_vdc_quotas_dashboard =
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("VDC Quotas")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<span id="provision_dashboard_vdc_rvms_percentage" style="font-size:50px">'+
              empty_quota_placeholder +
            '</span>'+
            '<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span id="provision_dashboard_vdc_cpu_percentage" style="font-size:50px">'+
              empty_quota_placeholder +
            '</span>'+
            '<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span id="provision_dashboard_vdc_memory_percentage" style="font-size:50px">'+
              empty_quota_placeholder +
            '</span>'+
            '<span style="font-size:20px; color: #999">'+"%"+'</span>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="provision_dashboard_vdc_rvms_meter" class="meter"></span>'+
            '</div>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="provision_dashboard_vdc_cpu_meter" class="meter"></span>'+
            '</div>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<div class="progress large radius">'+
            '  <span id="provision_dashboard_vdc_memory_meter" class="meter"></span>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<span>'+tr("RUNNING VMS")+'</span>'+
            '<br>'+
            '<span id="provision_dashboard_vdc_rvms_str" style="color: #999; font-size: 14px;"></span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span>'+tr("CPU")+'</span>'+
            '<br>'+
            '<span id="provision_dashboard_vdc_cpu_str" style="color: #999; font-size: 14px;"></span>'+
          '</div>'+
          '<div class="large-4 columns text-center">'+
            '<span>'+tr("MEMORY")+'</span>'+
            '<br>'+
            '<span id="provision_dashboard_vdc_memory_str" style="color: #999; font-size: 14px;"></span>'+
          '</div>'+
        '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>';

var provision_vms_dashboard =
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Virtual Machines")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row" id="provision_vms_dashboard">'+
    '<div class="large-11 large-centered columns">'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                '<span  id="provision_dashboard_total" style="font-size:80px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span style="color: #999;">'+tr("TOTAL")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center">'+
                '<a href"#" class="medium button success large radius provision_create_vm_button" style="margin-left: 5px; margin-right: 5px"><i class="fa fa-lg fa-plus-square"/></a>'+
                '<a href"#" class="medium button large radius provision_vms_list_button" style="margin-left: 5px; margin-right: 5px"><i class="fa fa-lg fa-th"/></a>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-2 columns">'+
            '<div class="row">'+
              '<div class="large-12 columns text-center">'+
                '<span id="provision_dashboard_running" style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("RUNNING")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center ">'+
                '<span id="provision_dashboard_deploying"  style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("DEPLOYING")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center">'+
                '<span  id="provision_dashboard_off" style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("OFF")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center ">'+
                '<span  id="provision_dashboard_error" style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("ERROR")+'</span>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-6 columns" id="dashboard_vm_accounting">'+
            '<input style="display:none;" value="vm" id="acct_group_by"/>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend">'+
                '<h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph text-center" id="acct_cpu_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend">'+
                '<h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph text-center" id="acct_mem_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>';


var provision_vdc_vms_dashboard =
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("VDC Virtual Machines")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row" id="provision_vdc_vms_dashboard">'+
    '<div class="large-11 large-centered columns">'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                '<span  id="provision_dashboard_vdc_total" style="font-size:80px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span style="color: #999;">'+tr("TOTAL")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center">'+
                '<a href"#" class="medium button success large radius provision_create_vm_button" style="margin-left: 5px; margin-right: 5px"><i class="fa fa-lg fa-plus-square"/></a>'+
                '<a href"#" class="medium button large radius provision_vms_list_button" style="margin-left: 5px; margin-right: 5px"><i class="fa fa-lg fa-th"/></a>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-2 columns">'+
            '<div class="row">'+
              '<div class="large-12 columns text-center">'+
                '<span id="provision_dashboard_vdc_running" style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("RUNNING")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center ">'+
                '<span id="provision_dashboard_vdc_deploying"  style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("DEPLOYING")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center">'+
                '<span  id="provision_dashboard_vdc_off" style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("OFF")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns text-center ">'+
                '<span  id="provision_dashboard_vdc_error" style="font-size:40px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span  style="color: #999; font-size: 14px">'+tr("ERROR")+'</span>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-6 columns" id="dashboard_vdc_vm_accounting">'+
            '<input style="display:none;" value="vm" id="acct_group_by"/>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend">'+
                '<h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph text-center" id="acct_cpu_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend">'+
                '<h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph text-center" id="acct_mem_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>';


var provision_users_dashboard =
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Users")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row" id="provision_users_dashboard">'+
    '<div class="large-11 large-centered columns">'+
        '<div class="row">'+
          '<div class="large-4 columns text-center">'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                '<span  id="provision_dashboard_users_total" style="font-size:80px">'+
                  '<i class="fa fa-spinner fa-spin"></i>'+
                '</span>'+
                '<br>'+
                '<span style="color: #999;">'+tr("TOTAL")+'</span>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
                '<a href"#" class="medium button large success radius provision_create_user_button" style="margin-left: 5px; margin-right: 5px"><i class="fa fa-lg fa-plus-square"/></a>'+
                '<a href"#" class="medium button large radius provision_users_list_button" style="margin-left: 5px; margin-right: 5px"><i class="fa fa-lg fa-users"/></a>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 columns">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-8 columns" id="dashboard_vdc_user_accounting">'+
            '<input style="display:none;" value="user" id="acct_group_by"/>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend">'+
                '<h3 class="subheader"><small>'+tr("CPU hours")+'</small></h3>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph text-center" id="acct_cpu_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend">'+
                '<h3 class="subheader"><small>'+tr("Memory GB hours")+'</small></h3>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph text-center" id="acct_mem_graph" style="height: 100px;">'+
                  empty_graph_placeholder +
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>';

var provision_dashboard = '<div id="provision_dashboard" class="section_content">'+
'</div>';

var provision_create_vm = '<form id="provision_create_vm" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Create Virtual Machine")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<input type="text" id="vm_name"  class="provision-input" placeholder="'+tr("Virtual Machine Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<dl class="accordion provision_accordion_template" data-accordion="provision_accordion_template">'+
        '<dd style="border-bottom: 1px solid #efefef;" class="active">'+
          '<a href="#provision_dd_template" style="background: #fff; font-size: 30px">'+
            '<span class="select_template" style="color:#555">'+
              tr("Select a Template")+
            '</span>'+
            '<span class="selected_template" style="display:none; color:#555">'+
              '<span class="provision-logo selected_template_logo" style="line-height: 80px">'+
              '</span>'+
              '<span class="selected_template_name">'+
              '</span>'+
              '<span class="has-tip right" style="cursor: pointer; margin-right:10px; line-height: 80px">'+
                '<i class="fa fa-pencil"/>'+
              '</span>'+
            '</span>'+
          '</a>'+
          '<div id="provision_dd_template" class="active content">'+
            '<div class="row provision_select_template">'+
              '<div class="large-12 large-centered columns">'+
                '<dl class="tabs text-center" data-tab style="width: 100%">'+
                  '<dd class="active" style="width: 33%;"><a href="#provision_system_templates_selector">'+ tr("System") +'</a></dd>'+
                  '<dd style="width: 33%;"><a href="#provision_vdc_templates_selector">'+ tr("VDC") +'</a></dd>'+
                  '<dd style="width: 34%;"><a href="#provision_saved_templates_selector">'+ tr("Saved") +'</a></dd>'+
                '</dl>'+
                '<div class="row">'+
                  '<div class="large-12 large-centered columns">'+
                    '<h3 class="subheader text-right">'+
                      '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_create_template_search"/>'+
                    '</h3>'+
                    '<br>'+
                  '</div>'+
                '</div>'+
                '<div class="tabs-content">'+
                  '<div class="content active" id="provision_system_templates_selector">'+
                    '<table id="provision_system_templates_table">'+
                      '<thead class="hidden">'+
                        '<tr>'+
                          '<th>'+tr("ID")+'</th>'+
                          '<th>'+tr("Name")+'</th>'+
                          '<th>'+tr("Saved")+'</th>'+
                        '</tr>'+
                      '</thead>'+
                      '<tbody class="hidden">'+
                      '</tbody>'+
                    '</table>'+
                  '</div>'+
                  '<div class="content" id="provision_vdc_templates_selector">'+
                    '<table id="provision_vdc_templates_table">'+
                      '<thead class="hidden">'+
                        '<tr>'+
                          '<th>'+tr("ID")+'</th>'+
                          '<th>'+tr("Name")+'</th>'+
                          '<th>'+tr("Saved")+'</th>'+
                          '<th>'+tr("Shared")+'</th>'+
                        '</tr>'+
                      '</thead>'+
                      '<tbody class="hidden">'+
                      '</tbody>'+
                    '</table>'+
                  '</div>'+
                  '<div class="content" id="provision_saved_templates_selector">'+
                    '<table id="provision_saved_templates_table">'+
                      '<thead class="hidden">'+
                        '<tr>'+
                          '<th>'+tr("ID")+'</th>'+
                          '<th>'+tr("Name")+'</th>'+
                          '<th>'+tr("Saved")+'</th>'+
                          '<th>'+tr("Shared")+'</th>'+
                        '</tr>'+
                      '</thead>'+
                      '<tbody class="hidden">'+
                      '</tbody>'+
                    '</table>'+
                  '</div>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</dd>'+
      '</dl>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
        '<div class="provision_capacity_selector">'+
        '</div>'+
        '<br>'+
        '<br>' +
        '<div class="provision_network_selector">'+
        '</div>'+
        '<br>'+
        '<br>' +
        '<div class="provision_custom_attributes_selector">'+
        '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-7 columns large-centered">'+
      '<div data-alert class="alert-box alert-box-error radius text-center hidden">'+
      '</div>'+
      '<button href="#" class="button large success radius large-12 small-12" type="submit" style="height: 59px">'+tr("Create")+'</button>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
'</form>';


var provision_create_flow = '<form id="provision_create_flow" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Create Service")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<input type="text" id="flow_name"  class="provision-input" placeholder="'+tr("Service Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<dl class="accordion provision_accordion_flow_template" data-accordion="provision_accordion_flow_template">'+
        '<dd style="border-bottom: 1px solid #efefef;" class="active">'+
          '<a href="#provision_dd_flow_template" style="background: #fff; font-size: 30px">'+
            '<span class="select_template" style="color:#555">'+
              tr("Select a Template")+
            '</span>'+
            '<span class="selected_template" style="display:none; color:#555">'+
              '<span class="provision-logo selected_template_logo" style="color:#555"">'+
              '</span>'+
              '<span class="selected_template_name" style="color:#555">'+
              '</span>'+
              '<span class="has-tip right" style="cursor: pointer; margin-right:10px;">'+
                '<i class="fa fa-pencil"/>'+
              '</span>'+
            '</span>'+
          '</a>'+
          '<div id="provision_dd_flow_template" class="provision_select_flow_template active content">'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<h3 class="subheader text-right">'+
                  '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_create_flow_template_search"/>'+
                '</h3>'+
                '<br>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<table id="provision_flow_templates_table">'+
                  '<thead class="hidden">'+
                    '<tr>'+
                      '<th>'+tr("ID")+'</th>'+
                      '<th>'+tr("Name")+'</th>'+
                    '</tr>'+
                  '</thead>'+
                  '<tbody class="hidden">'+
                  '</tbody>'+
                '</table>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</dd>'+
      '</dl>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="provision_network_selector large-9 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="provision_custom_attributes_selector large-9 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div id="provision_customize_flow_template" style="display: none">'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-7 columns large-centered">'+
      '<div data-alert class="alert-box alert-box-error radius text-center hidden">'+
      '</div>'+
      '<button href="#" class="button large success radius large-12 small-12" type="submit" style="height: 59px">'+tr("Create")+'</button>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
'</form>';

var provision_quota_widget = '<div class="row">'+
  '<div class="large-12 large-centered columns">'+
    '<h5 class="subheader text-right">'+
      '<span class="left" style="margin-bottom: 0.5em">'+
        tr("Running VMs")+
      '</span>'+
    '</h5>'+
  '</div>'+
'</div>'+
'<div class="row provision_rvms_quota">'+
  '<div class="medium-3 small-12 columns">'+
    '<select class="provision_quota_select">'+
      '<option value="edit">'+tr("Manual")+'</option>'+
      '<option value="unlimited">'+tr("Unlimited")+'</option>'+
      '<option value="default">'+tr("Default")+'</option>'+
    '</select>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_edit">'+
    '<div class="row collapse">'+
      '<div class="small-9 columns">'+
        '<div class="range-slider radius provision_rvms_quota_slider" data-slider data-options="start: 0; end: 50;">'+
          '<span class="range-slider-handle"></span>'+
          '<span class="range-slider-active-segment"></span>'+
          '<input type="hidden">'+
        '</div>'+
      '</div>'+
      '<div class="large-2 small-2 columns">'+
        '<input type="text"  class="provision-input provision_rvms_quota_input" style="margin-top: -7px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_unlimited" style="display:none">'+
    '<span style="font-size: 18px; color: #999">'+
      tr("Unlimited. VDC quotas will still apply")+
    '</span>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_default" style="display:none">'+
    '<span style="font-size: 18px; color: #999">'+
      tr("Use the default system quotas set by the cloud adminstrator")+
    '</span>'+
  '</div>'+
'</div>'+
'<div class="row">'+
  '<div class="large-12 large-centered columns">'+
    '<h5 class="subheader text-right">'+
      '<span class="left" style="margin-bottom: 0.5em">'+
        tr("CPU")+
      '</span>'+
    '</h5>'+
  '</div>'+
'</div>'+
'<div class="row provision_cpu_quota">'+
  '<div class="medium-3 small-12 columns">'+
    '<select class="provision_quota_select">'+
      '<option value="edit">'+tr("Manual")+'</option>'+
      '<option value="unlimited">'+tr("Unlimited")+'</option>'+
      '<option value="default">'+tr("Default")+'</option>'+
    '</select>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_edit">'+
    '<div class="row collapse">'+
      '<div class="small-9 columns">'+
        '<div class="range-slider radius provision_cpu_quota_slider" data-slider data-options="start: 0; end: 50;">'+
          '<span class="range-slider-handle"></span>'+
          '<span class="range-slider-active-segment"></span>'+
          '<input type="hidden">'+
        '</div>'+
      '</div>'+
      '<div class="large-2 small-2 columns">'+
        '<input type="text"  class="provision-input provision_cpu_quota_input" style="margin-top: -7px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_unlimited" style="display:none">'+
    '<span style="font-size: 18px; color: #999">'+
      tr("Unlimited. VDC quotas will still apply")+
    '</span>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_default" style="display:none">'+
    '<span style="font-size: 18px; color: #999">'+
      tr("Use the default system quotas set by the cloud adminstrator")+
    '</span>'+
  '</div>'+
'</div>'+
'<div class="row">'+
  '<div class="large-12 large-centered columns">'+
    '<h5 class="subheader text-right">'+
      '<span class="left" style="margin-bottom: 0.5em">'+
        tr("Memory (GBs)")+
      '</span>'+
    '</h5>'+
  '</div>'+
'</div>'+
'<div class="vm_param">'+
    '<input type="hidden" class="provision_memory_quota_input"/>'+
'</div>'+
'<div class="row provision_memory_quota">'+
  '<div class="medium-3 small-12 columns">'+
    '<select class="provision_quota_select">'+
      '<option value="edit">'+tr("Manual")+'</option>'+
      '<option value="unlimited">'+tr("Unlimited")+'</option>'+
      '<option value="default">'+tr("Default")+'</option>'+
    '</select>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_edit">'+
    '<div class="row collapse">'+
      '<div class="small-9 columns">'+
        '<div class="range-slider radius provision_memory_quota_slider" data-slider data-options="start: 0; end: 50;">'+
          '<span class="range-slider-handle"></span>'+
          '<span class="range-slider-active-segment"></span>'+
          '<input type="hidden">'+
        '</div>'+
      '</div>'+
      '<div class="large-2 small-2 columns">'+
        '<input type="text"  class="provision-input provision_memory_quota_tmp_input" style="margin-top: -7px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_unlimited" style="display:none">'+
    '<span style="font-size: 18px; color: #999">'+
      tr("Unlimited. VDC quotas will still apply")+
    '</span>'+
  '</div>'+
  '<div class="medium-9 small-12 columns provision_quota_default" style="display:none">'+
    '<span style="font-size: 18px; color: #999">'+
      tr("Use the default system quotas set by the cloud adminstrator")+
    '</span>'+
  '</div>'+
'</div>';

function setup_provision_quota_widget(context){
    // Mode selector, for the 3 sliders
    $("select.provision_quota_select", context).on('change', function(){
      var row = $(this).closest(".row");

      switch($(this).val()) {
        case "edit":
          $("div.provision_quota_edit", row).show();
          $("div.provision_quota_default", row).hide();
          $("div.provision_quota_unlimited", row).hide();

          $("input", row).change();

          break;

        case "default":
          $("div.provision_quota_edit", row).hide();
          $("div.provision_quota_default", row).show();
          $("div.provision_quota_unlimited", row).hide();

          break;

        case "unlimited":
          $("div.provision_quota_edit", row).hide();
          $("div.provision_quota_default", row).hide();
          $("div.provision_quota_unlimited", row).show();

          break;
      }

      return false;
    });

    var provision_rvms_quota_input = $(".provision_rvms_quota_input", context);

    $( ".provision_rvms_quota_slider", context).on('change', function(){
      provision_rvms_quota_input.val($(this).attr('data-slider'))
    });

    provision_rvms_quota_input.change(function() {
        $( ".provision_rvms_quota_slider", context).foundation(
                                            'slider', 'set_value', this.value);
    });

    var provision_cpu_quota_input = $(".provision_cpu_quota_input", context);

    $( ".provision_cpu_quota_slider", context).on('change', function(){
      provision_cpu_quota_input.val($(this).attr('data-slider'))
    });

    provision_cpu_quota_input.change(function() {
        $( ".provision_cpu_quota_slider", context).foundation(
                                            'slider', 'set_value', this.value);
    });

    var provision_memory_quota_input = $(".provision_memory_quota_input", context);
    var provision_memory_quota_tmp_input = $(".provision_memory_quota_tmp_input", context);

    var update_final_memory_input = function() {
      var value = provision_memory_quota_tmp_input.val();
      if (value > 0) {
       provision_memory_quota_input.val( Math.floor(value * 1024) );
      } else {
       provision_memory_quota_input.val(value);
      }
    }

    $( ".provision_memory_quota_slider", context).on('change', function(){
      provision_memory_quota_tmp_input.val($(this).attr('data-slider'));
      update_final_memory_input();
    });

    provision_memory_quota_tmp_input.change(function() {
        update_final_memory_input();
        $( ".provision_memory_quota_slider", context).foundation(
                                            'slider', 'set_value', this.value);
    });

    $(".provision_rvms_quota_input", context).val('').change();
    $(".provision_memory_quota_input", context).val('').change();
    $(".provision_memory_quota_tmp_input", context).val('').change();
    $(".provision_cpu_quota_input", context).val('').change();
}

function reset_provision_quota_widget(context){
  $("select.provision_quota_select", context).val('edit').change();

  $(".provision_rvms_quota_input", context).val('').change();
  $(".provision_memory_quota_input", context).val('').change();
  $(".provision_memory_quota_tmp_input", context).val('').change();
  $(".provision_cpu_quota_input", context).val('').change();
}

function retrieve_provision_quota_widget(context){
  var retrieve_quota = function(select, input){
    switch(select.val()) {
      case "edit":
        return input.val();
      case "default":
        return QUOTA_LIMIT_DEFAULT;
      case "unlimited":
        return QUOTA_LIMIT_UNLIMITED;
    }
  }

  var vms_limit = retrieve_quota(
        $(".provision_rvms_quota select.provision_quota_select", context),
        $(".provision_rvms_quota_input", context));

  var cpu_limit = retrieve_quota(
        $(".provision_cpu_quota select.provision_quota_select", context),
        $(".provision_cpu_quota_input", context));

  var mem_limit = retrieve_quota(
        $(".provision_memory_quota select.provision_quota_select", context),
        $(".provision_memory_quota_input", context));

  return {
    "VM" : {
      "VOLATILE_SIZE": QUOTA_LIMIT_DEFAULT,
      "VMS":    vms_limit,
      "MEMORY": mem_limit,
      "CPU":    cpu_limit
    }
  };
}

var provision_create_user = '<form id="provision_create_user" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h2 class="subheader">'+
        tr("Create User")+
      '</h2>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<input type="text" id="username"  class="provision-input" placeholder="'+tr("Username")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<input type="password" id="password"  class="provision-input" placeholder="'+tr("Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<input type="password" id="repeat_password"  class="provision-input" placeholder="'+tr("Repeat Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader text-right">'+
        '<span class="left">'+
          tr("Define Quotas")+
        '</span>'+
      '</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<dl class="tabs text-center" data-tab style="width: 100%">'+
        '<dd class="active" style="width: 50%;"><a href="#provision_create_user_default_quota">'+ tr("Default") +'</a></dd>'+
        '<dd style="width: 50%;"><a href="#provision_create_user_manual_quota">'+ tr("Manual") +'</a></dd>'+
      '</dl>'+
      '<div class="tabs-content">'+
        '<div class="content active" id="provision_create_user_default_quota">'+
          '<div class="row">'+
            '<div class="large-12 large-centered columns">'+
              '<span style="font-size: 18px; color: #999">'+
                tr("Use the default system quotas set by the cloud adminstrator")+
              '</span>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="content" id="provision_create_user_manual_quota">'+
          provision_quota_widget+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-5 large-centered columns">'+
      '<hr>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-7 columns large-centered">'+
      '<div data-alert class="alert-box alert-box-error radius text-center hidden">'+
      '</div>'+
      '<button href="#" class="button large radius large-12 small-12" type="submit">'+tr("Add User")+'</button>'+
    '</div>'+
  '</div>'+
  '<br>'+
'</form>';

var provision_user_info = '<div id="provision_user_info" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-12 large-centered columns">'+
      '<h2 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-user"/>&emsp;'+
          config["display_name"]+
        '</span>'+
        '<a href"#" id="provision_user_info_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip tip-top">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>&emsp;'+
        '<a href"#" class="off-color has-tip tip-top" data-tooltip title="Log out" id="provision_logout"><i class="fa fa-fw fa-sign-out"/></a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-12 large-centered columns">'+
      '<dl class="tabs text-center" data-tab style="width: 100%">'+
        '<dd class="active" style="width: '+ (Config.isFeatureEnabled("showback") ? '25%' : '33%')+';"><a href="#provision_info_settings"><i class="fa fa-fw fa-lg fa-cogs"/>&emsp;'+ tr("Settings") +'</a></dd>'+
        (Config.isFeatureEnabled("showback") ? '<dd style="width: 25%;"><a href="#provision_info_showback"><i class="fa fa-fw fa-lg fa-money"/>&emsp;'+ tr("Showback") +'</a></dd>' : '') +
        '<dd style="width: '+ (Config.isFeatureEnabled("showback") ? '25%' : '33%')+';"><a href="#provision_info_acct"><i class="fa fa-fw fa-lg fa-bar-chart-o"/>&emsp;'+ tr("Accounting") +'</a></dd>'+
        '<dd style="width: '+ (Config.isFeatureEnabled("showback") ? '25%' : '33%')+';"><a href="#provision_info_quotas"><i class="fa fa-fw fa-lg fa-align-left"/>&emsp;'+ tr("Quotas") +'</a></dd>'+
      '</dl>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="tabs-content">'+
    '<div class="content" id="provision_info_acct">'+
      '<div class="row">'+
        '<div id="provision_user_info_acct_div" class="large-9 large-centered columns">'+
        '</div>'+
      '</div>'+
    '</div>'+
    (Config.isFeatureEnabled("showback") ? '<div class="content" id="provision_info_showback">'+
      '<div class="row">'+
        '<div id="provision_user_info_showback_div" class="large-12 large-centered columns">'+
        '</div>'+
      '</div>'+
    '</div>' : '')+
    '<div class="content" id="provision_info_quotas">'+
      '<div class="row">'+
        '<div id="provision_user_info_quotas_div" class="large-9 large-centered columns quotas">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="content active" id="provision_info_settings">'+
      '<div class="row">'+
        '<div class="large-6 columns">'+
          '<div class="row">'+
            '<div class="large-12 large-centered columns">'+
              '<dl class="accordion" data-accordion>'+
                '<dd>'+
                  '<a href="#provision_update_language_accordion" class="text-center accordion-a">'+
                    '<div class="row only-not-active">'+
                      '<div class="large-12 large-centered columns">'+
                        '<div class="text-center">'+
                          '<span class="fa-stack fa-3x" style="color: #777">'+
                            '<i class="fa fa-cloud fa-stack-2x"></i>'+
                            '<i class="fa fa-comments fa-stack-1x fa-inverse"></i>'+
                          '</span>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<br class="only-not-active">'+
                    '<i class="fa fa-lg fa-comments only-active"></i> '+
                    tr("Change Language")+
                  '</a>'+
                  '<div id="provision_update_language_accordion" class="content">'+
                    '<br>'+
                    '<form id="provision_change_language_form">'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<select type="language" id="provision_new_language" class="provision-input" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;">'+
                          language_options +
                          '</select>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<button href"#" type="submit" class="button large radius large-12 small-12">'+tr("Update Language")+'</button>'+
                        '</div>'+
                      '</div>'+
                    '</form>'+
                  '</div>'+
                '</dd>'+
              '</dl>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="large-6 columns">'+
          '<div class="row">'+
            '<div class="large-12 large-centered columns">'+
              '<dl class="accordion" data-accordion>'+
                '<dd>'+
                  '<a href="#provision_update_password_accordion" class="text-center accordion-a">'+
                    '<div class="row only-not-active">'+
                      '<div class="large-12 large-centered columns">'+
                        '<div class="text-center">'+
                          '<span class="fa-stack fa-3x" style="color: #777">'+
                            '<i class="fa fa-cloud fa-stack-2x"></i>'+
                            '<i class="fa fa-lock fa-stack-1x fa-inverse"></i>'+
                          '</span>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<br class="only-not-active">'+
                    '<i class="fa fa-lg fa-lock only-active"></i> '+
                    tr("Change Password")+
                  '</a>'+
                  '<div id="provision_update_password_accordion" class="content">'+
                    '<br>'+
                    '<form id="provision_change_password_form">'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<input type="password" id="provision_new_password" class="provision-input" placeholder="'+tr("New Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<input type="password" id="provision_new_confirm_password" class="provision-input" placeholder="'+tr("Confirm Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<button href"#" type="submit" class="button large radius large-12 small-12">'+tr("Update Password")+'</button>'+
                        '</div>'+
                      '</div>'+
                    '</form>'+
                  '</div>'+
                '</dd>'+
              '</dl>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-6 columns">'+
          '<div class="row">'+
            '<div class="large-12 large-centered columns">'+
              '<dl class="accordion" data-accordion>'+
                '<dd>'+
                  '<a href="#provision_update_view_accordion" class="text-center accordion-a">'+
                    '<div class="row only-not-active">'+
                      '<div class="large-12 large-centered columns">'+
                        '<div class="text-center">'+
                          '<span class="fa-stack fa-3x" style="color: #777">'+
                            '<i class="fa fa-cloud fa-stack-2x"></i>'+
                            '<i class="fa fa-picture-o fa-stack-1x fa-inverse"></i>'+
                          '</span>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                    '<br class="only-not-active">'+
                    '<i class="fa fa-lg fa-picture-o only-active"></i> '+
                    tr("Change view")+
                  '</a>'+
                  '<div id="provision_update_view_accordion" class="content">'+
                    '<br>'+
                    '<form id="provision_change_view_form">'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<select id="provision_user_views_select" class="provision-input" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;">'+
                          '</select>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="large-12 columns">'+
                          '<button href"#" type="submit" class="button large radius large-12 small-12">'+tr("Update view")+'</button>'+
                        '</div>'+
                      '</div>'+
                    '</form>'+
                  '</div>'+
                '</dd>'+
              '</dl>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="large-6 columns">'+
          '<form id="provision_add_ssh_key_form">'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<dl class="accordion" data-accordion>'+
                  '<dd >'+
                    '<a href="#provision_add_ssh_key_accordion" class="text-center accordion-a">'+
                      '<div class="row only-not-active">'+
                        '<div class="large-12 large-centered columns">'+
                          '<div class="text-center">'+
                            '<span class="fa-stack fa-3x" style="color: #777">'+
                              '<i class="fa fa-cloud fa-stack-2x"></i>'+
                              '<i class="fa fa-key fa-stack-1x fa-inverse"></i>'+
                            '</span>'+
                          '</div>'+
                        '</div>'+
                      '</div>'+
                      '<br class="only-not-active">'+
                      '<i class="fa fa-key fa-lg only-active"></i> '+
                      '<span class="provision_add_ssh_key_button">'+ tr("Add SSH Key")+ '</span>'+
                      '<span class="provision_update_ssh_key_button">'+ tr("Update SSH Key")+ '</span>'+
                    '</a>'+
                    '<div id="provision_add_ssh_key_accordion" class="content">'+
                      '<br>'+
                      '<p style="font-size: 16px; color: #999">'+
                        '<span class="provision_add_ssh_key_button">'+
                          tr("Add a public SSH key to your account!")+
                          '<br>'+
                          tr("You will be able to access your Virtual Machines without password")+
                        '</span>'+
                        '<span class="provision_update_ssh_key_button">'+
                          tr("Update your public SSH key!")+
                          '<br>'+
                          tr("You will be able to access your Virtual Machines without password")+
                        '</span>'+
                      '</p>'+
                      '<div class="row">'+
                        '<div class="large-12 large-centered columns">'+
                          '<textarea id="provision_ssh_key" style="height: 100px; font-size: 14px" placeholder="SSH key" class="provision-input"></textarea>'+
                        '</div>'+
                      '</div>'+
                      '<div class="row">'+
                        '<div class="large-12 large-centered columns">'+
                          '<button href="#" type="submit" class="provision_add_ssh_key_button button large radius large-12 small-12">'+tr("Add SSH Key")+'</button>'+
                          '<button href="#" type="submit" class="provision_update_ssh_key_button button large radius large-12 small-12 hidden">'+tr("Update SSH Key")+'</button>'+
                        '</div>'+
                      '</div>'+
                    '</div>'+
                  '</dd>'+
                '</dl>'+
              '</div>'+
            '</div>'+
          '</form>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>';


var provision_info_vdc_user =
'<div class="text-center provision_info_vdc_user_loading">'+
  '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
    '<i class="fa fa-cloud fa-stack-2x"></i>'+
    '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
  '</span>'+
  '<br>'+
  '<br>'+
  '<span style="font-size: 18px; color: #999">'+
  '</span>'+
'</div>'+
'<div class="provision_info_vdc_user">'+
  '<div class="row">'+
    '<div class="large-12 large-centered columns">'+
      '<ul class="inline-list provision_action_icons">'+
        '<li class="">'+
          '<a href"#" data-tooltip title="Update the User Quotas" class="left button medium secondary radius provision_vdc_user_quota_confirm_button tip-top">'+
            '<i class="fa fa-fw fa-lg fa-align-left"/>'+
          '</a>'+
          '<a href"#" data-tooltip title="Change the password of the User" class="left button medium secondary radius provision_vdc_user_password_confirm_button tip-top">'+
            '<i class="fa fa-fw fa-lg fa-lock"/>'+
          '</a>'+
        '</li>'+
        '<li class="right">'+
          '<a href"#" data-tooltip title="Delete the User" class="right button medium radius alert provision_vdc_user_delete_confirm_button tip-top">'+
            '<i class="fa fa-fw fa-lg fa-trash-o"/>'+
          '</a>'+
        '</li>'+
      '</ul>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="provision_vdc_user_confirm_action large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-4 columns">'+
      '<ul class="provision-pricing-table_user_info provision-pricing-table" style="border: 0px !important; background: #fff;">'+
      '</ul>'+
    '</div>'+
    '<div class="large-8 columns">'+
      '<div class="row dashboard_vm_accounting">'+
        '<div id="acct_content">'+
          '<div class="large-6 columns">'+
            '<input style="display:none;" value="vm" id="acct_group_by"/>'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend text-center">'+
                '<span style="color: #777; font-size: 14px">'+tr("CPU hours")+'</span>'+
              '</div>'+
              '<br>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph" id="acct_cpu_graph" style="height: 180px;">'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<div class="row">'+
              '<div class="large-12 columns graph_legend text-center">'+
                '<span style="color: #777; font-size: 14px">'+tr("Memory GB hours")+'</span>'+
              '</div>'+
              '<div class="large-12 columns">'+
                '<div class="large-12 columns centered graph" id="acct_mem_graph" style="height: 180px;">'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div id="acct_no_data">'+
          '<div class="row">'+
            '<div class="large-12 columns text-center">'+
                empty_graph_placeholder +
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="provision_vdc_info_container large-12 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<br>'+
'</div>'

var list_users_accordion_id = 0;

function provision_list_users(opts_arg){
  list_users_accordion_id += 1;
  return '<dl class="accordion accordion_list provision_list_users" data-accordion>'+
    '<dd class="active">'+
      '<a href="#provision_list_user_accordion'+list_users_accordion_id+'" class="provision_back right only-not-active">'+
        '<span class="button medium radius">'+
          '<i class="fa fa-fw fa-lg fa-th"/> '+
          '<i class="fa fa-fw fa-lg fa-chevron-left"/> '+
          //tr("Show List") +
        '</span>' +
      '</a>'+
      '<h2 class="subheader">'+
          tr("Users")+
          '<span class="provision_info_vdc_user_name only-not-active" style="margin-left: 20px; color: #777; font-size: 20px">'+
          '</span>'+
          '<span href"#" class="right only-active provision_users_list_refresh_button button medium radius secondary" data-tooltip title="'+ tr("Refresh")+'">'+
            '<i class="fa fa-fw fa-lg fa-refresh"/>'+
          '</span>'+
          '<span href"#" class="right only-not-active provision_refresh_info button medium radius secondary" data-tooltip title="'+ tr("Refresh")+'">'+
            '<i class="fa fa-fw fa-lg fa-refresh"/>'+
          '</span>'+
          '<input type="search" class="provision_list_users_search provision-search-input right only-active" placeholder="Search"/>'+
          '<span href"#" class="right only-active provision_create_user_button button medium radius success">'+
            '<i class="fa fa-fw fa-lg fa-plus-square"/>'+
          '</span>'+
      '</h2>'+
      '<div id="provision_list_user_accordion'+list_users_accordion_id+'" class="content active">'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<table class="provision_users_table">'+
              '<thead class="hidden">'+
                '<tr>'+
                  '<th>'+tr("ID")+'</th>'+
                  '<th>'+tr("Name")+'</th>'+
                '</tr>'+
              '</thead>'+
              '<tbody class="hidden">'+
              '</tbody>'+
            '</table>'+
            '<br>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</dd>'+
    '<dd>'+
      '<a class="provision_show_user_accordion" href="#provision_show_user_accordion'+list_users_accordion_id+'">'+
      '</a>'+
      '<div id="provision_show_user_accordion'+list_users_accordion_id+'" class="content">'+
        provision_info_vdc_user +
      '</div>'+
    '</dd>'+
  '</dl>';
}


var provision_manage_vdc = '<div id="provision_manage_vdc" class="hidden section_content">'+
      '<div class="row">'+
        '<div class="large-11 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              tr("VDC Accounting")+
            '</span>'+
          '</h3>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div  id="provision_info_vdc_group_acct" class="large-10 large-centered columns">'+
        '</div>'+
      '</div>'+
      '<br>'+
      (Config.isFeatureEnabled("showback") ? '<div class="row">'+
        '<div class="large-11 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              tr("VDC Showback")+
            '</span>'+
          '</h3>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div  id="provision_info_vdc_group_showback" class="large-10 large-centered columns">'+
        '</div>'+
      '</div>'+
      '<br>' : '') +
      '<div class="row">'+
        '<div class="large-11 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              tr("VDC Quotas")+
            '</span>'+
          '</h3>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-11 columns large-centered quotas" id="provision_vdc_quotas_div">'+
        '</div>'+
      '</div>'+
'</div>';

var list_templates_accordion_id = 0;

function provision_list_templates(opts_arg){
  opts = $.extend({
      title: tr("Saved Templates"),
      refresh: true,
      create: true,
      active: true,
      filter: true
    },opts_arg)

  list_templates_accordion_id += 1;
  return '<dl class="accordion accordion_list provision_list_templates" data-accordion="dfsaf">'+
    '<dd class="'+ (opts.active ? 'active' : '') +'">'+
      '<a class="right only-not-active" href="#provision_list_template_accordion'+list_templates_accordion_id+'">'+
        '<span class="button medium radius">'+
          '<i class="fa fa-fw fa-lg fa-th"/> '+
          '<i class="fa fa-fw fa-lg fa-chevron-left"/> '+
          //tr("Show List") +
        '</span>' +
      '</a>'+
      '<h2 class="subheader">'+
        opts.title +
        '<span href"#" class="right only-active button medium radius secondary provision_templates_list_refresh_button"  '+(!opts.refresh ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Refresh")+'">'+
          '<i class="fa fa-fw fa-lg fa-refresh"/>'+
        '</span>'+
        '<span href"#" class="right only-active button medium radius secondary provision_templates_list_filter_button"  '+(!opts.filter ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Filter by User")+'">'+
          '<i class="fa fa-fw fa-lg fa-filter"/>'+
        '</span>'+
        '<span class="right only-active provision_list_templates_filter" style="display: none"></span>'+
        '<input type="search" class="provision_list_templates_search right only-active provision-search-input right" placeholder="Search"/>'+
      '</h2>'+
      '<div id="provision_list_template_accordion'+list_templates_accordion_id+'" class="content '+ (opts.active ? 'active' : '') +'">'+
        '<div class="row">'+
          '<div class="provision_confirm_delete_template_div large-10 large-centered columns">'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<table class="provision_templates_table">'+
              '<thead class="hidden">'+
                '<tr>'+
                  '<th>'+tr("ID")+'</th>'+
                  '<th>'+tr("Name")+'</th>'+
                  '<th>'+tr("Saved")+'</th>'+
                  '<th>'+tr("User ID")+'</th>'+
                '</tr>'+
              '</thead>'+
              '<tbody class="hidden">'+
              '</tbody>'+
            '</table>'+
            '<br>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</dd>'+
    '<dd>'+
      '<a class="provision_show_template_accordion" href="#provision_show_template_accordion'+list_templates_accordion_id+'">'+
      '</a>'+
      '<div id="provision_show_template_accordion'+list_templates_accordion_id+'" class="content">'+
        //provision_info_vdc_template +
      '</div>'+
    '</dd>'+
  '</dl>';
}

var provision_info_vm =
'<div class="text-center provision_info_vm_loading">'+
  '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
    '<i class="fa fa-cloud fa-stack-2x"></i>'+
    '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
  '</span>'+
  '<br>'+
  '<br>'+
  '<span style="font-size: 18px; color: #999">'+
  '</span>'+
'</div>'+
'<div class="provision_info_vm">'+
  '<div class="row">'+
    '<div class="large-12 large-centered columns">'+
      '<ul class="inline-list provision_action_icons">'+
        '<li>'+
          '<a href"#" data-tooltip title="Open a remote console in a new window" class="left button medium radius provision_vnc_button tip-top">'+
            '<i class="fa fa-fw fa-lg fa-desktop"/> '+
          '</a>'+
          '<a data-tooltip title="You have to boot the Virtual Machine first" class="left button medium radius white provision_vnc_button_disabled tip-top" style="color: #999">'+
            '<i class="fa fa-fw fa-lg fa-desktop"/> '+
          '</a>'+
          (Config.isTabPanelEnabled("provision-tab", "templates") ?
            '<a href"#" data-tooltip title="The main disk of the Virtual Machine will be saved in a new Image" class="left button medium radius success provision_snapshot_button tip-top">'+
              '<i class="fa fa-fw fa-lg fa-save"/> '+
            '</a>'+
            '<a data-tooltip title="You have to power-off the virtual machine first" class="left button medium radius white provision_snapshot_button_disabled tip-top" style="color: #999">'+
              '<i class="fa fa-fw fa-lg fa-save"/> '+
            '</a>' : '') +
        '</li>'+
        '<li class="right">'+
          '<a href"#" data-tooltip title="Delete" class="button medium radius alert provision_delete_confirm_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-trash-o"/>'+
          '</a>'+
          '<a href"#" data-tooltip title="Delete" class="button medium radius alert provision_shutdownhard_confirm_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-trash-o"/>'+
          '</a>'+
          '<a href"#" data-tooltip title="Power off" class="button medium radius secondary provision_poweroff_confirm_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-power-off"/> '+
          '</a>'+
          '<a href"#" data-tooltip title="Power on" class="button medium radius secondary provision_poweron_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-play"/> '+
          '</a>'+
          '<a href"#" data-tooltip title="Reboot" class="button medium radius secondary provision_reboot_confirm_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-repeat"/> '+
          '</a>'+
        '</li>'+
      '</ul>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="provision_confirm_action large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-4 columns">'+
      '<ul class="provision-pricing-table_vm_info provision-pricing-table" style="border: 0px !important; background: #fff;">'+
      '</ul>'+
    '</div>'+
    '<div class="large-8 columns">'+
      '<div class="row">'+
        '<div class="large-6 medium-6  columns">'+
          '<div class="row text-center">'+
            '<div class="large-12 columns">'+
              '<h3 class="subheader"><small>'+tr("CPU")+'</small></h3>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<div class="large-12 columns centered graph vm_cpu_graph" style="height: 100px;">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row graph_legend">'+
            '<div class="large-12 columns centered vm_cpu_legend">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="large-6 medium-6 columns">'+
          '<div class="row text-center">'+
            '<div class="large-12 columns">'+
              '<h3 class="subheader"><small>'+tr("MEMORY")+'</small></h3>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<div class="large-12 columns centered graph vm_memory_graph" style="height: 100px;">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row graph_legend">'+
            '<div class="large-12 columns centered vm_memory_legend">'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<div class="large-6 medium-6 columns">'+
          '<div class="row text-center">'+
            '<div class="large-12 columns">'+
              '<h3 class="subheader"><small>'+tr("NET RX")+'</small></h3>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<div class="large-12 columns centered graph vm_net_rx_graph" style="height: 100px;">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row graph_legend">'+
            '<div class="large-12 columns centered vm_net_rx_legend">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="large-6 medium-6  columns">'+
          '<div class="row text-center">'+
            '<div class="large-12 columns">'+
              '<h3 class="subheader"><small>'+tr("NET TX")+'</small></h3>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<div class="large-12 columns centered graph vm_net_tx_graph" style="height: 100px;">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row graph_legend">'+
            '<div class="large-12 columns centered vm_net_tx_legend">'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<div class="large-6 medium-6  columns">'+
          '<div class="row text-center">'+
            '<div class="large-12 columns">'+
              '<h3 class="subheader"><small>'+tr("NET DOWNLOAD SPEED")+'</small></h3>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<div class="large-12 columns centered graph vm_net_rx_speed_graph" style="height: 100px;">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row graph_legend">'+
            '<div class="large-12 columns centered vm_net_rx_speed_legend">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="large-6 medium-6 columns">'+
          '<div class="row text-center">'+
            '<div class="large-12 columns">'+
              '<h3 class="subheader"><small>'+tr("NET UPLOAD SPEED")+'</small></h3>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<div class="large-12 columns centered graph vm_net_tx_speed_graph" style="height: 100px;">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row graph_legend">'+
            '<div class="large-12 columns centered vm_net_tx_speed_legend">'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
'</div>';

var list_vms_accordion_id = 0;

function provision_list_vms(opts_arg){
  opts = $.extend({
      title: tr("Virtual Machines"),
      refresh: true,
      create: true,
      filter: true
    },opts_arg)

  list_vms_accordion_id += 1;
  return '<dl class="accordion accordion_list provision_list_vms" data-accordion>'+
    '<dd class="'+ (opts.active ? 'active' : '') +'">'+
        '<a href="#provision_list_vm_accordion'+list_vms_accordion_id+'" class="provision_back right only-not-active">'+
          '<span class="button medium radius">'+
            '<i class="fa fa-fw fa-lg fa-th"/> '+
            '<i class="fa fa-fw fa-lg fa-chevron-left"/> '+
            //tr("Show List") +
          '</span>' +
        '</a>' +
        '<h2 class="subheader">'+
          opts.title +
          '<span class="provision_info_vm_name only-not-active" style="margin-left: 20px; color: #777; font-size: 20px">'+
          '</span>'+
          '<span href"#" class="right only-active button medium radius secondary provision_vms_list_refresh_button" '+(!opts.refresh ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Refresh")+'">'+
            '<i class="fa fa-fw fa-lg fa-refresh"/> '+
          '</span>'+
          '<span href"#" class="right only-not-active button medium radius secondary provision_refresh_info" '+(!opts.refresh ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Refresh")+'">'+
            '<i class="fa fa-fw fa-lg fa-refresh"/>'+
          '</span>' +
          '<span href"#" class="right only-active button medium radius secondary provision_vms_list_filter_button" '+(!opts.filter ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Filter by User")+'">'+
            '<i class="fa fa-fw fa-lg fa-filter"/> '+
          '</span>'+
          '<span class="right only-active provision_list_vms_filter" style="display: none"></span>'+
          '<span>' +
          '<input type="search" class="right only-active provision_list_vms_search provision-search-input right" placeholder="Search"/>'+
          '<span href"#" class="right only-active button medium radius success provision_create_vm_button" '+(!opts.create ? 'style="display:none" ': "") + '>'+
            '<i class="fa fa-fw fa-lg fa-plus-square"/> '+
          '</span>' +
        '</h2>'+
      '<div id="provision_list_vm_accordion'+list_vms_accordion_id+'" class="content '+ (opts.active ? 'active' : '') +'">'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<table class="provision_vms_table">'+
              '<thead class="hidden">'+
                '<tr>'+
                  '<th>'+tr("ID")+'</th>'+
                  '<th>'+tr("Name")+'</th>'+
                  '<th>'+tr("User ID")+'</th>'+
                '</tr>'+
              '</thead>'+
              '<tbody class="hidden">'+
              '</tbody>'+
            '</table>'+
            '<br>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</dd>'+
    '<dd>'+
      '<a class="provision_show_vm_accordion" href="#provision_show_vm_accordion'+list_vms_accordion_id+'">'+
      '</a>'+
      '<div id="provision_show_vm_accordion'+list_vms_accordion_id+'" class="content">'+
        provision_info_vm +
      '</div>'+
    '</dd>'+
  '</dl>';
}

var provision_info_flow =
'<div class="text-center provision_info_flow_loading">'+
  '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
    '<i class="fa fa-cloud fa-stack-2x"></i>'+
    '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
  '</span>'+
  '<br>'+
  '<br>'+
  '<span style="font-size: 18px; color: #999">'+
  '</span>'+
'</div>'+
'<div class="provision_info_flow">'+
  '<div class="row">'+
    '<div class="large-12 large-centered columns">'+
      '<ul class="inline-list provision_action_icons">'+
        '<li>'+
          '<a href"#" data-tooltip title="Recover a failed service, cleaning the failed VMs" class="left button medium radius success provision_recover_button">'+
            '<i class="fa fa-fw fa-lg fa-wrench"/> '+
          '</a>'+
        '</li>'+
        '<li class="right">'+
          '<a href"#" data-tooltip title="Delete" class="button medium radius alert provision_delete_confirm_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-trash-o"/>'+
          '</a>'+
          '<a href"#" data-tooltip title="Shutdown" class="button medium radius secondary provision_shutdown_confirm_button tip-top right">'+
            '<i class="fa fa-fw fa-lg fa-power-off"/>'+
          '</a>'+
        '</li>'+
      '</ul>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="provision_confirm_action large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-4 columns">'+
      '<ul class="provision-pricing-table_flow_info provision-pricing-table" style="border: 0px !important; background: #fff;">'+
      '</ul>'+
    '</div>'+
    '<div class="large-8 columns">'+
      '<div class="row">'+
        '<div class="large-12 columns">'+
          '<ul class="provision_roles_ul large-block-grid-2 medium-block-grid-2 small-block-grid-1 text-center">'+
          '</ul>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="provision_role_vms_container large-12 large-centered columns">'+
    '</div>'+
  '</div>'+
'</div>';

var list_flows_accordion_id = 0;

function provision_list_flows(opts_arg){
  opts = $.extend({
      title: tr("Services"),
      active: true,
      refresh: true,
      create: true,
      filter: true
    },opts_arg)

  list_flows_accordion_id += 1;
  return '<dl class="accordion accordion_list provision_list_flows" data-accordion>'+
    '<dd class="'+ (opts.active ? 'active' : '') +'">'+
      '<a class="provision_list_flow_accordion right only-not-active provision_back" href="#provision_list_flow_accordion'+list_flows_accordion_id+'">'+
        '<span class="button medium radius">'+
          '<i class="fa fa-fw fa-lg fa-th"/> '+
          '<i class="fa fa-fw fa-lg fa-chevron-left"/> '+
          //tr("Show List") +
        '</span>' +
      '</a>'+
      '<h2 class="subheader">'+
        opts.title +
        '<span class="provision_info_flow_name only-not-active" style="margin-left: 20px; color: #777; font-size: 20px">'+
        '</span>'+
        '<span href"#" class="only-active right button radius medium secondary provision_flows_list_refresh_button"  '+(!opts.refresh ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Refresh")+'">'+
          '<i class="fa fa-fw fa-lg fa-refresh"/>'+
        '</span>'+
        '<span href"#" class="only-not-active right button medium radius secondary provision_refresh_info"  '+(!opts.refresh ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Refresh")+'">'+
          '<i class="fa fa-fw fa-lg fa-refresh"/>'+
        '</span>'+
        '<span href"#" class="only-active right button radius medium secondary provision_flows_list_filter_button"  '+(!opts.filter ? 'style="display:none" ': "") + 'data-tooltip title="'+ tr("Filter by User")+'">'+
          '<i class="fa fa-fw fa-lg fa-filter"/> '+
        '</span>'+
        '<span class="only-active right provision_list_flows_filter" style="display: none"></span>'+
        '<span>'+
        '<input type="search" class="only-active provision_list_flows_search provision-search-input right" placeholder="Search"/>'+
        '<span href"#" class="only-active right button radius medium success provision_create_flow_button" '+(!opts.create ? 'style="display:none" ': "") + '>'+
          '<i class="fa fa-fw fa-lg fa-plus-square"/> '+
        '</span>'+
      '</h2>'+
      '<div id="provision_list_flow_accordion'+list_flows_accordion_id+'" class="content '+ (opts.active ? 'active' : '') +'">'+
        '<div class="">'+
          '<div class="row">'+
            '<div class="large-12 large-centered columns">'+
              '<table class="provision_flows_table">'+
                '<thead class="hidden">'+
                  '<tr>'+
                    '<th>'+tr("ID")+'</th>'+
                    '<th>'+tr("Name")+'</th>'+
                    '<th>'+tr("User ID")+'</th>'+
                  '</tr>'+
                '</thead>'+
                '<tbody class="hidden">'+
                '</tbody>'+
              '</table>'+
              '<br>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</dd>'+
    '<dd>'+
      '<a class="provision_show_flow_accordion" href="#provision_show_flow_accordion'+list_flows_accordion_id+'">'+
      '</a>'+
      '<div id="provision_show_flow_accordion'+list_flows_accordion_id+'" class="content">'+
        provision_info_flow +
      '</div>'+
    '</dd>'+
  '</dl>';
}

var provision_content = provision_dashboard +
  provision_user_info +
  provision_create_vm +
  '<div class="provision_vms_list_section hidden section_content">' +
  '</div>';

if (Config.isTabPanelEnabled("provision-tab", "templates")) {
  provision_content += '<div class="provision_templates_list_section hidden section_content">';
  provision_content += '</div>';
}

if (Config.isTabPanelEnabled("provision-tab", "users")) {
  provision_content += provision_manage_vdc;
  provision_content += '<div class="provision_users_list_section hidden section_content">';
  provision_content += '</div>';
  provision_content += provision_create_user;
}

if (Config.isTabPanelEnabled("provision-tab", "flows")) {
  provision_content += '<div class="provision_flows_list_section hidden section_content">'
  provision_content += '</div>'
  provision_content += provision_create_flow;
}

var provision_header = '<a href="#" class="provision_image_header" ><img src="'+Config.provision.logo+'" style="height:40px; vertical-align:top"></a>'+
    '<span class="right" style="font-size: 50%; color: #dfdfdf">'+
   '<ul class="inline-list text-center" style="font-size:12px; margin-bottom: 0px">';

if (Config.isTabPanelEnabled("provision-tab", "users")) {
  provision_header +=
    '<li>'+
      '<a href"#" class="medium off-color" id="provision_vdc_info_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-bar-chart-o"/><br>'+tr("VDC Info")+'</a>'+
    '</li>'+
    '<li>'+
      '<a href"#" class="medium off-color provision_users_list_button" id="" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-users"/><br>'+tr("Users")+'</a>'+
    '</li>'+
    '<li style="border-left: 1px solid #efefef; height: 40px"><br>'+
    '</li>';
}

provision_header +=  '<li>'+
      '<a href"#" class="medium off-color provision_vms_list_button" id="" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-th"/><br>'+tr("VMs")+'</a>'+
    '</li>'

if (Config.isTabPanelEnabled("provision-tab", "templates")) {
  provision_header +=
    '<li>'+
      '<a href"#" class="medium off-color provision_templates_list_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-save"/><br>'+tr("Templates")+'</a>'+
    '</li>';
}

if (Config.isTabPanelEnabled("provision-tab", "flows")) {
  provision_header +=
    '<li>'+
      '<a href"#" class="medium off-color provision_flows_list_button" id="" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-2x fa-fw fa-cubes"/><br>'+tr("Services")+'</a>'+
    '</li>';
}

  provision_header +=
    '<li style="border-left: 1px solid #efefef; height: 40px"><br>'+
    '</li>'+
    '<li>'+
      '<a href"#" class="medium off-color" id="provision_user_info_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-user"/><br>'+config['display_name']+'</a>'+
    '</li>'+
    '<li>'+
      '<a href="#" data-dropdown="provision_zone_selector" class="button small radius secondary dropdown off-color" id="zonelector" style="padding:0px; font-size: 12px;">'+
        '<i class="fa fa-home fa-2x header-icon" style="margin-bottom: 2px"/><br> ' + config['zone_name'] +
      '</a>'+
      '<ul id="provision_zone_selector" data-dropdown-content class="zone-ul f-dropdown"></ul>'+
    '</li>'+
  '</ul>'+
  '</span>'

var provision_tab = {
  list_header: "",
  content: provision_content
};

var povision_actions = {
  "Provision.User.show" : {
      type: "single",
      call: OpenNebula.User.show,
      callback: show_provision_user_info_callback,
      error: onError
  },

  "Provision.User.passwd" : {
      type: "single",
      call: OpenNebula.User.passwd,
      callback: function() {
        show_provision_user_info();
        notifyMessage("Password updated successfully");
      },
      error: onError
  },

  "Provision.User.update_template" : {
      type: "single",
      call: OpenNebula.User.update,
      callback: function() {
        show_provision_user_info();
        notifyMessage("SSH key updated successfully");
      },
      error: onError
  },

  "Provision.User.create" : {
      type: "create",
      call: OpenNebula.User.create,
      callback: function(request, response) {
        if ( $("div#provision_create_user_manual_quota",
             $("#provision_create_user")).hasClass("active") ){

          quota_json = retrieve_provision_quota_widget($("#provision_create_user"));

          Sunstone.runAction("Provision.User.set_quota",
                              [response.USER.ID], quota_json);
        } else {
          clear_provision_create_user();
        }
      },
      error: onError
  },

  "Provision.User.set_quota" : {
      type: "multiple",
      call: OpenNebula.User.set_quota,
      callback: function(request) {
        clear_provision_create_user();
      },
      error: onError
  },

  "Provision.Group.show" : {
      type: "single",
      call: OpenNebula.Group.show,
      callback: show_provision_group_info_callback,
      error: onError
  },

  "Provision.Flow.instantiate" : {
    type: "single",
    call: OpenNebula.ServiceTemplate.instantiate,
    callback: function(){
      OpenNebula.Helper.clear_cache("SERVICE");
      show_provision_flow_list(0);
      var context = $("#provision_create_flow");
      $("#flow_name", context).val('');
      //$(".provision_selected_networks").html("");
      $(".provision-pricing-table", context).removeClass("selected");
      //$('a[href="#provision_system_templates_selector"]', context).click();
    },
    error: onError
  },

  "Provision.instantiate" : {
    type: "single",
    call: OpenNebula.Template.instantiate,
    callback: function(){
      OpenNebula.Helper.clear_cache("VM");
      show_provision_vm_list(0);
      var context = $("#provision_create_vm");
      $("#vm_name", context).val('');
      $(".provision_selected_networks").html("");
      $(".provision-pricing-table", context).removeClass("selected");
      $(".alert-box-error", context).hide();
      $('a[href="#provision_system_templates_selector"]', context).click();
    },
    error: onError
  }

}

Sunstone.addMainTab('provision-tab',provision_tab);
Sunstone.addActions(povision_actions);

$(document).foundation();

function generate_custom_attrs(context, custom_attrs) {
  context.off();
  var text_attrs = [];

  $.each(custom_attrs, function(key, value){
    var parts = value.split("|");
    // 0 mandatory; 1 type; 2 desc;
    var attrs = {
      "name": key,
      "mandatory": parts[0],
      "type": parts[1],
      "description": parts[2],
    }

    switch (parts[1]) {
      case "text":
        text_attrs.push(attrs)
        break;
      case "password":
        text_attrs.push(attrs)
        break;
    }
  })

  if (text_attrs.length > 0) {
    context.html(
      '<br>'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<span class="left">'+
              '<i class="fa fa-th fa-gears"></i>&emsp;'+
              tr("Custom Attributes")+
            '</span>'+
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="provision_custom_attributes">'+
      '</div>'+
      '<br>'+
      '<br>'+
      '<br>');


    $.each(text_attrs, function(index, custom_attr){
      $(".provision_custom_attributes", context).append(
        '<br>'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<label style="font-size: 16px">' +
              '<i class="fa fa-asterisk" style="color:#0099c3"/> '+
              custom_attr.description +
              '<input type="'+custom_attr.type+'" attr_name="'+custom_attr.name+'" class="provision_custom_attribute provision-input" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
            '</label>'+
          '</div>'+
        '</div>');
    })
  } else {
    context.html("");
  }
}

function generate_cardinality_selector(context, role_template, template_json) {
  context.off();
  var min_vms = (role_template.min_vms||1);
  var max_vms = (role_template.max_vms||20);

  context.html(
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<h3 class="subheader text-right">'+
          '<span class="left">'+
            '<i class="fa fa-th fa-lg"></i>&emsp;'+
            tr("Cardinality")+
          '</span>'+
        '</h3>'+
        '<br>'+
      '</div>'+
    '</div>'+
    '<br>'+
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 columns">'+
        '<div class="row">'+
          '<div class="large-2 text-center columns">'+
            '<span class="cardinality_value" style="color: #777; font-size:40px">'+role_template.cardinality+'</span>'+
            '<br>'+
            '<span style="color: #999;">'+tr("VMs")+'</span>'+
          '</div>'+
          '<div class="large-6 columns">'+
            '<div class="cardinality_slider_div">'+
              '<span class="" style="color: #777;">'+tr("Change cardinality")+'</span>'+
              '<br>'+
              '<div class="range-slider radius cardinality_slider" data-slider data-options="start: 1; end: 50;">'+
                '<span class="range-slider-handle"></span>'+
                '<span class="range-slider-active-segment"></span>'+
                '<input type="hidden">'+
              '</div>'+
              '<span class="left" style="color: #999;">'+min_vms+'</span>'+
              '<span class="right" style="color: #999;">'+max_vms+'</span>'+
            '</div>'+
            '<div class="cardinality_no_slider_div">'+
              '<br>'+
              '<br>'+
              '<span class="" style="color: #999;">'+tr("The cardinality for this role cannot be changed")+'</span>'+
            '</div>'+
          '</div>'+
          '<div class="large-4 columns text-center provision_create_service_cost_div hidden">'+
            '<span class="cost_value" style="color: #777; font-size:40px"></span>'+
            '<br>'+
            '<span style="color: #999;">'+tr("COST")+' / ' + tr("HOUR") + '</span>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>');

    var capacity = template_json.VMTEMPLATE.TEMPLATE;
    var cost = 0;
    if (capacity.CPU_COST || capacity.MEMORY_COST && Config.isFeatureEnabled("showback")) {
      $(".provision_create_service_cost_div").show();

      if (capacity.CPU && capacity.CPU_COST) {
        cost += capacity.CPU * capacity.CPU_COST
        $(".cost_value").data("CPU_COST", capacity.CPU_COST);
      }

      if (capacity.MEMORY && capacity.MEMORY_COST) {
        cost += capacity.MEMORY * capacity.MEMORY_COST
        $(".cost_value").data("MEMORY_COST", capacity.MEMORY_COST);
      }

      $(".provision_create_service_cost_div", context).data("cost", cost)
      var cost_value = cost*parseInt(role_template.cardinality);
      $(".cost_value").html(cost_value.toFixed(2));
    } else {
      $(".provision_create_service_cost_div").hide();
    }

    if (max_vms > min_vms) {
      $( ".cardinality_slider", context).attr('data-options', 'start: '+min_vms+'; end: '+max_vms+';')
      context.foundation();
      $( ".cardinality_slider_div", context).show();
      $( ".cardinality_no_slider_div", context).hide();

      $( ".cardinality_slider", context).foundation('slider', 'set_value', role_template.cardinality);

      $( ".cardinality_slider", context).on('change', function(){
        $(".cardinality_value",context).html($(this).attr('data-slider'))
        var cost_value = $(".provision_create_service_cost_div", context).data("cost")*$(this).attr('data-slider');
        $(".cost_value").html(cost_value.toFixed(2));
      });
    } else {
      $( ".cardinality_slider_div", context).hide();
      $( ".cardinality_no_slider_div", context).show();
    }
}

var provision_instance_type_accordion_id = 0;

function generate_provision_instance_type_accordion(context, capacity) {
  context.off();
  var memory_value;
  var memory_unit;

  if (capacity.MEMORY > 1000){
    memory_value = Math.floor(capacity.MEMORY/1024);
    memory_unit = "GB";
  } else {
    memory_value = (capacity.MEMORY ? capacity.MEMORY : '-');
    memory_unit = "MB";
  }

  context.html(
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<h3 class="subheader text-right">'+
          '<span class="left">'+
            '<i class="fa fa-laptop fa-lg"></i>&emsp;'+
            tr("Capacity")+
          '</span>'+
        '</h3>'+
        '<br>'+
      '</div>'+
    '</div>'+
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<div class="row text-center">'+
          '<div class="large-4 columns">'+
            '<span class="cpu_value" style="color: #777; font-size:60px">'+(capacity.CPU ? capacity.CPU : '-')+'</span>'+
            '<br>'+
            '<span style="color: #999;">'+tr("CPU")+'</span>'+
          '</div>'+
          '<div class="large-4 columns">'+
            '<span class="memory_value" style="color: #777; font-size:60px">'+memory_value+'</span>'+
            ' '+
            '<span class="memory_unit" style="color: #777; font-size:30px">'+memory_unit+'</span>'+
            '<br>'+
            '<span style="color: #999;">'+tr("MEMORY")+'</span>'+
          '</div>'+
          '<div class="large-4 columns provision_create_template_cost_div hidden">'+
            '<span class="cost_value" style="color: #777; font-size:60px"></span>'+
            '<br>'+
            '<span style="color: #999;">'+tr("COST")+' / ' + tr("HOUR") + '</span>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>'+
    (Config.provision.create_vm.isEnabled("capacity_select") && (capacity.SUNSTONE_CAPACITY_SELECT != "NO") ?
    '<br>'+
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<dl class="accordion" data-accordion="provision_accordion_'+provision_instance_type_accordion_id+'">'+
          '<dd>'+
            '<a href="#provision_instance_type_dd_'+provision_instance_type_accordion_id+'" class="button large-12 medium radius" style="color: #555;">'+
              tr("Change Capacity")+
            '</a>'+
            '<div id="provision_instance_type_dd_'+provision_instance_type_accordion_id+'" class="content">'+
              '<div class="row">'+
                '<div class="large-12 large-centered columns">'+
                  '<h3 class="subheader text-right">'+
                    '<input type="search" class="provision-search-input right" placeholder="Search"/>'+
                  '</h3>'+
                  '<br>'+
                '</div>'+
              '</div>'+
              '<div class="row">'+
                '<div class="large-12 large-centered columns">'+
                  '<table class="provision_instance_types_table">'+
                    '<thead class="hidden">'+
                      '<tr>'+
                        '<th>'+tr("Name")+'</th>'+
                      '</tr>'+
                    '</thead>'+
                    '<tbody class="hidden">'+
                    '</tbody>'+
                  '</table>'+
                  '<br>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</dd>'+
        '</dl>'+
      '</div>'+
    '</div>' : '' ) +
    '<br>');

  var cost = 0;
  if (capacity.CPU_COST || capacity.MEMORY_COST && Config.isFeatureEnabled("showback")) {
    $(".provision_create_template_cost_div").show();

    if (capacity.CPU && capacity.CPU_COST) {
      cost += capacity.CPU * capacity.CPU_COST
      $(".cost_value").data("CPU_COST", capacity.CPU_COST);
    }

    if (capacity.MEMORY && capacity.MEMORY_COST) {
      cost += capacity.MEMORY * capacity.MEMORY_COST
      $(".cost_value").data("MEMORY_COST", capacity.MEMORY_COST);
    }

    $(".cost_value").html(cost);
  } else {
    $(".provision_create_template_cost_div").hide();
  }

  if (Config.provision.create_vm.isEnabled("capacity_select") && (capacity.SUNSTONE_CAPACITY_SELECT != "NO")) {
    provision_instance_type_accordion_id += 1;

    var provision_instance_types_datatable = $('.provision_instance_types_table', context).dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "bSort" : false,
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "name" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$('tr', {"filter": "applied"} ).length == 0) {
          this.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              tr("There are no instance_types available. Please contact your cloud administrator")+
            '</span>'+
            '</div>');
        } else {
          $(".provision_instance_types_table", context).html(
            '<ul class="provision_instance_types_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center">'+
            '</ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData;

        var li = $('<li>'+
            '<ul class="provision-pricing-table hoverable only-one" cpu="'+data.cpu+'" memory="'+data.memory+'">'+
              '<li class="provision-title" title="'+data.name+'">'+
                data.name+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<span style="font-size: 40px">'+
                '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                '<span style="vertical-align: middle; font-size:14px">'+
                  'x'+data.cpu+' - '+
                  ((data.memory > 1000) ?
                    (Math.floor(data.memory/1024)+'GB') :
                    (data.memory+'MB'))+
                '</span>'+
                '</span>'+
              '</li>'+
              '<li class="provision-description">'+
                (data.description || '')+
              '</li>'+
            '</ul>'+
          '</li>').appendTo($(".provision_instance_types_ul", context));

        $(".provision-pricing-table", li).data("opennebula", data)

        return nRow;
      }
    });


    $('.provision-search-input', context).on('keyup',function(){
      provision_instance_types_datatable.fnFilter( $(this).val() );
    })

    $('.provision-search-input', context).on('change',function(){
      provision_instance_types_datatable.fnFilter( $(this).val() );
    })

    context.on("click", ".provision-pricing-table.only-one" , function(){
      $(".cpu_value", context).html($(this).attr("cpu"));

      var memory_value;
      var memory_unit;

      if ($(this).attr("memory") > 1000){
        memory_value = Math.floor($(this).attr("memory")/1024);
        memory_unit = "GB";
      } else {
        memory_value = $(this).attr("memory");
        memory_unit = "MB";
      }

      $(".memory_value", context).html(memory_value);
      $(".memory_unit", context).html(memory_unit);

      if (Config.isFeatureEnabled("showback")) {
        var cost = 0;

        if ($(".cost_value").data("CPU_COST")) {
          cost += $(this).attr("cpu") * $(".cost_value").data("CPU_COST")
        }

        if ($(".cost_value").data("MEMORY_COST")) {
          cost += $(this).attr("memory") * $(".cost_value").data("MEMORY_COST")
        }

        $(".cost_value").html(cost);
      }

      $('.accordion a', context).first().trigger("click");
    })

    $(document).foundation();

    update_provision_instance_types_datatable(provision_instance_types_datatable);
  }
}

var provision_nic_accordion_id = 0;
var provision_nic_accordion_dd_id = 0;

function generate_provision_network_table(context, nic, vnet_attr){
  context.off();
  var nic_span;

  if (nic) {
    nic_span = '<span class="selected_network" template_nic=\''+JSON.stringify(nic)+'\'>'+
        '<span style="color: #999; font-size: 14px">' + tr("INTERFACE") + "</span>&emsp;&emsp;" +
        '<span style="color: #777;">' + (nic.NETWORK||nic.NETWORK_ID) + "</span>" +
      '</span>'+
      '<span class="has-tip right provision_remove_nic" style="cursor: pointer;">'+
        '<i class="fa fa-times"/>'+
      '</span>'+
      '<span class="has-tip right" style="cursor: pointer; margin-right:10px">'+
        '<i class="fa fa-pencil"/>'+
      '</span>';
  } else if (vnet_attr) {
    nic_span = '<span style="color: #777; font-size: 16px">' + vnet_attr.description + "</span><br>"+
      '<span class="selected_network only-not-active" attr_name=\''+vnet_attr.name+'\' style="color: #777;">'+
        '<span style="color: #999; font-size: 14px">' + tr("INTERFACE") + "</span>&emsp;&emsp;" +
        '<span class="button radius small">' + tr("Select a Network") + "</span>" +
      '</span>'+
      '<span class="only-active" style="color:#555">'+
        tr("Select a Network for this interface")+
      '</span>'+
      '<span class="has-tip right only-not-active" style="cursor: pointer; margin-right:10px">'+
        '<i class="fa fa-pencil"/>'+
      '</span>';
  } else {
    nic_span =
      '<span class="selected_network only-not-active" style="color: #777;">'+
        '<span style="color: #999; font-size: 14px">' + tr("INTERFACE") + "</span>&emsp;&emsp;" +
        '<span class="button radius small">' + tr("Select a Network") + "</span>" +
      '</span>'+
      '<span class="only-active" style="color:#555">'+
        tr("Select a Network for this interface")+
      '</span>'+
      '<span class="has-tip right provision_remove_nic" style="cursor: pointer;">'+
        '<i class="fa fa-times"/>'+
      '</span>'+
      '<span class="has-tip right only-not-active" style="cursor: pointer; margin-right:10px">'+
        '<i class="fa fa-pencil"/>'+
      '</span>';
  }

  var dd_context = $('<dd style="border-bottom: 1px solid #efefef;">'+
    '<a href="#provision_accordion_dd_'+provision_nic_accordion_dd_id+'" style="background: #fff; font-size: 24px">'+
      nic_span +
    '</a>'+
    '<div id="provision_accordion_dd_'+provision_nic_accordion_dd_id+'" class="content">'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<h3 class="subheader text-right">'+
            '<input type="search" class="provision-search-input right" placeholder="Search"/>'+
          '</h3>'+
          '<br>'+
        '</div>'+
      '</div>'+
      '<div class="row">'+
        '<div class="large-12 large-centered columns">'+
          '<table class="provision_networks_table">'+
            '<thead class="hidden">'+
              '<tr>'+
                '<th>'+tr("ID")+'</th>'+
                '<th>'+tr("Name")+'</th>'+
              '</tr>'+
            '</thead>'+
            '<tbody class="hidden">'+
            '</tbody>'+
          '</table>'+
          '<br>'+
        '</div>'+
      '</div>'+
      '</div>'+
    '</dd>').appendTo(context);

  provision_nic_accordion_dd_id += 1;

  var provision_networks_datatable = $('.provision_networks_table', dd_context).dataTable({
    "iDisplayLength": 6,
    "sDom" : '<"H">t<"F"lp>',
    "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
    "aoColumnDefs": [
        { "bVisible": false, "aTargets": ["all"]}
    ],
    "aoColumns": [
        { "mDataProp": "VNET.ID" },
        { "mDataProp": "VNET.NAME" }
    ],
    "fnPreDrawCallback": function (oSettings) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (this.$('tr', {"filter": "applied"} ).length == 0) {
        this.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("There are no networks available. Please contact your cloud administrator")+
          '</span>'+
          '</div>');
      } else {
        $(".provision_networks_table", dd_context).html(
          '<ul class="provision_networks_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center">'+
          '</ul>');
      }

      return true;
    },
    "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
      var data = aData.VNET;
      $(".provision_networks_ul", dd_context).append(
        '<li>'+
          '<ul class="provision-pricing-table hoverable more-than-one" opennebula_id="'+data.ID+'" opennebula_name="'+data.NAME+'">'+
            '<li class="provision-title" title="'+data.NAME+'">'+
              data.NAME+
            '</li>'+
            '<li class="provision-bullet-item">'+
              '<i class="fa fa-fw fa-globe" style="font-size:40px;"/>'+
            '</li>'+
            '<li class="provision-description">'+
              (data.TEMPLATE.DESCRIPTION || '...')+
            '</li>'+
          '</ul>'+
        '</li>');

      return nRow;
    }
  });


  $('.provision-search-input', dd_context).on('keyup',function(){
    provision_networks_datatable.fnFilter( $(this).val() );
  })

  $('.provision-search-input', dd_context).on('change',function(){
    provision_networks_datatable.fnFilter( $(this).val() );
  })

  dd_context.on("click", ".provision-pricing-table.more-than-one" , function(){
    $(".selected_network", dd_context).html(
        '<span style="color: #999; font-size: 14px">' + tr("INTERFACE") + "</span>&emsp;&emsp;" +
        '<span style="color: #777;">' + $(this).attr("opennebula_name") + "</span>");

    $(".selected_network", dd_context).attr("opennebula_id", $(this).attr("opennebula_id"))
    $(".selected_network", dd_context).removeAttr("template_nic")

    $('a', dd_context).first().trigger("click");
  })

  dd_context.on("click", ".provision_remove_nic" , function(){
    dd_context.remove();
    return false;
  });

  if (!nic && !vnet_attr) {
    $('a', dd_context).trigger("click");
  }

  update_provision_networks_datatable(provision_networks_datatable);
}

function generate_provision_network_accordion(context, hide_add_button){
  context.off();
  context.html(
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 columns">'+
        '<h3 class="subheader text-right">'+
          '<span class="left">'+
            '<i class="fa fa-globe fa-lg"></i>&emsp;'+
            tr("Network")+
          '</span>'+
        '</h3>'+
        '<br>'+
      '</div>'+
    '</div>'+
    '<br>'+
    '<div class="row">'+
      '<div class="large-12 large-centered columns">'+
        '<dl class="accordion provision_nic_accordion" data-accordion="provision_accordion_'+provision_nic_accordion_id+'">'+
        '</dl>'+
        '<br>'+
        '<a class="button large-12 medium radius secondary provision_add_network_interface" style="padding: 1rem; color: #555; ' + (hide_add_button ? 'display:none;' : '') + '">'+
          tr("Add another Network Interface")+
        '</a>'+
      '</div>'+
    '</div>'+
    '<br>')

  provision_nic_accordion_id += 1;

  $(".provision_add_network_interface", context).on("click", function(){
    generate_provision_network_table($(".accordion", context));
  })

  $(document).foundation();
}

function show_provision_dashboard() {
  $(".section_content").hide();
  $("#provision_dashboard").fadeIn();

  $("#provision_dashboard").html("");

  if (Config.provision.dashboard.isEnabled("quotas")) {
    $("#provision_dashboard").append(provision_quotas_dashboard);


    OpenNebula.User.show({
      data : {
          id: "-1"
      },
      success: function(request,user_json){
        var user = user_json.USER;

        initEmptyQuotas(user);

        if (!$.isEmptyObject(user.VM_QUOTA)){
            var default_user_quotas = Quotas.default_quotas(user.DEFAULT_USER_QUOTAS);

            var vms = quotaBar(
                user.VM_QUOTA.VM.VMS_USED,
                user.VM_QUOTA.VM.VMS,
                default_user_quotas.VM_QUOTA.VM.VMS,
                true);

            $("#provision_dashboard_rvms_percentage").html(vms["percentage"]);
            $("#provision_dashboard_rvms_str").html(vms["str"]);
            $("#provision_dashboard_rvms_meter").css("width", vms["percentage"]+"%");

            var memory = quotaBarMB(
                user.VM_QUOTA.VM.MEMORY_USED,
                user.VM_QUOTA.VM.MEMORY,
                default_user_quotas.VM_QUOTA.VM.MEMORY,
                true);

            $("#provision_dashboard_memory_percentage").html(memory["percentage"]);
            $("#provision_dashboard_memory_str").html(memory["str"]);
            $("#provision_dashboard_memory_meter").css("width", memory["percentage"]+"%");

            var cpu = quotaBarFloat(
                user.VM_QUOTA.VM.CPU_USED,
                user.VM_QUOTA.VM.CPU,
                default_user_quotas.VM_QUOTA.VM.CPU,
                true);

            $("#provision_dashboard_cpu_percentage").html(cpu["percentage"]);
            $("#provision_dashboard_cpu_str").html(cpu["str"]);
            $("#provision_dashboard_cpu_meter").css("width", cpu["percentage"]+"%");
        }
      }
    })
  }

  if (Config.provision.dashboard.isEnabled("vdcquotas")) {
    $("#provision_dashboard").append(provision_vdc_quotas_dashboard);


    OpenNebula.Group.show({
      data : {
          id: "-1"
      },
      success: function(request,group_json){
        var group = group_json.GROUP;

        initEmptyQuotas(group);

        if (!$.isEmptyObject(group.VM_QUOTA)){
            var default_group_quotas = Quotas.default_quotas(group.DEFAULT_GROUP_QUOTAS);

            var vms = quotaBar(
                group.VM_QUOTA.VM.VMS_USED,
                group.VM_QUOTA.VM.VMS,
                default_group_quotas.VM_QUOTA.VM.VMS,
                true);

            $("#provision_dashboard_vdc_rvms_percentage").html(vms["percentage"]);
            $("#provision_dashboard_vdc_rvms_str").html(vms["str"]);
            $("#provision_dashboard_vdc_rvms_meter").css("width", vms["percentage"]+"%");

            var memory = quotaBarMB(
                group.VM_QUOTA.VM.MEMORY_USED,
                group.VM_QUOTA.VM.MEMORY,
                default_group_quotas.VM_QUOTA.VM.MEMORY,
                true);

            $("#provision_dashboard_vdc_memory_percentage").html(memory["percentage"]);
            $("#provision_dashboard_vdc_memory_str").html(memory["str"]);
            $("#provision_dashboard_vdc_memory_meter").css("width", memory["percentage"]+"%");

            var cpu = quotaBarFloat(
                group.VM_QUOTA.VM.CPU_USED,
                group.VM_QUOTA.VM.CPU,
                default_group_quotas.VM_QUOTA.VM.CPU,
                true);

            $("#provision_dashboard_vdc_cpu_percentage").html(cpu["percentage"]);
            $("#provision_dashboard_vdc_cpu_str").html(cpu["str"]);
            $("#provision_dashboard_vdc_cpu_meter").css("width", cpu["percentage"]+"%");
        }
      }
    })
  }

  if (Config.provision.dashboard.isEnabled("vms")) {
    $("#provision_dashboard").append(provision_vms_dashboard);

    var start_time =  Math.floor(new Date().getTime() / 1000);
    // ms to s

    // 604800 = 7 days = 7*24*60*60
    start_time = start_time - 604800;

    // today
    var end_time = -1;

    var options = {
      "start_time": start_time,
      "end_time": end_time,
      "userfilter": config["user_id"]
    }

    var no_table = true;

    OpenNebula.VM.accounting({
        success: function(req, response){
            fillAccounting($("#dashboard_vm_accounting"), req, response, no_table);
        },
        error: onError,
        data: options
    });

    OpenNebula.VM.list({
      timeout: true,
      success: function (request, item_list){
        var total = 0;
        var running = 0;
        var off = 0;
        var error = 0;
        var deploying = 0;

        $.each(item_list, function(index, vm){
          if (vm.VM.UID == config["user_id"]) {
            var state = get_provision_vm_state(vm.VM);

            total = total + 1;

            switch (state.color) {
              case "deploying":
                deploying = deploying + 1;
                break;
              case "error":
                error = error + 1;
                break;
              case "running":
                running = running + 1;
                break;
              case "powering_off":
                off = off + 1;
                break;
              case "off":
                off = off + 1;
                break;
            }
          }
        })

        var context = $("#provision_vms_dashboard");
        $("#provision_dashboard_total", context).html(total);
        $("#provision_dashboard_running", context).html(running);
        $("#provision_dashboard_off", context).html(off);
        $("#provision_dashboard_error", context).html(error);
        $("#provision_dashboard_deploying", context).html(deploying);
      },
      error: onError
    });
  }

  if (Config.provision.dashboard.isEnabled("vdcvms")) {
    $("#provision_dashboard").append(provision_vdc_vms_dashboard);

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
            fillAccounting($("#dashboard_vdc_vm_accounting"), req, response, no_table);
        },
        error: onError,
        data: options
    });


    OpenNebula.VM.list({
      timeout: true,
      success: function (request, item_list){
        var total = 0;
        var running = 0;
        var off = 0;
        var error = 0;
        var deploying = 0;

        $.each(item_list, function(index, vm){
            var state = get_provision_vm_state(vm.VM);

            total = total + 1;

            switch (state.color) {
              case "deploying":
                deploying = deploying + 1;
                break;
              case "error":
                error = error + 1;
                break;
              case "running":
                running = running + 1;
                break;
              case "powering_off":
                off = off + 1;
                break;
              case "off":
                off = off + 1;
                break;
              default:
                break;
            }
        })

        var context = $("#provision_vdc_vms_dashboard");
        $("#provision_dashboard_vdc_total", context).html(total);
        $("#provision_dashboard_vdc_running", context).html(running);
        $("#provision_dashboard_vdc_off", context).html(off);
        $("#provision_dashboard_vdc_error", context).html(error);
        $("#provision_dashboard_vdc_deploying", context).html(deploying);
      },
      error: onError
    });
  }

  if (Config.provision.dashboard.isEnabled("users")) {
    $("#provision_dashboard").append(provision_users_dashboard);

    var start_time =  Math.floor(new Date().getTime() / 1000);
    // ms to s

    // 604800 = 7 days = 7*24*60*60
    start_time = start_time - 604800;

    // today
    var end_time = -1;

    var options = {
      "start_time": start_time,
      "end_time": end_time,
      "group": config["user_gid"]
    }

    var no_table = true;

    OpenNebula.VM.accounting({
        success: function(req, response){
            fillAccounting($("#dashboard_vdc_user_accounting"), req, response, no_table);
        },
        error: onError,
        data: options
    });

    OpenNebula.User.list({
      timeout: true,
      success: function (request, item_list){
        var total = item_list.length || 0;

        var context = $("#provision_users_dashboard");
        $("#provision_dashboard_users_total", context).html(total);
      },
      error: onError
    });
  }

}


function show_provision_user_info() {
  Sunstone.runAction("Provision.User.show", "-1");
  $(".section_content").hide();
  $("#provision_user_info").fadeIn();
  $("dd.active a", $("#provision_user_info")).trigger("click");
}


function show_provision_user_info_callback(request, response) {
  var info = response.USER;

  var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS);

  var quotas_tab_html = initQuotasPanel(info, default_user_quotas,
                                      "#provision_user_info_quotas_div", false);

  $("#provision_user_info_quotas_div").html(quotas_tab_html);

  setupQuotasPanel(info,
      "#provision_user_info_quotas_div",
      false,
      "User");

  var ssh_key = info.TEMPLATE.SSH_PUBLIC_KEY;
  if (ssh_key && ssh_key.length) {
    $("#provision_ssh_key").val(ssh_key);
    $(".provision_add_ssh_key_button").hide();
    $(".provision_update_ssh_key_button").show();
  } else {
    $(".provision_add_ssh_key_button").show();
    $(".provision_update_ssh_key_button").hide();
  }

  $('#provision_new_language option[value="'+config['user_config']["lang"]+'"]').attr('selected','selected');
  $('#provision_user_views_select option[value="'+config['user_config']["default_view"]+'"]').attr('selected','selected');

  accountingGraphs(
    $("#provision_user_info_acct_div"),
      { fixed_user: info.ID,
        fixed_group_by: "vm" });


  if (Config.isFeatureEnabled("showback")) {
    showbackGraphs(
      $("#provision_user_info_showback_div"),
        { fixed_user: info.ID});
  }
}


function show_provision_group_info_callback(request, response) {
  var info = response.GROUP;

  var context = $("#provision_manage_vdc");

  var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);

  var quotas_tab_html = initQuotasPanel(info, default_group_quotas,
                                      "#provision_vdc_quotas_div", false);

  $("#provision_vdc_quotas_div").html(quotas_tab_html);

  setupQuotasPanel(info,
      "#provision_vdc_quotas_div",
      false,
      "Group");

  accountingGraphs(
    $("#provision_info_vdc_group_acct", context),
    {   fixed_group: info.ID,
        init_group_by: "user" });

  if (Config.isFeatureEnabled("showback")) {
    showbackGraphs(
      $("#provision_info_vdc_group_showback", context),
      {   fixed_group: info.ID });
  }

  $("#acct_placeholder", context).hide();
}

function show_provision_create_vm() {
  OpenNebula.Helper.clear_cache("VMTEMPLATE");
  update_provision_templates_datatable(provision_system_templates_datatable);
  provision_system_templates_datatable.fnFilter("^-$", 2, true, false)

  update_provision_templates_datatable(provision_vdc_templates_datatable);
  provision_vdc_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
  provision_vdc_templates_datatable.fnFilter("^1$", 3, true, false);

  if (Config.isTabPanelEnabled("provision-tab", "templates")) {
    update_provision_templates_datatable(provision_saved_templates_datatable);
    provision_saved_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
    provision_saved_templates_datatable.fnFilter("^0$", 3, true, false);
  }

  $(".provision_accordion_template .selected_template").hide();
  $(".provision_accordion_template .select_template").show();

  $("#provision_create_vm .provision_capacity_selector").html("");
  $("#provision_create_vm .provision_network_selector").html("");
  $("#provision_create_vm .provision_custom_attributes_selector").html("")

  $("#provision_create_vm dd:not(.active) a[href='#provision_dd_template']").trigger("click")

  $(".section_content").hide();
  $("#provision_create_vm").fadeIn();
}

function show_provision_create_flow() {
  update_provision_flow_templates_datatable(provision_flow_templates_datatable);

  var context = $("#provision_create_flow");

  $("#provision_customize_flow_template", context).hide();
  $("#provision_customize_flow_template", context).html("");

  $(".provision_network_selector", context).html("")
  $(".provision_custom_attributes_selector", context).html("")

  $(".provision_accordion_flow_template .selected_template", context).hide();
  $(".provision_accordion_flow_template .select_template", context).show();

  $("dd:not(.active) a[href='#provision_dd_flow_template']", context).trigger("click")

  $(".alert-box-error", context).hide();

  $(".section_content").hide();
  $("#provision_create_flow").fadeIn();
}

function show_provision_create_user() {
  $(".section_content").hide();
  $("#provision_create_user").fadeIn();
  $(document).foundation();
}

function show_provision_vm_list(timeout, context) {
  $(".section_content").hide();
  $(".provision_vms_list_section").fadeIn();

  $("dd:not(.active) .provision_back", $(".provision_vms_list_section")).trigger("click");
  $(".provision_vms_list_refresh_button", $(".provision_vms_list_section")).trigger("click");
}

function show_provision_flow_list(timeout) {
  $(".section_content").hide();
  $(".provision_flows_list_section").fadeIn();

  $("dd:not(.active) .provision_back", $(".provision_flows_list_section")).trigger("click");
  $(".provision_flows_list_refresh_button", $(".provision_flows_list_section")).trigger("click");
}

function show_provision_user_list(timeout) {
  $(".section_content").hide();
  $(".provision_users_list_section").fadeIn();

  $("dd:not(.active) .provision_back", $(".provision_users_list_section")).trigger("click");
  $(".provision_users_list_refresh_button", $(".provision_users_list_section")).trigger("click");
}

function show_provision_vdc_info() {
  $(".section_content").hide();
  $("#provision_manage_vdc").fadeIn();

  Sunstone.runAction('Provision.Group.show', "-1");
}

function show_provision_template_list(timeout) {
  $(".section_content").hide();
  $(".provision_templates_list_section").fadeIn();

  //$("dd:not(.active) .provision_back", $(".provision_templates_list_section")).trigger("click");
  $(".provision_templates_list_refresh_button", $(".provision_templates_list_section")).trigger("click");
}

function update_provision_templates_datatable(datatable, timeout) {
  datatable.html('<div class="text-center">'+
    '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'+
    '<br>'+
    '<br>'+
    '<span style="font-size: 18px; color: #999">'+
    '</span>'+
    '</div>');

  setTimeout( function(){
    OpenNebula.Template.list({
      timeout: true,
      success: function (request, item_list){
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              tr("There are no templates available")+
            '</span>'+
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: onError
    });
  }, timeout);
}

function update_provision_instance_types_datatable(datatable) {
    datatable.fnClearTable(true);
    if (!config['instance_types'] || config['instance_types'].length == 0) {
      datatable.html('<div class="text-center">'+
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
        '</span>'+
        '<br>'+
        '<br>'+
        '<span style="font-size: 18px; color: #999">'+
          tr("There are no instance types available")+
        '</span>'+
        '</div>');
    } else {
      datatable.fnAddData(config['instance_types']);
    }
}

function update_provision_networks_datatable(datatable) {
  datatable.html('<div class="text-center">'+
    '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'+
    '<br>'+
    '<br>'+
    '<span style="font-size: 18px; color: #999">'+
    '</span>'+
    '</div>');

  OpenNebula.Network.list({
    timeout: true,
    success: function (request, item_list){
      datatable.fnClearTable(true);
      if (item_list.length == 0) {
        datatable.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("There are no networks available.")+
          '</span>'+
          '</div>');
      } else {
        datatable.fnAddData(item_list);
      }
    },
    error: onError
  });
}


function update_provision_flow_templates_datatable(datatable, timeout) {
  datatable.html('<div class="text-center">'+
    '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'+
    '<br>'+
    '<br>'+
    '<span style="font-size: 18px; color: #999">'+
    '</span>'+
    '</div>');

  setTimeout( function(){
    OpenNebula.ServiceTemplate.list({
      timeout: true,
      success: function (request, item_list){
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              tr("There are no templates available")+
            '</span>'+
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: onError
    });
  }, timeout);
}


function update_provision_users_datatable(datatable, timeout) {
  datatable.html('<div class="text-center">'+
    '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'+
    '<br>'+
    '<br>'+
    '<span style="font-size: 18px; color: #999">'+
    '</span>'+
    '</div>');

  setTimeout( function(){
    OpenNebula.User.list({
      timeout: true,
      success: function (request, item_list, quotas_list){
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              tr("The list of users is empty")+
            '</span>'+
            '</div>');
        } else {
          provision_quotas_list = quotas_list;
          datatable.fnAddData(item_list);
        }
      },
      error: onError
    })
  }, timeout );
}

function fill_provision_vms_datatable(datatable, item_list){
  datatable.fnClearTable(true);
  if (item_list.length == 0) {
    datatable.html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
        tr("There are no Virtual Machines")+
      '</span>'+
      '<br>'+
      '<br>'+
      '</div>');
  } else {
    datatable.fnAddData(item_list);
  }
}

function update_provision_vms_datatable(datatable, timeout) {
  datatable.html('<div class="text-center">'+
    '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'+
    '<br>'+
    '<br>'+
    '<span style="font-size: 18px; color: #999">'+
    '</span>'+
    '</div>');

    var data = datatable.data('opennebula');
    if (data) {
      fill_provision_vms_datatable(datatable, data)
    } else {
      setTimeout( function(){
        OpenNebula.VM.list({
          timeout: true,
          success: function (request, item_list){
            fill_provision_vms_datatable(datatable, item_list)
          },
          error: onError
        })
      }, timeout );
    }
}

function update_provision_flows_datatable(datatable, timeout) {
  datatable.html('<div class="text-center">'+
    '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
      '<i class="fa fa-cloud fa-stack-2x"></i>'+
      '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
    '</span>'+
    '<br>'+
    '<br>'+
    '<span style="font-size: 18px; color: #999">'+
    '</span>'+
    '</div>');

  setTimeout( function(){
    OpenNebula.Service.list({
      timeout: true,
      success: function (request, item_list){
        $(".flow_error_message").hide();
        datatable.fnClearTable(true);
        if (item_list.length == 0) {
          datatable.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              tr("There are no Services")+
            '</span>'+
            '<br>'+
            '<br>'+
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: function(request, error_json) {
        datatable.html('<div class="text-center">'+
          '<br>'+
          '<br>'+
          '<div class="row flow_error_message" id="" hidden>'+
            '<div class="small-6 columns small-centered text-center">'+
                '<div class="alert-box alert radius">'+tr("Cannot connect to OneFlow server")+'</div>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
          '</span>'+
          '</div>');

          onError(request, error_json, $(".flow_error_message"));
      }
    })
  }, timeout );
}


function get_provision_flow_start_time(data) {
  if (data.log) {
    return data.log[0].timestamp
  } else {
    return null;
  }
}

// @params
//    data: and BODY object of the Document representing the Service
//      Example: data.ID
// @returns and object containing the following properties
//    color: css class for this state.
//      color + '-color' font color class
//      color + '-bg' background class
//    str: user friendly state string
function get_provision_flow_state(data) {
  var state = OpenNebula.Service.state(data.state);
  var state_color;
  var state_str;

  switch (state) {
    case tr("PENDING"):
      state_color = 'deploying';
      state_str = tr("PENDING");
      break;
    case tr("DEPLOYING"):
      state_color = 'deploying';
      state_str = tr("DEPLOYING");
      break;
    case tr("UNDEPLOYING"):
      state_color = 'powering_off';
      state_str = tr("UNDEPLOYING");
      break;
    case tr("FAILED_UNDEPLOYING"):
      state_color = 'error';
      state_str = tr("FAILED UNDEPLOYING");
      break;
    case tr("FAILED_DEPLOYING"):
      state_color = 'error';
      state_str = tr("FAILED DEPLOYING");
      break;
    case tr("FAILED_SCALING"):
      state_color = 'error';
      state_str = tr("FAILED SCALING");
      break;
    case tr("WARNING"):
      state_color = 'error';
      state_str = tr("WARNING");
      break;
    case tr("RUNNING"):
      state_color = 'running';
      state_str = tr("RUNNING");
      break;
    case tr("SCALING"):
      state_color = 'deploying';
      state_str = tr("SCALING");
      break;
    case tr("COOLDOWN"):
      state_color = 'error';
      state_str = tr("COOLDOWN");
      break;
    case tr("DONE"):
      state_color = 'off';
      state_str = tr("DONE");
      break;
    default:
      state_color = 'powering_off';
      state_str = tr("UNKNOWN");
      break;
  }

  return {
    color: state_color,
    str: state_str
  }
}

// @params
//    data: and VM object
//      Example: data.ID
// @returns and object containing the following properties
//    color: css class for this state.
//      color + '-color' font color class
//      color + '-bg' background class
//    str: user friendly state string
function get_provision_vm_state(data) {
  var state = OpenNebula.Helper.resource_state("vm",data.STATE);
  var state_color;
  var state_str;

  switch (state) {
    case tr("INIT"):
    case tr("PENDING"):
    case tr("HOLD"):
      state_color = 'deploying';
      state_str = tr("DEPLOYING") + " (1/3)";
      break;
    case tr("FAILED"):
      state_color = 'error';
      state_str = tr("ERROR");
      break;
    case tr("ACTIVE"):
      var lcm_state = OpenNebula.Helper.resource_state("vm_lcm",data.LCM_STATE);

      switch (lcm_state) {
        case tr("LCM_INIT"):
          state_color = 'deploying';
          state_str = tr("DEPLOYING") + " (1/3)";
          break;
        case tr("PROLOG"):
          state_color = 'deploying';
          state_str = tr("DEPLOYING") + " (2/3)";
          break;
        case tr("BOOT"):
          state_color = 'deploying';
          state_str = tr("DEPLOYING") + " (3/3)";
          break;
        case tr("RUNNING"):
        case tr("SNAPSHOT"):
        case tr("MIGRATE"):
          state_color = 'running';
          state_str = tr("RUNNING");
          break;
        case tr("HOTPLUG"):
          state_color = 'deploying';
          state_str = tr("SAVING IMAGE");
          break;
        case tr("FAILURE"):
          state_color = 'error';
          state_str = tr("ERROR");
          break;
        case tr("SAVE"):
        case tr("EPILOG"):
        case tr("SHUTDOWN"):
        case tr("CLEANUP"):
          state_color = 'powering_off';
          state_str = tr("POWERING OFF");
          break;
        case tr("UNKNOWN"):
          state_color = 'powering_off';
          state_str = tr("UNKNOWN");
          break;
        default:
          state_color = 'powering_off';
          state_str = tr("UNKNOWN");
          break;
      }

      break;
    case tr("STOPPED"):
    case tr("SUSPENDED"):
    case tr("POWEROFF"):
      state_color = 'off';
      state_str = tr("OFF");

      break;
    default:
      state_color = 'powering_off';
      state_str = tr("UNKNOWN");
      break;
  }

  return {
    color: state_color,
    str: state_str
  }
}

function get_provision_disk_image(data) {
  var disks = []
  if ($.isArray(data.TEMPLATE.DISK))
      disks = data.TEMPLATE.DISK
  else if (!$.isEmptyObject(data.TEMPLATE.DISK))
      disks = [data.TEMPLATE.DISK]

  if (disks.length > 0) {
    return '<i class="fa fa-fw fa-lg fa-download"></i> ' + disks[0].IMAGE;
  } else {
    return '<i class="fa fa-fw fa-lg fa-download"></i> -';
  }
}

function get_provision_ips(data) {
  return '<i class="fa fa-fw fa-lg fa-globe"></i> ' + ip_str(data, " - ");
}

// @params
//    data: and IMAGE object
//      Example: data.ID
// @returns and object containing the following properties
//    color: css class for this state.
//      color + '-color' font color class
//      color + '-bg' background class
//    str: user friendly state string
function get_provision_image_state(data) {
  var state = OpenNebula.Helper.resource_state("image",data.STATE);
  var state_color;
  var state_str;

  switch (state) {
    case tr("READY"):
    case tr("USED"):
      state_color = 'running';
      state_str = tr("READY");
      break;
    case tr("DISABLED"):
    case tr("USED_PERS"):
      state_color = 'off';
      state_str = tr("OFF");
      break;
    case tr("LOCKED"):
    case tr("CLONE"):
    case tr("INIT"):
      state_color = 'deploying';
      state_str = tr("DEPLOYING") + " (1/3)";
      break;
    case tr("ERROR"):
      state_color = 'error';
      state_str = tr("ERROR");
      break;
    case tr("DELETE"):
      state_color = 'error';
      state_str = tr("DELETING");
      break;
    default:
      state_color = 'powering_off';
      state_str = tr("UNKNOWN");
      break;
  }

  return {
    color: state_color,
    str: state_str
  }
}

function setup_info_vm(context) {
  function update_provision_vm_info(vm_id, context) {
    //var tempScrollTop = $(window).scrollTop();
    $(".provision_info_vm_name", context).text("");
    $(".provision_info_vm_loading", context).show();
    $(".provision_info_vm", context).css('visibility', 'hidden');

    OpenNebula.VM.show({
      data : {
        id: vm_id
      },
      error: onError,
      success: function(request, response){
        var data = response.VM
        var state = get_provision_vm_state(data);

        switch (state.color) {
          case "deploying":
            $(".provision_reboot_confirm_button", context).hide();
            $(".provision_poweroff_confirm_button", context).hide();
            $(".provision_poweron_button", context).hide();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdownhard_confirm_button", context).hide();
            $(".provision_snapshot_button", context).hide();
            $(".provision_vnc_button", context).hide();
            $(".provision_snapshot_button_disabled", context).hide();
            $(".provision_vnc_button_disabled", context).hide();
            break;
          case "running":
            $(".provision_reboot_confirm_button", context).show();
            $(".provision_poweroff_confirm_button", context).show();
            $(".provision_poweron_button", context).hide();
            $(".provision_delete_confirm_button", context).hide();
            $(".provision_shutdownhard_confirm_button", context).show();
            $(".provision_snapshot_button", context).hide();
            $(".provision_vnc_button", context).show();
            $(".provision_snapshot_button_disabled", context).show();
            $(".provision_vnc_button_disabled", context).hide();
            break;
          case "off":
            $(".provision_reboot_confirm_button", context).hide();
            $(".provision_poweroff_confirm_button", context).hide();
            $(".provision_poweron_button", context).show();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdownhard_confirm_button", context).hide();
            $(".provision_snapshot_button", context).show();
            $(".provision_vnc_button", context).hide();
            $(".provision_snapshot_button_disabled", context).hide();
            $(".provision_vnc_button_disabled", context).show();
            break;
          case "powering_off":
          case "error":
            $(".provision_reboot_confirm_button", context).hide();
            $(".provision_poweroff_confirm_button", context).hide();
            $(".provision_poweron_button", context).hide();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdownhard_confirm_button", context).hide();
            $(".provision_snapshot_button", context).hide();
            $(".provision_vnc_button", context).hide();
            $(".provision_snapshot_button_disabled", context).hide();
            $(".provision_vnc_button_disabled", context).hide();
            break;
          default:
            color = 'secondary';
            $(".provision_reboot_confirm_button", context).hide();
            $(".provision_poweroff_confirm_button", context).hide();
            $(".provision_poweron_button", context).hide();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdownhard_confirm_button", context).hide();
            $(".provision_snapshot_button", context).hide();
            $(".provision_vnc_button", context).hide();
            $(".provision_snapshot_button_disabled", context).hide();
            $(".provision_vnc_button_disabled", context).hide();
            break;
        }

        $(".provision_info_vm", context).attr("vm_id", data.ID);
        $(".provision_info_vm", context).data("vm", data);

        $(".provision_info_vm_name", context).text(data.NAME);

        $(".provision-pricing-table_vm_info", context).html(
            '<li class="text-left provision-title">'+
              '<span class="'+ state.color +'-color">'+
                '<i class="fa fa-fw fa-lg fa-square"/>&emsp;'+
                state.str+
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item">'+
              '<hr style="margin: 0px">'+
            '</li>'+
            '<li class="text-left provision-bullet-item" >'+
              '<span style="font-size: 16px">'+
                '<i class="fa fa-fw fa-lg fa-laptop"/>&emsp;'+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item" >'+
              '<span style="font-size: 16px">'+
                get_provision_disk_image(data) +
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item" >'+
              '<span style="font-size: 16px">'+
                get_provision_ips(data) +
              '</span>'+
            '</li>'+
            //'<li  class="text-left provision-bullet-item" >'+
            //  '<span style="color: #afafaf;px" style="font-size: 16px">'+
            //    "ID: " +
            //    data.ID+
            //  '</span>' +
            //'</li>'+
            '<li class="text-left provision-bullet-item">'+
              '<hr style="margin: 0px">'+
            '</li>'+
            '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
              '<span style="color: #999;px">'+
                '<i class="fa fa-fw fa-lg fa-clock-o"/>&emsp;'+
                _format_date(data.STIME)+
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
              '<span style="color: #999;px">'+
                '<i class="fa fa-fw fa-lg fa-user"/>&emsp;'+
                data.UNAME+
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item">'+
            '</li>');

        $(".provision_confirm_action:first", context).html("");

        $(".provision_info_vm", context).css('visibility', 'visible');
        $(".provision_info_vm_loading", context).hide();

        //$(window).scrollTop(tempScrollTop);

        OpenNebula.VM.monitor({
          data : {
            timeout: true,
            id: data.ID,
            monitor: {
              monitor_resources : "CPU,MEMORY,NET_TX,NET_RX"
            }
          },
          success: function(request, response){
            var vm_graphs = [
                {
                    monitor_resources : "CPU",
                    labels : "Real CPU",
                    humanize_figures : false,
                    div_graph : $(".vm_cpu_graph", context)
                },
                {
                    monitor_resources : "MEMORY",
                    labels : "Real MEM",
                    humanize_figures : true,
                    div_graph : $(".vm_memory_graph", context)
                },
                {
                    labels : "Network reception",
                    monitor_resources : "NET_RX",
                    humanize_figures : true,
                    convert_from_bytes : true,
                    div_graph : $(".vm_net_rx_graph", context)
                },
                {
                    labels : "Network transmission",
                    monitor_resources : "NET_TX",
                    humanize_figures : true,
                    convert_from_bytes : true,
                    div_graph : $(".vm_net_tx_graph", context)
                },
                {
                    labels : "Network reception speed",
                    monitor_resources : "NET_RX",
                    humanize_figures : true,
                    convert_from_bytes : true,
                    y_sufix : "B/s",
                    derivative : true,
                    div_graph : $(".vm_net_rx_speed_graph", context)
                },
                {
                    labels : "Network transmission speed",
                    monitor_resources : "NET_TX",
                    humanize_figures : true,
                    convert_from_bytes : true,
                    y_sufix : "B/s",
                    derivative : true,
                    div_graph : $(".vm_net_tx_speed_graph", context)
                }
            ];

            for(var i=0; i<vm_graphs.length; i++) {
                plot_graph(
                    response,
                    vm_graphs[i]
                );
            }
          }
        })
      }
    })
  }

  if (Config.isTabPanelEnabled("provision-tab", "templates")) {
    context.on("click", ".provision_snapshot_button", function(){
      $(".provision_confirm_action:first", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
            '<div class="large-12 columns">'+
              '<span style="font-size: 14px; line-height: 20px">'+
                tr("This Virtual Machine will be saved in a new Template. Only the main disk will be preserved!")+
              '<br>'+
                tr("You can then create a new Virtual Machine using this Template")+
              '</span>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-11 large-centered columns">'+
              '<input type="text" class="provision_snapshot_name" placeholder="'+tr("Template Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important; margin: 0px"/>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-11 large-centered columns">'+
              '<a href"#" class="provision_snapshot_create_button success button large-12 radius right">'+tr("Save Virtual Machine to Template")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_snapshot_create_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");
      var context = $(".provision_info_vm[vm_id]");

      var vm_id = context.attr("vm_id");
      var image_name = $('.provision_snapshot_name', context).val();

      OpenNebula.VM.saveas({
        data : {
          id: vm_id,
          extra_param: {
            disk_id : "0",
            image_name : image_name,
            type: "",
            clonetemplate: true,
            hot: true
          }
        },
        success: function(request, response){
          OpenNebula.Helper.clear_cache("VMTEMPLATE");
          notifyMessage(tr("Image") + ' ' + request.request.data[0][1].image_name + ' ' + tr("saved successfully"))
          update_provision_vm_info(vm_id, context);
          button.removeAttr("disabled");
        },
        error: function(request, response){
          onError(request, response);
          button.removeAttr("disabled");
        }
      })

      return false;
    });
  }

  context.on("click", ".provision_delete_confirm_button", function(){
    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
        '<div class="large-9 columns">'+
          '<span style="font-size: 14px; line-height: 20px">'+
            tr("Be careful, this action will inmediately destroy your Virtual Machine")+
            '<br>'+
            tr("All the information will be lost!")+
          '</span>'+
        '</div>'+
        '<div class="large-3 columns">'+
          '<a href"#" class="provision_delete_button alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
        '</div>'+
        '</div>'+
        '<a href="#" class="close">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_shutdownhard_confirm_button", function(){
    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
        '<div class="large-9 columns">'+
          '<span style="font-size: 14px; line-height: 20px">'+
            tr("Be careful, this action will inmediately destroy your Virtual Machine")+
            '<br>'+
            tr("All the information will be lost!")+
          '</span>'+
        '</div>'+
        '<div class="large-3 columns">'+
          '<a href"#" class="provision_shutdownhard_button alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
        '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_poweroff_confirm_button", function(){
    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
        '<div class="large-11 columns">'+
          '<span style="font-size: 14px; line-height: 20px">'+
            tr("This action will power off this Virtual Machine. The Virtual Machine will remain in the poweroff state, and can be powered on later")+
            '<br>'+
            '<br>'+
            tr("You can send the power off signal to the Virtual Machine (this is equivalent to execute the command from the console). If that doesn't effect your Virtual Machine, try to Power off the machine (this is equivalent to pressing the power off button in a physical computer).")+
          '</span>'+
        '</div>'+
        '</div>'+
        '<br>'+
        '<div class="row">'+
        '<div class="large-12 columns">'+
          '<a href"#" class="provision_poweroff_button button radius right" style="margin-right: 15px">'+tr("Power off")+'</a>'+
          '<label class="left" style="margin-left: 25px">'+
            '<input type="radio" name="provision_poweroff_radio" value="poweroff_hard" class="provision_poweroff_hard_radio">'+
            ' <i class="fa fa-fw fa-bolt"/> '+tr("Power off the machine")+
          '</label>'+
          '<label class="left" style="margin-left: 25px">'+
            '<input type="radio" name="provision_poweroff_radio" value="poweroff" class="provision_poweroff_radio" checked>'+
            ' <i class="fa fa-fw fa-power-off"/> '+tr("Send the power off signal")+
          '</label>'+
        '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_reboot_confirm_button", function(){
    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
        '<div class="large-11 columns">'+
          '<span style="font-size: 14px; line-height: 20px">'+
            tr("This action will reboot this Virtual Machine.")+
            '<br>'+
            '<br>'+
            tr("You can send the reboot signal to the Virtual Machine (this is equivalent to execute the reboot command form the console). If that doesn't effect your Virtual Machine, try to Reboot the machine (this is equivalent to pressing the reset button a physical computer).")+
          '</span>'+
        '</div>'+
        '</div>'+
        '<br>'+
        '<div class="row">'+
        '<div class="large-12 columns">'+
          '<a href"#" class="provision_reboot_button button radius right" style="margin-right: 15px">'+tr("Reboot")+'</a>'+
          '<label class="left" style="margin-left: 25px">'+
            '<input type="radio" name="provision_reboot_radio" value="reset" class="provision_reboot_hard_radio">'+
            ' <i class="fa fa-fw fa-bolt"/> '+tr("Reboot the machine")+
          '</label>'+
          '<label class="left" style="margin-left: 25px">'+
            '<input type="radio" name="provision_reboot_radio" value="reboot" class="provision_reboot_radio" checked>'+
            ' <i class="fa fa-fw fa-power-off"/> '+tr("Send the reboot signal")+
          '</label>'+
        '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_delete_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var vm_id = $(".provision_info_vm", context).attr("vm_id");

    OpenNebula.VM.del({
      data : {
        id: vm_id
      },
      success: function(request, response){
        $(".provision_back", context).click();
        $(".provision_vms_list_refresh_button", context).click();
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })

    return false;
  });

  context.on("click", ".provision_shutdownhard_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var vm_id = $(".provision_info_vm", context).attr("vm_id");

    OpenNebula.VM.cancel({
      data : {
        id: vm_id
      },
      success: function(request, response){
        $(".provision_back", context).click();
        $(".provision_vms_list_refresh_button", context).click();
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })

    return false;
  });

  context.on("click", ".provision_poweroff_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var vm_id = $(".provision_info_vm", context).attr("vm_id");
    var poweroff_action = $('input[name=provision_poweroff_radio]:checked').val()

    OpenNebula.VM[poweroff_action]({
      data : {
        id: vm_id
      },
      success: function(request, response){
        update_provision_vm_info(vm_id, context);
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })

    return false;
  });

  context.on("click", ".provision_reboot_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");

    var vm_id = $(".provision_info_vm", context).attr("vm_id");
    var reboot_action = $('input[name=provision_reboot_radio]:checked').val()

    OpenNebula.VM[reboot_action]({
      data : {
        id: vm_id
      },
      success: function(request, response){
        update_provision_vm_info(vm_id, context);
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })

    return false;
  });

  context.on("click", ".provision_poweron_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var vm_id = $(".provision_info_vm", context).attr("vm_id");

    OpenNebula.VM.resume({
      data : {
        id: vm_id
      },
      success: function(request, response){
        update_provision_vm_info(vm_id, context);
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })

    return false;
  });

  context.on("click", ".provision_vnc_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var vm_id = $(".provision_info_vm", context).attr("vm_id");
    var vm_data = $(".provision_info_vm", context).data("vm");

    OpenNebula.VM.startvnc({
      data : {
        id: vm_id
      },
      success: function(request, response){
        if (enableVnc(vm_data)) {
          var proxy_host = window.location.hostname;
          var proxy_port = config['system_config']['vnc_proxy_port'];
          var pw = response["password"];
          var token = response["token"];
          var vm_name = response["vm_name"];
          var path = '?token='+token;

          var url = "vnc?";
          url += "host=" + proxy_host;
          url += "&port=" + proxy_port;
          url += "&token=" + token;
          url += "&password=" + pw;
          url += "&encrypt=" + config['user_config']['vnc_wss'];
          url += "&title=" + vm_name;

          window.open(url, '', '_blank');
          button.removeAttr("disabled");
        } else if (enableSPICE(vm_data)) {
          var host, port, password, scheme = "ws://", uri, token, vm_name;

          if (config['user_config']['vnc_wss'] == "yes") {
              scheme = "wss://";
          }

          host = window.location.hostname;
          port = config['system_config']['vnc_proxy_port'];
          password = response["password"];
          token = response["token"];
          vm_name = response["vm_name"];

          uri = scheme + host + ":" + port + "?token=" + token;

          var url = "spice?";
          url += "host=" + host;
          url += "&port=" + port;
          url += "&token=" + token;
          url += "&password=" + password;
          url += "&encrypt=" + config['user_config']['vnc_wss'];
          url += "&title=" + vm_name;

          window.open(url, '', '_blank');
          button.removeAttr("disabled");
        } else {
          notifyError("The remote console is not enabled for this VM")
        }
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })

    return false;
  });

  context.on("click", ".provision_refresh_info", function(){
    var vm_id = $(".provision_info_vm", context).attr("vm_id");
    update_provision_vm_info(vm_id, context);
    return false;
  });

  //
  // Info VM
  //

  $(".provision_list_vms", context).on("click", ".provision_info_vm_button", function(){
    $("a.provision_show_vm_accordion", context).trigger("click");
    // TODO loading

    var vm_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
    update_provision_vm_info(vm_id, context);
    return false;
  })
}

function setup_provision_vms_list(context, opts) {
  var provision_vms_datatable = $('.provision_vms_table', context).dataTable({
    "iDisplayLength": 6,
    "sDom" : '<"H">t<"F"lp>',
    "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
    "aaSorting"  : [[0, "desc"]],
    "aoColumnDefs": [
        { "bVisible": false, "aTargets": ["all"]}
    ],
    "aoColumns": [
        { "mDataProp": "VM.ID" },
        { "mDataProp": "VM.NAME" },
        { "mDataProp": "VM.UID" }
    ],
    "fnPreDrawCallback": function (oSettings) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (this.$('tr', {"filter": "applied"} ).length == 0) {
        this.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("There are no Virtual Machines")+
          '</span>'+
          '</div>');
      } else {
        $(".provision_vms_table", context).html('<ul class="provision_vms_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
      }

      return true;
    },
    "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
      var data = aData.VM;
      var state = get_provision_vm_state(data);

      $(".provision_vms_ul", context).append('<li>'+
          '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
            '<li class="provision-title text-left" style="padding-bottom: 0px">'+
              '<a class="provision_info_vm_button" style="color:#555" href="#">'+ data.NAME + '</a>'+
              '<a class="provision_info_vm_button right" style="color:#555;" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/></a>'+
            '</li>'+
            '<li class="provision-bullet-item text-right" style="color: #999; margin-bottom:10px;">'+
              '<span class="'+ state.color +'-color left">'+
                '<i class="fa fa-fw fa-square"/> '+
                state.str+
              '</span>'+
            '</li>'+
            //'<li class="provision-bullet-item" style="padding: 0px">'+
            //  '<div style="height:1px" class="'+ state.color +'-bg"></div>'+
            //'</li>'+
            '<li class="provision-bullet-item text-left" style="margin-left: 10px">'+
              '<i class="fa fa-fw fa-lg fa-laptop"/> '+
              'x'+data.TEMPLATE.CPU+' - '+
              ((data.TEMPLATE.MEMORY > 1000) ?
                (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                (data.TEMPLATE.MEMORY+'MB'))+
            '</li>'+
            '<li class="provision-bullet-item text-left" style="margin-left: 10px">'+
              get_provision_disk_image(data) +
            '</li>'+
            '<li class="provision-bullet-item text-left" style="margin-left: 10px">'+
              get_provision_ips(data) +
            '</li>'+
            '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; margin-top:15px; padding-bottom:10px">'+
              '<span class="left">'+
                '<i class="fa fa-fw fa-lg fa-user"/> '+
                data.UNAME+
              '</span>'+
              '<span style="font-size:12px; color: #999; padding-bottom:10px">'+
                '<i class="fa fa-fw fa-lg fa-clock-o"/> '+
                _format_date(data.STIME)+
              '</span>'+
            '</li>'+
          '</ul>'+
        '</li>');

      return nRow;
    }
  });

  $('.provision_list_vms_search', context).keyup(function(){
    provision_vms_datatable.fnFilter( $(this).val() );
  })

  $('.provision_list_vms_search', context).change(function(){
    provision_vms_datatable.fnFilter( $(this).val() );
  })

  context.on("click", ".provision_vms_list_refresh_button", function(){
    OpenNebula.Helper.clear_cache("VM");
    update_provision_vms_datatable(provision_vms_datatable, 0);
    return false;
  });

  $(".provision_list_vms_filter", context).on("change", ".resource_list_select", function(){
    if ($(this).val() != "-2"){
      provision_vms_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
    } else {
      provision_vms_datatable.fnFilterClear();
    }
  })

  insertSelectOptions(
    ".provision_list_vms_filter",
    context,
    "User",
    (opts.filter_expression ? opts.filter_expression : "-2"),
    false,
    '<option value="-2">'+tr("ALL")+'</option>',
    null,
    null,
    true,
    true);

  context.on("click", ".provision_vms_list_filter_button", function(){
    $(".provision_list_vms_filter", context).fadeIn();
    return false;
  });

  OpenNebula.Helper.clear_cache("VM");
  update_provision_vms_datatable(provision_vms_datatable, 0);

  $(document).foundation();
}

function generate_provision_vms_list(context, opts) {
  context.off();
  context.html(provision_list_vms(opts));

  if (opts.data) {
    $(".provision_vms_table", context).data("opennebula", opts.data)
  }

  setup_provision_vms_list(context, opts);
  setup_info_vm(context);
}


function setup_provision_templates_list(context, opts) {
  var provision_templates_datatable = $('.provision_templates_table', context).dataTable({
    "iDisplayLength": 8,
    "sDom" : '<"H">t<"F"lp>',
    "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
    "aaSorting"  : [[0, "desc"]],
    "aoColumnDefs": [
        { "bVisible": false, "aTargets": ["all"]}
    ],
    "aoColumns": [
        { "mDataProp": "VMTEMPLATE.ID" },
        { "mDataProp": "VMTEMPLATE.NAME" },
        { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  },
        { "mDataProp": "VMTEMPLATE.UID" }
    ],
    "fnPreDrawCallback": function (oSettings) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (this.$('tr', {"filter": "applied"} ).length == 0) {
        this.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("There are no saved templates available")+
            '<br>'+
            tr("Create a template by saving a running Virtual Machine")+
          '</span>'+
          '</div>');
      } else {
        $(".provision_templates_table", context).html('<ul class="provision_templates_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
      }
      return true;
    },
    "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
      var data = aData.VMTEMPLATE;
      //var state = get_provision_image_state(data);
      var actions_html = "";
      if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
        if (data.UID == config['user_id']) {

          if (data.PERMISSIONS.GROUP_U == "1") {
            actions_html += '<a class="provision_confirm_unshare_template_button left" data-tooltip title="'+ tr("Unshare")+'" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-ban only-on-hover"/></a>';
            actions_html += '<span style="font-size:12px; color: #777">' + tr("SHARED") + '</span>';
          } else {
            actions_html += '<a class="provision_confirm_chmod_template_button left" data-tooltip title="'+ tr("Share")+'" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-share-alt only-on-hover"/></a>';
          }
        }
      }

      if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
        actions_html += '<a class="provision_confirm_delete_template_button" data-tooltip title="'+ tr("Delete")+'"  style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-trash-o right only-on-hover"/></a>';
      }

      $(".provision_templates_ul", context).append('<li>'+
          '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" saved_to_image_id="'+data.TEMPLATE.SAVED_TO_IMAGE_ID+'" datatable_index="'+iDisplayIndexFull+'">'+
            '<li class="provision-title text-left" title="'+data.NAME+'">'+
              data.NAME +
            '</li>'+
            '<li class="provision-description text-left" style="padding-top:0px; padding-bottom: 5px">'+
              (data.TEMPLATE.DESCRIPTION || '...')+
            '</li>'+
            '<li class="provision-bullet-item text-left" style="margin-left: 5px">'+
              '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                'x'+(data.TEMPLATE.CPU||'-')+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  ((data.TEMPLATE.MEMORY||'-')+'MB'))+
            '</li>'+
            '<li class="provision-bullet-item text-left" style="margin-left: 5px">'+
              '<i class="fa fa-fw fa-user"/>&emsp;'+
              data.UNAME+
            '</li>'+
            '<li class="provision-description text-right" style="padding-top:5px; margin-right: 5px">'+
              '<i class="fa fa-fw fa-clock-o"/>'+
              _format_date(data.REGTIME)+
            '</li>'+
            '<li class="provision-title" style="padding-top:10px">'+
              actions_html+
            '</li>'+
          '</ul>'+
        '</li>');

      return nRow;
    }
  });

  provision_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);

  $('.provision_list_templates_search', context).keyup(function(){
    provision_templates_datatable.fnFilter( $(this).val() );
  })

  $('.provision_list_templates_search', context).change(function(){
    provision_templates_datatable.fnFilter( $(this).val() );
  })

  context.on("click", ".provision_templates_list_refresh_button", function(){
    OpenNebula.Helper.clear_cache("VMTEMPLATE");
    $(".provision_confirm_delete_template_div", context).html("");
    update_provision_templates_datatable(provision_templates_datatable, 0);
    return false;
  });

  context.on("click", ".provision_templates_list_search_button", function(){
    $(".provision_list_templates_search", context).fadeIn();
  });

  $(".provision_list_templates_filter", context).on("change", ".resource_list_select", function(){
    if ($(this).val() != "-2"){
      provision_templates_datatable.fnFilter("^" + $(this).val() + "$", 3, true, false);
    } else {
      provision_templates_datatable.fnFilterClear();
    }
  })

  insertSelectOptions(
    ".provision_list_templates_filter",
    context,
    "User",
    (opts.filter_expression ? opts.filter_expression : "-2"),
    false,
    '<option value="-2">'+tr("ALL")+'</option>',
    null,
    null,
    true,
    true);

  context.on("click", ".provision_templates_list_filter_button", function(){
    $(".provision_list_templates_filter", context).fadeIn();
    return false;
  });

  if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
    context.on("click", ".provision_confirm_delete_template_button", function(){
      var ul_context = $(this).parents(".provision-pricing-table");
      var template_id = ul_context.attr("opennebula_id");
      var image_id = ul_context.attr("saved_to_image_id");
      var template_name = $(".provision-title", ul_context).text();

      $(".provision_confirm_delete_template_div", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-9 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              tr("Handle with care! This action will inmediately destroy the template")+
              ' "' + template_name + '" ' +
              tr("and the image associated.") +
            '</span>'+
          '</div>'+
          '<div class="large-3 columns">'+
            '<a href"#" class="provision_delete_template_button alert button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_delete_template_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");

      var template_id = $(this).attr("template_id");
      var image_id = $(this).attr("image_id");

      OpenNebula.Image.del({
        timeout: true,
        data : {
          id : image_id
        },
        success: function (){
          OpenNebula.Template.del({
            timeout: true,
            data : {
              id : template_id
            },
            success: function (){
              $(".provision_templates_list_refresh_button", context).trigger("click");
            },
            error: function (request,error_json, container) {
              onError(request, error_json, container);
            }
          })
        },
        error: function (request,error_json, container) {
          if (error_json.error.http_status=="404") {
            OpenNebula.Template.del({
              timeout: true,
              data : {
                id : template_id
              },
              success: function (){
                $(".provision_templates_list_refresh_button", context).trigger("click");
              },
              error: function (request,error_json, container) {
                onError(request, error_json, container);
                $(".provision_templates_list_refresh_button", context).trigger("click");
              }
            })
          } else {
            onError(request, error_json, container);
          }
        }
      })
    });
  }


  if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
    context.on("click", ".provision_confirm_chmod_template_button", function(){
      var ul_context = $(this).parents(".provision-pricing-table");
      var template_id = ul_context.attr("opennebula_id");
      var image_id = ul_context.attr("saved_to_image_id");
      var template_name = $(".provision-title", ul_context).text();

      $(".provision_confirm_delete_template_div", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-8 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              tr("The template")+
              ' "' + template_name + '" ' +
              tr("and the image associated will be shared and all the users will be able to instantiate new VMs using this template.") +
            '</span>'+
          '</div>'+
          '<div class="large-4 columns">'+
            '<a href"#" class="provision_chmod_template_button success button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+tr("Share template")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_chmod_template_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");

      var template_id = $(this).attr("template_id");
      var image_id = $(this).attr("image_id");

      OpenNebula.Template.chmod({
        timeout: true,
        data : {
          id : template_id,
          extra_param: {'group_u': 1}
        },
        success: function (){
          $(".provision_templates_list_refresh_button", context).trigger("click");

          OpenNebula.Image.chmod({
            timeout: true,
            data : {
              id : image_id,
              extra_param: {'group_u': 1}
            },
            success: function (){
            },
            error: onError
          })
        },
        error: onError
      })
    });

    context.on("click", ".provision_confirm_unshare_template_button", function(){
      var ul_context = $(this).parents(".provision-pricing-table");
      var template_id = ul_context.attr("opennebula_id");
      var image_id = ul_context.attr("saved_to_image_id");
      var template_name = $(".provision-title", ul_context).first().text();

      $(".provision_confirm_delete_template_div", context).html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-8 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              tr("The template")+
              ' "' + template_name + '" ' +
              tr("and the image associated will be unshared and the users will not be able to instantiate new VMs using this template.") +
            '</span>'+
          '</div>'+
          '<div class="large-4 columns">'+
            '<a href"#" class="provision_unshare_template_button success button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+tr("Unshare template")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    context.on("click", ".provision_unshare_template_button", function(){
      var button = $(this);
      button.attr("disabled", "disabled");

      var template_id = $(this).attr("template_id");
      var image_id = $(this).attr("image_id");

      OpenNebula.Template.chmod({
        timeout: true,
        data : {
          id : template_id,
          extra_param: {'group_u': 0}
        },
        success: function (){
          $(".provision_templates_list_refresh_button", context).trigger("click");

          OpenNebula.Image.chmod({
            timeout: true,
            data : {
              id : image_id,
              extra_param: {'group_u': 0}
            },
            success: function (){
            },
            error: onError
          })
        },
        error: onError
      })
    });
  }

  OpenNebula.Helper.clear_cache("VMTEMPLATE");
  update_provision_templates_datatable(provision_templates_datatable, 0);
  context.foundation();
}

function generate_provision_templates_list(context, opts) {
  context.off();
  context.html(provision_list_templates(opts));
  setup_provision_templates_list(context, opts);
}

function setup_info_flow(context) {
  function update_provision_flow_info(flow_id, context, role_id) {
    $(".provision_info_flow_name", context).text("");
    $(".provision_info_flow", context).css('visibility', 'hidden');
    $(".provision_info_flow_loading", context).fadeIn();
    $(".provision_role_vms_container").html("");

    OpenNebula.Service.show({
      data : {
        id: flow_id
      },
      error: onError,
      success: function(request, response){
        var data = response.DOCUMENT
        var body = data.TEMPLATE.BODY;
        var state = get_provision_flow_state(body);
        var start_time = get_provision_flow_start_time(body);

        switch (state.color) {
          case "deploying":
            $(".provision_recover_button", context).hide();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdown_confirm_button", context).show();
            break;
          case "running":
            $(".provision_recover_button", context).hide();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdown_confirm_button", context).show();
            break;
          case "off":
            $(".provision_recover_button", context).hide();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdown_confirm_button", context).hide();
            break;
          case "powering_off":
          case "error":
            $(".provision_recover_button", context).show();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdown_confirm_button", context).show();
            break;
          default:
            $(".provision_recover_button", context).show();
            $(".provision_delete_confirm_button", context).show();
            $(".provision_shutdown_confirm_button", context).show();
            break;
        }

        $(".provision_info_flow", context).attr("flow_id", data.ID);
        $(".provision_info_flow_name", context).text(data.NAME);

        $(".provision-pricing-table_flow_info", context).html(
            '<li class="text-left provision-title">'+
              '<span class="'+ state.color +'-color">'+
                '<i class="fa fa-fw fa-lg fa-square"/>&emsp;'+
                state.str+
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item">'+
              '<hr style="margin: 0px">'+
            '</li>'+
            '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
              '<span style="color: #999;px">'+
                '<i class="fa fa-fw fa-lg fa-clock-o"/>&emsp;'+
                (start_time ? _format_date(start_time) : "-") +
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item" style="font-size: 16px">'+
              '<span style="color: #999;px">'+
                '<i class="fa fa-fw fa-lg fa-user"/>&emsp;'+
                data.UNAME+
              '</span>'+
            '</li>'+
            '<li class="text-left provision-bullet-item">'+
            '</li>'+
          '</ul>');

        $(".provision_roles_ul", context).html("");
        if (body.roles) {
          $.each(body.roles, function(index, role) {
            var role_state = get_provision_flow_state(role);
            var rvms = {
              str : (role.nodes ? role.nodes.length : 0) + " / " + role.cardinality ,
              percentage : Math.floor((role.nodes ? role.nodes.length : 0) / role.cardinality)*100
            }

            var li = $(
              '<li>'+
                '<ul class="provision_role_ul provision-pricing-table">'+
                  '<li class="provision-title text-left">'+
                    '<i class="fa fa-fw fa-cube"/>&emsp;'+
                    role.name+
                  '</li>'+
                  '<li class="provision-bullet-item text-left" style="padding-top: 5px; margin-left: 10px; margin-right: 10px">'+
                    '<div class="progress small radius" style="margin-bottom:0px">'+
                    '  <span class="meter" style="width: '+rvms.percentage+'%;"></span>'+
                    '</div>'+
                  '</li>'+
                  '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px; font-size: 14px">'+
                    '<span class="'+ role_state.color +'-color">'+
                      role_state.str+
                    '</span>'+
                    '<span class="right">'+rvms.str+" VMs</span>"+
                  '</li>'+
                  '<li class="text-left provision-bullet-item">'+
                    '<br>'+
                  '</li>'+
                  '<li class="provision-bullet-item text-left" style="padding-top: 5px; margin-left: 10px; margin-right: 10px">'+
                    '<a class="provision_role_vms_button button medium radius">'+
                      '<i class="fa fa-th fa-lg"></i>'+
                    '</a>'+
                    '<a class="provision_role_cardinality_button button medium success right radius">'+
                      '<i class="fa fa-arrows-h fa-lg"></i>'+
                    '</a>'+
                  '</li>'+
                '</ul>'+
              '</li>').appendTo($(".provision_roles_ul", context));

              $(".provision_role_ul", li).data("role", role);
              if (role_id && role_id == role.name) {
                $(".provision_role_vms_button", li).trigger("click");
              }
          });
        }

        $(".provision_info_flow_state_hr", context).html('<div style="height:1px; margin-top:5px; margin-bottom: 5px; background: #cfcfcf"></div>');

        $(".provision_confirm_action:first", context).html("");

        $(".provision_info_flow_loading", context).hide();
        $(".provision_info_flow", context).css('visibility', 'visible');
      }
    })
  }

  context.on("click", ".provision_role_vms_button", function(){
    $(".provision_role_vms_container", context).html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
      '</span>'+
      '</div>');

    var role = $(this).closest(".provision_role_ul").data('role');
    $(".provision_info_flow", context).data("role_id", role.name);
    var vms = []

    if (role.nodes && role.nodes.length > 0) {
      $.each(role.nodes, function(index, node){
        vms.push(node.vm_info);
      })
    }

    generate_provision_vms_list(
      $(".provision_role_vms_container", context),
      {
        title: role.name + ' ' + tr("VMs"),
        active: true,
        refresh: false,
        create: false,
        filter: false,
        data: vms
      });
  })

  context.on("click", ".provision_role_cardinality_button", function(){
    var role = $(this).closest(".provision_role_ul").data('role');
    var min_vms = (role.min_vms||1);
    var max_vms = (role.max_vms||100);

    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<div class="row">'+
              '<div class="large-4 text-center columns">'+
                '<span class="cardinality_value" style="color: #777; font-size:60px">'+role.cardinality+'</span>'+
                '<br>'+
                '<span style="color: #999; font-size:20px">'+role.name + ' ' + tr("VMs")+'</span>'+
              '</div>'+
              '<div class="large-8 columns text-center">'+
              '<div class="cardinality_slider_div">'+
                '<br>'+
                '<span class="left" style="color: #999;">'+min_vms+'</span>'+
                '<span class="right" style="color: #999;">'+max_vms+'</span>'+
                '<br>'+
                '<div class="cardinality_slider">'+
                '</div>'+
                '<br>'+
                '<a href"#" class="provision_change_cardinality_button success button radius large-12" role_id="'+role.name+'">'+tr("Change Cardinality")+'</a>'+
              '</div>'+
              '<div class="cardinality_no_slider_div">'+
                '<br>'+
                '<br>'+
                '<span class="" style="color: #999;">'+tr("The cardinality for this role cannot be changed")+'</span>'+
              '</div>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');


    if (max_vms > min_vms) {
      $( ".cardinality_slider_div", context).show();
      $( ".cardinality_no_slider_div", context).hide();

      var provision_cardinality_slider = $( ".cardinality_slider", context).noUiSlider({
          handles: 1,
          connect: "lower",
          range: [min_vms, max_vms],
          step: 1,
          start: role.cardinality,
          value: role.cardinality,
          slide: function(type) {
              if ( type != "move"){
                if ($(this).val()) {
                  $(".cardinality_value", context).html($(this).val());
                }
              }
          }
      });

      provision_cardinality_slider.val(role.cardinality)

      provision_cardinality_slider.addClass("noUiSlider");
    } else {
      $( ".cardinality_slider_div", context).hide();
      $( ".cardinality_no_slider_div", context).show();
    }

    return false;
  });

  context.on("click", ".provision_change_cardinality_button", function(){
    var flow_id = $(".provision_info_flow", context).attr("flow_id");
    var cardinality = $(".cardinality_slider", context).val()

    OpenNebula.Role.update({
      data : {
        id: flow_id + '/role/' + $(this).attr("role_id"),
        extra_param: {
          cardinality: cardinality
        }
      },
      success: function(request, response){
        OpenNebula.Helper.clear_cache("SERVICE");
        $(".provision_refresh_info", context).trigger("click");
      },
      error: onError
    })
  });

  context.on("click", ".provision_delete_confirm_button", function(){
    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
        '<div class="large-9 columns">'+
          '<span style="font-size: 14px; line-height: 20px">'+
            tr("Be careful, this action will inmediately destroy your Service")+
            '<br>'+
            tr("All the information will be lost!")+
          '</span>'+
        '</div>'+
        '<div class="large-3 columns">'+
          '<a href"#" class="provision_delete_button alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
        '</div>'+
        '</div>'+
        '<a href="#" class="close">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_shutdown_confirm_button", function(){
    $(".provision_confirm_action:first", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
        '<div class="large-9 columns">'+
          '<span style="font-size: 14px; line-height: 20px">'+
            tr("Be careful, this action will inmediately shutdown your Service")+
            '<br>'+
            tr("All the information will be lost!")+
          '</span>'+
        '</div>'+
        '<div class="large-3 columns">'+
          '<a href"#" class="provision_shutdown_button alert button large-12 radius right" style="margin-right: 15px">'+tr("Shutdown")+'</a>'+
        '</div>'+
        '</div>'+
        '<a href="#" class="close">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_recover_button", function(){
    var flow_id = $(".provision_info_flow", context).attr("flow_id");

    OpenNebula.Service.recover({
      data : {
        id: flow_id
      },
      success: function(request, response){
        update_provision_flow_info(flow_id, context);
      },
      error: onError
    })
  });

  context.on("click", ".provision_shutdown_button", function(){
    var flow_id = $(".provision_info_flow", context).attr("flow_id");

    OpenNebula.Service.shutdown({
      data : {
        id: flow_id
      },
      success: function(request, response){
        update_provision_flow_info(flow_id, context);
      },
      error: onError
    })
  });

  context.on("click", ".provision_delete_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var flow_id = $(".provision_info_flow", context).attr("flow_id");

    OpenNebula.Service.del({
      data : {
        id: flow_id
      },
      success: function(request, response){
        $(".provision_back", context).click();
        $(".provision_flows_list_refresh_button", context).click();
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })
  });

  context.on("click", ".provision_refresh_info", function(){
    var flow_id = $(".provision_info_flow", context).attr("flow_id");
    var role_id = $(".provision_info_flow", context).data("role_id");
    update_provision_flow_info(flow_id, context, role_id);
    //$(".provision_flows_list_refresh_button", $(".provision_flows_list_section")).trigger("click");
    return false;
  });

  //
  // Info Flow
  //

  $(".provision_list_flows", context).on("click", ".provision_info_flow_button", function(){
    $("a.provision_show_flow_accordion", context).trigger("click");

    var flow_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
    update_provision_flow_info(flow_id, context);
    return false;
  })
}

function setup_provision_flows_list(context, opts){
  //
  // List Flows
  //

  provision_flows_datatable = $('.provision_flows_table', context).dataTable({
    "iDisplayLength": 6,
    "sDom" : '<"H">t<"F"lp>',
    "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
    "aaSorting"  : [[0, "desc"]],
    "aoColumnDefs": [
        { "bVisible": false, "aTargets": ["all"]}
    ],
    "aoColumns": [
        { "mDataProp": "DOCUMENT.ID" },
        { "mDataProp": "DOCUMENT.NAME" },
        { "mDataProp": "DOCUMENT.UID" }
    ],
    "fnPreDrawCallback": function (oSettings) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (this.$('tr', {"filter": "applied"} ).length == 0) {
        this.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("Looks like you don't have any Service. Click the button below to get started")+
          '</span>'+
          '<br>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-6 large-centered columns">'+
              '<a href"#" class="medium large-12 button radius provision_create_flow_button"">'+tr("Create a new Service")+'</a>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<br>'+
          '</div>');
      } else {
        $(".provision_flows_table", context).html('<ul class="provision_flows_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
      }

      return true;
    },
    "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
      var data = aData.DOCUMENT;
      var body = data.TEMPLATE.BODY;
      var state = get_provision_flow_state(body);
      var start_time = get_provision_flow_start_time(body);

      var roles_li = "";
      if (body.roles) {
        $.each(body.roles, function(index, role) {
          var role_state = get_provision_flow_state(role);
          var rvms = {
            str : (role.nodes ? role.nodes.length : 0) + " / " + role.cardinality ,
            percentage : Math.floor((role.nodes ? role.nodes.length : 0) / role.cardinality)*100
          }

          roles_li +=
            '<li class="provision-bullet-item text-left" style="padding-top:0px; margin-left: 10px;">'+
              '<i class="fa fa-fw fa-cube"/>&emsp;'+
              role.name+
            '</li>'+
            '<li class="provision-bullet-item text-left" style="padding-top: 5px; margin-left: 10px; margin-right: 10px">'+
              '<div class="progress small radius" style="margin-bottom:0px">'+
              '  <span class="meter" style="width: '+rvms.percentage+'%;"></span>'+
              '</div>'+
            '</li>'+
            '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px; font-size: 11px">'+
              //'<span class="'+ state.color +'-color">'+
              //  state.str+
              //'</span>'+
              '<span class="right">'+rvms.str+" VMs</span>"+
            '</li>';
        });
      }

      $(".provision_flows_ul", context).append('<li>'+
          '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
            '<li class="provision-title text-left" style="padding-bottom: 0px">'+
              '<a class="provision_info_flow_button" style="color:#333" href="#">'+ data.NAME + '</a>'+
              '<a class="provision_info_flow_button right" style="color:#555;" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/></a>'+
            '</li>'+
            '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; margin-bottom:10px; padding-bottom:10px;">'+
              '<span class="'+ state.color +'-color left">'+
                '<i class="fa fa-fw fa-square"/>&emsp;'+
                state.str+
              '</span>'+
            '</li>'+
            roles_li +
            '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; margin-top:15px; padding-bottom:10px">'+
              '<span class="left">'+
                '<i class="fa fa-fw fa-user"/>&emsp;'+
                data.UNAME+
              '</span>'+
              '<span style="font-size:12px; color: #999; padding-bottom:10px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                (start_time ? _format_date(start_time) : '-') +
              '</span>'+
            '</li>'+
          '</ul>'+
        '</li>');

      return nRow;
    }
  });

  $('.provision_list_flows_search', context).keyup(function(){
    provision_flows_datatable.fnFilter( $(this).val() );
  })

  $('.provision_list_flows_search', context).change(function(){
    provision_flows_datatable.fnFilter( $(this).val() );
  })

  context.on("click", ".provision_flows_list_refresh_button", function(){
    OpenNebula.Helper.clear_cache("SERVICE");
    update_provision_flows_datatable(provision_flows_datatable, 0);
    return false;
  });

  context.on("click", ".provision_flows_list_search_button", function(){
    $(".provision_list_flows_search", context).fadeIn();
  });

  $(".provision_list_flows_filter", context).on("change", ".resource_list_select", function(){
    if ($(this).val() != "-2"){
      provision_flows_datatable.fnFilter("^" + $(this).val() + "$", 2, true, false);
    } else {
      provision_flows_datatable.fnFilterClear();
    }
  })

  insertSelectOptions(
    ".provision_list_flows_filter",
    context,
    "User",
    (opts.filter_expression ? opts.filter_expression : "-2"),
    false,
    '<option value="-2">'+tr("ALL")+'</option>',
    null,
    null,
    true,
    true);

  context.on("click", ".provision_flows_list_filter_button", function(){
    $(".provision_list_flows_filter", context).fadeIn();
    return false;
  });

  OpenNebula.Helper.clear_cache("SERVICE");
  update_provision_flows_datatable(provision_flows_datatable, 0);

  $(document).foundation();
}

function generate_provision_flows_list(context, opts) {
  context.off();
  context.html(provision_list_flows(opts));
  setup_provision_flows_list(context, opts);
  setup_info_flow(context);
}

function setup_provision_user_info(context) {
  function update_provision_vdc_user_info(user_id, context) {
    $(".provision_info_vdc_user_name", context).text("");
    $(".provision_vdc_info_container", context).html("");
    $(".provision_info_vdc_user", context).hide();
    $(".provision_info_vdc_user_loading", context).fadeIn();

    OpenNebula.User.show({
      data : {
        id: user_id
      },
      error: onError,
      success: function(request, response){
        var data = response.USER

        $(".provision_vdc_user_confirm_action",context).html("");
        $(".provision_info_vdc_user_acct",context).html("");

        $(".provision_info_vdc_user", context).attr("opennebula_id", data.ID);
        $(".provision_info_vdc_user", context).attr("uname", data.NAME);
        $(".provision_info_vdc_user", context).attr("quotas", JSON.stringify(data.VM_QUOTA));
        $(".provision_info_vdc_user_name", context).text(data.NAME);

        $(".provision-pricing-table_user_info", context).html("");

        initEmptyQuotas(data);

        if (!$.isEmptyObject(data.VM_QUOTA)){
            var default_user_quotas = Quotas.default_quotas(data.DEFAULT_USER_QUOTAS);
            quotas = quotaBarFloat(
                data.VM_QUOTA.VM.VMS_USED,
                data.VM_QUOTA.VM.VMS,
                default_user_quotas.VM_QUOTA.VM.VMS,
                true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
              tr("Running VMs")+
              '<span class="right">'+quotas.str+"</span>"+
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
              '<div class="progress small radius" style="background: #f7f7f7">'+
              '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
              '</div>'+
            '</li>');

            quotas = quotaBarFloat(
                data.VM_QUOTA.VM.CPU_USED,
                data.VM_QUOTA.VM.CPU,
                default_user_quotas.VM_QUOTA.VM.CPU,
                true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
              tr("CPU")+
              '<span class="right">'+quotas.str+"</span>"+
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
              '<div class="progress small radius" style="background: #f7f7f7">'+
              '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
              '</div>'+
            '</li>');

            quotas = quotaBarMB(
                data.VM_QUOTA.VM.MEMORY_USED,
                data.VM_QUOTA.VM.MEMORY,
                default_user_quotas.VM_QUOTA.VM.MEMORY,
                true);

            $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
              tr("Memory")+
              '<span class="right">'+quotas.str+"</span>"+
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
              '<div class="progress small radius" style="background: #f7f7f7">'+
              '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
              '</div>'+
            '</li>');
        } else {
          quotas = quotaBarFloat(0, 0, null, true);

          $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
            tr("Running VMs")+
            '<span class="right">'+quotas.str+"</span>"+
          '</li>'+
          '<li class="provision-bullet-item text-left">'+
            '<div class="progress small radius" style="background: #f7f7f7">'+
            '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
            '</div>'+
          '</li>');

          quotas = quotaBarFloat(0, 0, null, true);

          $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
            tr("CPU")+
            '<span class="right">'+quotas.str+"</span>"+
          '</li>'+
          '<li class="provision-bullet-item text-left">'+
            '<div class="progress small radius" style="background: #f7f7f7">'+
            '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
            '</div>'+
          '</li>');

          quotas = quotaBarMB(0, 0, null, true);

          $(".provision-pricing-table_user_info", context).append('<li class="provision-bullet-item text-left">'+
            tr("Memory")+
            '<span class="right">'+quotas.str+"</span>"+
          '</li>'+
          '<li class="provision-bullet-item text-left">'+
            '<div class="progress small radius" style="background: #f7f7f7">'+
            '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
            '</div>'+
          '</li>');
        }

        $(".provision-pricing-table_user_info", context).append(
            '<li class="text-left provision-bullet-item">'+
              '<hr style="margin: 0px">'+
            '</li>'+
            '<li class="provision-bullet-item ">'+
              '<span class="provision_vdc_user_info_show_vms button medium radius" data-tooltip title="'+tr("User Virtual Machines")+'" style="margin-right: 10px">'+
                '<i class="fa fa-th fa-lg"></i>'+
              '</span>'+
              '<span class="provision_vdc_user_info_show_templates button medium radius" data-tooltip title="'+tr("User Saved Templates")+'" style="margin-right: 10px">'+
                '<i class="fa fa-save fa-lg"></i>'+
              '</span>'+
              '<span class="provision_vdc_user_info_show_flows button medium radius" data-tooltip title="'+tr("User Services")+'" style="margin-right: 10px">'+
                '<i class="fa fa-cubes fa-lg"></i>'+
              '</span>'+
              '<span class="provision_vdc_user_info_show_acct button medium radius" data-tooltip title="'+tr("User Accounting")+'" style="margin-right: 10px">'+
                '<i class="fa fa-bar-chart-o fa-lg"></i>'+
              '</span>'+
              (Config.isFeatureEnabled("showback") ? '<span class="provision_vdc_user_info_show_showback button medium radius" data-tooltip title="'+tr("User Showback")+'" style="margin-right: 10px">'+
                '<i class="fa fa-money fa-lg"></i>'+
              '</span>' : '') +
            '</li>'+
            '<li class="provision-bullet-item text-left">'+
            '</li>')

        var start_time =  Math.floor(new Date().getTime() / 1000);
        // ms to s

        // 604800 = 7 days = 7*24*60*60
        start_time = start_time - 604800;

        // today
        var end_time = -1;

        var options = {
          "start_time": start_time,
          "end_time": end_time,
          "userfilter": user_id
        }

        var no_table = true;

        OpenNebula.VM.accounting({
            success: function(req, response){
                fillAccounting($(".dashboard_vm_accounting", context), req, response, no_table);
            },
            error: onError,
            data: options
        });

        $(".provision_info_vdc_user", context).show();
        $(".provision_info_vdc_user_loading", context).hide();

        $(document).foundation();
        //$("#provision_info_vdc_quotas").html(quotas_html);
      }
    })
  }
  //
  // Info User
  //

  $(".provision_list_users", context).on("click", ".provision_info_user_button", function(){
    $("a.provision_show_user_accordion", context).trigger("click");
    // TODO loading

    var user_id = $(this).parents(".provision-pricing-table").attr("opennebula_id")
    update_provision_vdc_user_info(user_id, context);
  })

  context.on("click", ".provision_vdc_user_info_show_vms", function(){
    $(".provision_vdc_info_container", context).html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
      '</span>'+
      '</div>');

    generate_provision_vms_list(
      $(".provision_vdc_info_container", context),
      {
        title:  $(".provision_info_vdc_user", context).attr("uname") + ' ' + tr("VMs"),
        active: true,
        refresh: true,
        create: false,
        filter: false,
        filter_expression:  $(".provision_info_vdc_user", context).attr("opennebula_id")
      });
  })

  context.on("click", ".provision_vdc_user_info_show_templates", function(){
    $(".provision_vdc_info_container", context).html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
      '</span>'+
      '</div>');

    generate_provision_templates_list(
      $(".provision_vdc_info_container", context),
      {
        title:  $(".provision_info_vdc_user", context).attr("uname") + ' ' + tr("Templates"),
        active: true,
        refresh: true,
        create: false,
        filter: false,
        filter_expression:  $(".provision_info_vdc_user", context).attr("opennebula_id")
      });
  })

  context.on("click", ".provision_vdc_user_info_show_flows", function(){
    $(".provision_vdc_info_container", context).html('<div class="text-center">'+
      '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
        '<i class="fa fa-cloud fa-stack-2x"></i>'+
        '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
      '</span>'+
      '<br>'+
      '<br>'+
      '<span style="font-size: 18px; color: #999">'+
      '</span>'+
      '</div>');

    generate_provision_flows_list(
      $(".provision_vdc_info_container", context),
      {
        title:  $(".provision_info_vdc_user", context).attr("uname") + ' ' + tr("Services"),
        active: true,
        refresh: true,
        create: false,
        filter: false,
        filter_expression:  $(".provision_info_vdc_user", context).attr("opennebula_id")
      });
  })


  context.on("click", ".provision_vdc_user_info_show_acct", function(){
    $(".provision_vdc_info_container", context).html("");

    accountingGraphs(
      $(".provision_vdc_info_container", context),
        { fixed_user: $(".provision_info_vdc_user", context).attr("opennebula_id"),
          init_group_by: "vm" });

    $(".provision_vdc_info_container", context).prepend(
      '<h2 class="subheader">'+
        $(".provision_info_vdc_user", context).attr("uname") + ' ' + tr("Accounting")+
      '</h2>')
  })

  if (Config.isFeatureEnabled("showback")) { 
    context.on("click", ".provision_vdc_user_info_show_showback", function(){
      $(".provision_vdc_info_container", context).html("");

      showbackGraphs(
        $(".provision_vdc_info_container", context),
          { fixed_user: $(".provision_info_vdc_user", context).attr("opennebula_id")});

      $(".provision_vdc_info_container", context).prepend(
        '<h2 class="subheader">'+
          $(".provision_info_vdc_user", context).attr("uname") + ' ' + tr("Showback")+
        '</h2>')
    })
  };

  context.on("click", ".provision_vdc_user_delete_confirm_button", function(){
    $(".provision_vdc_user_confirm_action", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              tr("Be careful, this action will inmediately remove the User from OpenNebula")+
            '</span>'+
          '</div>'+
        '</div>'+
        '<br>'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<a href"#" class="provision_delete_button alert button large-12 large radius">'+tr("Delete User")+'</a>'+
          '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');
  });

  context.on("click", ".provision_vdc_user_password_confirm_button", function(){
    $(".provision_vdc_user_confirm_action", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<input type="password" class="provision_vdc_user_new_password provision-input" placeholder="'+tr("New Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<input type="password" class="provision_vdc_user_new_confirm_password provision-input" placeholder="'+tr("Confirm Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
            '<br>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<button href"#" type="submit" class="provision_vdc_user_change_password_button button success large radius large-12 small-12">'+tr("Update Password")+'</button>'+
          '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');

      context.on("click", ".provision_vdc_user_change_password_button", function(){
        var button = $(this);
        button.attr("disabled", "disabled");
        var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
        var pw = $('.provision_vdc_user_new_password', context).val();
        var confirm_password = $('.provision_vdc_user_new_confirm_password', context).val();

        if (!pw.length){
            notifyError(tr("Fill in a new password"));
            return false;
        }

        if (pw !== confirm_password){
            notifyError(tr("Passwords do not match"));
            return false;
        }

        OpenNebula.User.passwd({
          data : {
            id: user_id,
            extra_param: pw
          },
          success: function(request, response){
            update_provision_vdc_user_info(user_id, context);
            button.removeAttr("disabled");
          },
          error: function(request, response){
            onError(request, response);
            button.removeAttr("disabled");
          }
        })
        return false;
      });
  });



  context.on("click", ".provision_vdc_user_quota_confirm_button", function(){
    $(".provision_vdc_user_confirm_action", context).html(
      '<div data-alert class="alert-box secondary radius">'+
        provision_quota_widget+
        '<br>'+
        '<br>'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
            '<a href"#" class="provision_update_quota_button success large button large-12 radius" style="margin-right: 15px">'+tr("Update User Quota")+'</a>'+
          '</div>'+
        '</div>'+
        '<a href="#" class="close" style="top: 20px">&times;</a>'+
      '</div>');

      setup_provision_quota_widget(context);

      $(document).foundation();

      var quotas_str = $(".provision_info_vdc_user", context).attr("quotas");
      if (quotas_str) {
        var quotas = JSON.parse(quotas_str);

        var vms_limit = QUOTA_LIMIT_DEFAULT;
        var cpu_limit = QUOTA_LIMIT_DEFAULT;
        var mem_limit = QUOTA_LIMIT_DEFAULT;

        if ( quotas.VM != undefined ){
          vms_limit = quotas.VM.VMS;
          cpu_limit = quotas.VM.CPU;
          mem_limit = quotas.VM.MEMORY;

          if(mem_limit != QUOTA_LIMIT_UNLIMITED &&
             mem_limit != QUOTA_LIMIT_DEFAULT){

            mem_limit = quotas.VM.MEMORY/1024;
          }
        }

        var fill_limits = function(limit, select, input){
          switch(limit){
            case QUOTA_LIMIT_DEFAULT:
              select.val('default').change();
              input.val('').change();
              break;

            case QUOTA_LIMIT_UNLIMITED:
              select.val('unlimited').change();
              input.val('').change();
              break;

            default:
              select.val('edit').change();
              input.val(limit).change();
          }
        }

        fill_limits(
          vms_limit,
          $("div.provision_rvms_quota select.provision_quota_select", context),
          $(".provision_rvms_quota_input", context) );

        fill_limits(
          cpu_limit,
          $("div.provision_cpu_quota select.provision_quota_select", context),
          $(".provision_cpu_quota_input", context) );

        fill_limits(
          mem_limit,
          $("div.provision_memory_quota select.provision_quota_select", context),
          $(".provision_memory_quota_tmp_input", context) );
      }
  });

  context.on("click", ".provision_delete_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
    OpenNebula.User.del({
      data : {
        id: user_id
      },
      success: function(request, response){
        $(".provision_back", context).click();
        $(".provision_users_list_refresh_button", context).click();
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })
  });

  context.on("click", ".provision_update_quota_button", function(){
    var button = $(this);
    button.attr("disabled", "disabled");
    var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");

    quota_json = retrieve_provision_quota_widget(context);

    OpenNebula.User.set_quota({
      data : {
        id: user_id,
        extra_param: quota_json
      },
      success: function(request, response){
        update_provision_vdc_user_info(user_id, context);
        button.removeAttr("disabled");
      },
      error: function(request, response){
        onError(request, response);
        button.removeAttr("disabled");
      }
    })
  });

  context.on("click", ".provision_refresh_info", function(){
    var user_id = $(".provision_info_vdc_user", context).attr("opennebula_id");
    update_provision_vdc_user_info(user_id, context);
    return false;
  });
}

function setup_provision_users_list(context){
  var provision_users_datatable = $('.provision_users_table', context).dataTable({
    "iDisplayLength": 6,
    "sDom" : '<"H">t<"F"lp>',
    "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
    "aaSorting"  : [[0, "desc"]],
    "aoColumnDefs": [
        { "bVisible": false, "aTargets": ["all"]}
    ],
    "aoColumns": [
        { "mDataProp": "USER.ID" },
        { "mDataProp": "USER.NAME" }
    ],
    "fnPreDrawCallback": function (oSettings) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (this.$('tr', {"filter": "applied"} ).length == 0) {
        this.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("The list of users is empty")+
          '</span>'+
          '</div>');
      } else {
        $(".provision_users_table", context).html('<ul class="provision_users_ul large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
      }

      return true;
    },
    "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
      var data = aData.USER;
      //var state = get_provision_vm_state(data);
      var vms = "";
      var memory = "";
      var cpu = "";

      // Inject the VM user quota. This info is returned separately in the
      // pool info call, but the userElementArray expects it inside the USER,
      // as it is returned by the individual info call
      var q = provision_quotas_list[data.ID];

      var quotas_html;

      if (q != undefined){
          var quota = q.QUOTAS;

          if ($.isEmptyObject(quota.VM_QUOTA)){
            var limit = (data.ID != 0 ? QUOTA_LIMIT_DEFAULT : QUOTA_LIMIT_UNLIMITED);

            quota.VM_QUOTA = {
              VM: {
                VMS         : limit,
                VMS_USED    : 0,
                CPU         : limit,
                CPU_USED    : 0,
                MEMORY      : limit,
                MEMORY_USED : 0
              }
            }
          }

          if (!$.isEmptyObject(quota.VM_QUOTA)){
              quotas = quotaBarFloat(
                  quota.VM_QUOTA.VM.VMS_USED,
                  quota.VM_QUOTA.VM.VMS,
                  default_user_quotas.VM_QUOTA.VM.VMS,
                  true);

              quotas_html = "";
              quotas_html += '<li class="provision-bullet-item text-left" style="margin-top:5px; margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                tr("Running VMs")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>';

              quotas = quotaBarFloat(
                  quota.VM_QUOTA.VM.CPU_USED,
                  quota.VM_QUOTA.VM.CPU,
                  default_user_quotas.VM_QUOTA.VM.CPU,
                  true);

              quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                tr("CPU")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>';

              quotas = quotaBarMB(
                  quota.VM_QUOTA.VM.MEMORY_USED,
                  quota.VM_QUOTA.VM.MEMORY,
                  default_user_quotas.VM_QUOTA.VM.MEMORY,
                  true);

              quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                tr("Memory")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>';
          } else {
              quotas = quotaBarFloat(0, 0, null, true);

              quotas_html = "";
              quotas_html += '<li class="provision-bullet-item text-left" style="margin-top:5px; margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                tr("Running VMs")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>';

              quotas = quotaBarFloat(0, 0, null, true);

              quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                tr("CPU")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>';

              quotas = quotaBarMB(0, 0, null, true);

              quotas_html += '<li class="provision-bullet-item text-left" style="margin-left: 10px; margin-right: 10px; font-size: 12px">'+
                tr("Memory")+
                '<span class="right">'+quotas.str+"</span>"+
              '</li>'+
              '<li class="provision-bullet-item text-left" style="padding-top: 0px; margin-left: 10px; margin-right: 10px">'+
                '<div class="progress small radius">'+
                '  <span class="meter" style="width: '+quotas.percentage+'%;"></span>'+
                '</div>'+
              '</li>';
            }
      }


      $(".provision_users_ul", context).append('<li>'+
          '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
            '<li class="provision-title text-left" style="padding-bottom: 10px">'+
              '<a class="provision_info_user_button" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/>'+ data.NAME + '</a>'+
            '</li>'+
              quotas_html +
          '</ul>'+
        '</li>');

      return nRow;
    }
  });


  $('.provision_list_users_search', context).keyup(function(){
    provision_users_datatable.fnFilter( $(this).val() );
  })

  $('.provision_list_users_search', context).change(function(){
    provision_users_datatable.fnFilter( $(this).val() );
  })

  context.on("click", ".provision_users_list_refresh_button", function(){
    OpenNebula.Helper.clear_cache("USER");
    update_provision_users_datatable(provision_users_datatable, 0);
    return false;
  });

  $(document).foundation();
}

function generate_provision_users_list(context, opts) {
  context.off();
  context.html(provision_list_users(opts));
  setup_provision_users_list(context);
  setup_provision_user_info(context);
}

// Closes and resets the create user wizard
function clear_provision_create_user(){
  OpenNebula.Helper.clear_cache("USER");
  show_provision_user_list(0);

  var context = $("#provision_create_user");
  $("#username", context).val('');
  $("#password", context).val('');
  $("#repeat_password", context).val('');

  reset_provision_quota_widget(context);

  $(".alert-box-error", context).hide();
  $(".alert-box-error", context).html("");
}

$(document).ready(function(){
  var tab_name = 'provision-tab';
  var tab = $("#"+tab_name);

  if (Config.isTabEnabled(tab_name)) {
    $('body').prepend(
      '<div style="background: #f7f7f7; border-bottom: 1px solid #dfdfdf; padding: 15px 0px 10px 0px; margin-bottom: 10px">'+
        '<div class="row">'+
          '<div class="large-10 large-centered columns">'+
          provision_header+
          '</div>'+
        '</div>'+
      '<div>')

    $(".left-content").remove();
    $(".right-content").addClass("large-centered small-centered");
    $("#footer").removeClass("right");
    $("#footer").addClass("large-centered small-centered");

    $(".user-zone-info").remove();

    showTab('provision-tab');

    $("#provision_logout").click(function(){
        OpenNebula.Auth.logout({
          success: function(){
            window.location.href = "login";
          }
        });

        return false;
    });

    $(".provision_image_header").on("click", function(){
      show_provision_dashboard();
    })

    generate_provision_vms_list($(".provision_vms_list_section"), {active: true});

    if (Config.isTabPanelEnabled("provision-tab", "templates")) {
      generate_provision_templates_list($(".provision_templates_list_section"), {active: true});
    }

    // TODO check if active
    generate_provision_flows_list($(".provision_flows_list_section"), {active: true});
    generate_provision_users_list($(".provision_users_list_section"), {active: true});

    //
    // Dashboard
    //

    show_provision_dashboard();

    $(document).on("click", ".provision_vms_list_button", function(){
      OpenNebula.Helper.clear_cache("VM");
      show_provision_vm_list(0);
    });

    $(document).on("click", ".provision_templates_list_button", function(){
      OpenNebula.Helper.clear_cache("VMTEMPLATE");
      show_provision_template_list(0);
    });

    $(document).on("click", ".provision_flows_list_button", function(){
      OpenNebula.Helper.clear_cache("SERVICE");
      show_provision_flow_list(0);
    });

    $(document).on("click", ".provision_users_list_button", function(){
      OpenNebula.Helper.clear_cache("USER");
      show_provision_user_list(0);
    });

    //
    // User Info
    //

    $("#provision_user_info_button").on("click", function(){
      show_provision_user_info();
    });

    $("#provision_user_info").on("click", "#provision_user_info_refresh_button", function(){
      show_provision_user_info();
    });

    $.each( config['available_views'], function(id, view) {
      $('select#provision_user_views_select').append('<option value="'+view+'">'+view+'</option>')
    });

    $("#provision_change_password_form").submit(function(){
      var pw = $('#provision_new_password', this).val();
      var confirm_password = $('#provision_new_confirm_password', this).val();

      if (!pw.length){
          notifyError(tr("Fill in a new password"));
          return false;
      }

      if (pw !== confirm_password){
          notifyError(tr("Passwords do not match"));
          return false;
      }

      Sunstone.runAction("Provision.User.passwd", "-1", pw);
      return false;
    });

    $("#provision_add_ssh_key_form").submit(function(){
      var keypair = $('#provision_ssh_key', this).val();

      if (!keypair.length){
          notifyError(tr("You have to provide an SSH key"));
          return false;
      }

      OpenNebula.User.show({
        data : {
            id: "-1"
        },
        success: function(request,user_json){
          var template = user_json.USER.TEMPLATE;

          template["SSH_PUBLIC_KEY"] = keypair;

          template_str = "";
          $.each(template,function(key,value){
            template_str += (key + '=' + '"' + value + '"\n');
          });

          Sunstone.runAction("Provision.User.update_template", "-1", template_str);
        }
      })
      return false;
    });

    $("#provision_change_view_form").submit(function(){
      var view = $('#provision_user_views_select', this).val();

      OpenNebula.User.show({
        data : {
            id: "-1"
        },
        success: function(request,user_json){
          var template = user_json.USER.TEMPLATE;

          template["DEFAULT_VIEW"] = view;

          template_str = "";
          $.each(template,function(key,value){
            template_str += (key + '=' + '"' + value + '"\n');
          });

          var data = OpenNebula.Helper.action('update', {"template_raw" : template_str });

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(){
                window.location.href = ".";
            },
            error: function(response){
            }
          });
        }
      })
      return false;
    });

    $("#provision_change_language_form").submit(function(){
      var lang = $('#provision_new_language', this).val();

      OpenNebula.User.show({
        data : {
            id: "-1"
        },
        success: function(request,user_json){
          var template = user_json.USER.TEMPLATE;

          template["LANG"] = lang;

          template_str = "";
          $.each(template,function(key,value){
            template_str += (key + '=' + '"' + value + '"\n');
          });

          var data = OpenNebula.Helper.action('update', {"template_raw" : template_str });

          $.ajax({
            url: 'config',
            type: "POST",
            dataType: "json",
            data: JSON.stringify(data),
            success: function(){
                window.location.href = ".";
            },
            error: function(response){
            }
          });
        }
      })
      return false;
    });

    //
    // Create VM
    //

    function appendTemplateCard(aData, tableID) {
      var data = aData.VMTEMPLATE;
      var logo;

      if (data.TEMPLATE.LOGO) {
        logo = '<span class="provision-logo" href="#">'+
            '<img  src="'+data.TEMPLATE.LOGO+'">'+
          '</span>';
      } else {
        logo = '<span style="color: #bfbfbf; font-size: 60px;">'+
          '<i class="fa fa-fw fa-file-text-o"/>'+
        '</span>';
      }

      var li = $('<li>'+
          '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
            '<li class="provision-title" title="'+data.NAME+'">'+
              data.NAME+
            '</li>'+
            '<li style="height: 85px" class="provision-bullet-item">'+
              logo +
            '</li>'+
            '<li class="provision-description">'+
              (data.TEMPLATE.DESCRIPTION || '...')+
            '</li>'+
          '</ul>'+
        '</li>').appendTo($("#"+tableID+'_ul'));

      $(".provision-pricing-table", li).data("opennebula", aData);
    }

    function initializeTemplateCards(context, tableID) {
      // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
      if (context.$('tr', {"filter": "applied"} ).length == 0) {
        context.html('<div class="text-center">'+
          '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
            '<i class="fa fa-cloud fa-stack-2x"></i>'+
            '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
          '</span>'+
          '<br>'+
          '<br>'+
          '<span style="font-size: 18px; color: #999">'+
            tr("There are no templates available")+
          '</span>'+
          '</div>');
      } else {
        $('#'+tableID+'_table').html(
          '<ul id="'+tableID+'_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
      }

      return true;
    }

    provision_system_templates_datatable = $('#provision_system_templates_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VMTEMPLATE.ID" },
          { "mDataProp": "VMTEMPLATE.NAME" },
          { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  }
      ],
      "fnPreDrawCallback": function (oSettings) {
        initializeTemplateCards(this, "provision_system_templates")
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        appendTemplateCard(aData, "provision_system_templates");
        return nRow;
      }
    });


    provision_vdc_templates_datatable = $('#provision_vdc_templates_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VMTEMPLATE.ID" },
          { "mDataProp": "VMTEMPLATE.NAME" },
          { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  },
          { "mDataProp": "VMTEMPLATE.PERMISSIONS.GROUP_U" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        initializeTemplateCards(this, "provision_vdc_templates")
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        appendTemplateCard(aData, "provision_vdc_templates");
        return nRow;
      }
    });


    provision_saved_templates_datatable = $('#provision_saved_templates_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "VMTEMPLATE.ID" },
          { "mDataProp": "VMTEMPLATE.NAME" },
          { "mDataProp": "VMTEMPLATE.TEMPLATE.SAVED_TEMPLATE_ID", "sDefaultContent" : "-"  },
          { "mDataProp": "VMTEMPLATE.PERMISSIONS.GROUP_U" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        initializeTemplateCards(this, "provision_saved_templates")
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        appendTemplateCard(aData, "provision_saved_templates");
        return nRow;
      }
    });


    $('#provision_create_template_search').on('keyup',function(){
      provision_system_templates_datatable.fnFilter( $(this).val() );
      provision_saved_templates_datatable.fnFilter( $(this).val() );
      provision_vdc_templates_datatable.fnFilter( $(this).val() );
    })

    $('#provision_create_template_search').on('change',function(){
      provision_system_templates_datatable.fnFilter( $(this).val() );
      provision_saved_templates_datatable.fnFilter( $(this).val() );
      provision_vdc_templates_datatable.fnFilter( $(this).val() );
    })

    $("#provision_create_template_refresh_button").click(function(){
      OpenNebula.Helper.clear_cache("VMTEMPLATE");
      update_provision_templates_datatable(provision_system_templates_datatable);
      update_provision_templates_datatable(provision_saved_templates_datatable);
      update_provision_templates_datatable(provision_vdc_templates_datatable);

    });

    tab.on("click", "#provision_create_vm .provision_select_template .provision-pricing-table.only-one" , function(){
      var create_vm_context = $("#provision_create_vm");

      if ($(this).hasClass("selected")){
        $(".provision_network_selector", create_vm_context).html("");
        $(".provision_capacity_selector", create_vm_context).html("");

        $(".provision_accordion_template .selected_template").hide();
        $(".provision_accordion_template .select_template").show();
      } else {
        var template_id = $(this).attr("opennebula_id");
        var template_json = $(this).data("opennebula");

        var template_nic = template_json.VMTEMPLATE.TEMPLATE.NIC
        var nics = []
        if ($.isArray(template_nic))
            nics = template_nic
        else if (!$.isEmptyObject(template_nic))
            nics = [template_nic]

        $(".provision_accordion_template .selected_template").show();
        $(".provision_accordion_template .select_template").hide();
        $(".provision_accordion_template .selected_template_name").html(template_json.VMTEMPLATE.NAME)
        if (template_json.VMTEMPLATE.TEMPLATE.LOGO) {
          $(".provision_accordion_template .selected_template_logo").html('<img  src="'+template_json.VMTEMPLATE.TEMPLATE.LOGO+'">');
        } else {
          $(".provision_accordion_template .selected_template_logo").html('<i class="fa fa-file-text-o fa-lg"/>&emsp;');
        }

        $(".provision_accordion_template a").first().trigger("click");

        generate_provision_instance_type_accordion(
          $(".provision_capacity_selector", create_vm_context),
          template_json.VMTEMPLATE.TEMPLATE);

        if (Config.provision.create_vm.isEnabled("network_select") && (template_json.VMTEMPLATE.TEMPLATE.SUNSTONE_NETWORK_SELECT != "NO")) {
          generate_provision_network_accordion(
            $(".provision_network_selector", create_vm_context));

          $.each(nics, function(index, nic){
              generate_provision_network_table(
                $(".provision_nic_accordion", create_vm_context),
                nic);
          })
        } else {
          $(".provision_network_selector", create_vm_context).html("");
        }
        
        if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
          generate_custom_attrs(
            $(".provision_custom_attributes_selector", create_vm_context),
            template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS);
        }
      }
    })

    tab.on("click", "#provision_create_vm .provision-pricing-table.only-one" , function(){
      if ($(this).hasClass("selected")){
        $(this).removeClass("selected");
      } else {
        $(".provision-pricing-table", $(this).parents(".large-block-grid-3,.large-block-grid-2")).removeClass("selected")
        $(this).addClass("selected");
      }
    })

    $("#provision_create_vm").submit(function(){
      var context = $(this);

      var vm_name = $("#vm_name", context).val();
      var template_id = $(".tabs-content .content.active .selected", context).attr("opennebula_id");

      var nics = [];
      var nic;
      $(".selected_network", context).each(function(){
        if ($(this).attr("template_nic")) {
          nic = JSON.parse($(this).attr("template_nic"))
        } else if ($(this).attr("opennebula_id")) {
          nic = {
            'network_id': $(this).attr("opennebula_id")
          }
        } else {
          nic = undefined;
        }

        if (nic) {
          nics.push(nic);
        }
      });

      var instance_type = $(".provision_instance_types_ul .selected", context);

      if (!template_id) {
        $(".alert-box-error", context).fadeIn().html(tr("You must select at least a template configuration"));
        return false;
      }

      var extra_info = {
        'vm_name' : vm_name,
        'template': {
        }
      }

      if (nics.length > 0) {
        extra_info.template.nic = nics;
      }

      if (instance_type.length > 0) {
        var instance_typa_data = instance_type.data("opennebula");
        delete instance_typa_data.name;

        $.extend(extra_info.template, instance_typa_data)
      }

      var missing_attr = false;
      var user_inputs_values = {};
      if ($(".provision_custom_attributes", $(this))) {
        $(".provision_custom_attribute", $(".provision_custom_attributes", $(this))).each(function(){
          if (!$(this).val()) {
            $(this).parent("label").css("color", "red");
            missing_attr = true;
          } else {
            $(this).parent("label").css("color", "#777");
            user_inputs_values[$(this).attr("attr_name")] = $(this).val();
          }
        })
      }

      if (missing_attr) {
        $(".alert-box-error", $(this)).fadeIn().html(tr("You have not specified all the Custom Atrributes for this VM"));
        return false;
      }

      if (!$.isEmptyObject(user_inputs_values)) {
         $.extend(extra_info.template, user_inputs_values)
      }

      Sunstone.runAction("Provision.instantiate", template_id, extra_info);
      return false;
    })

    $(document).on("click", ".provision_create_vm_button", function(){
      show_provision_create_vm();
    });


    //
    // Create FLOW
    //

    provision_flow_templates_datatable = $('#provision_flow_templates_table').dataTable({
      "iDisplayLength": 6,
      "sDom" : '<"H">t<"F"lp>',
      "aLengthMenu": [[6, 12, 36, 72], [6, 12, 36, 72]],
      "aaSorting"  : [[1, "asc"]],
      "aoColumnDefs": [
          { "bVisible": false, "aTargets": ["all"]}
      ],
      "aoColumns": [
          { "mDataProp": "DOCUMENT.ID" },
          { "mDataProp": "DOCUMENT.NAME" }
      ],
      "fnPreDrawCallback": function (oSettings) {
        // create a thumbs container if it doesn't exist. put it in the dataTables_scrollbody div
        if (this.$('tr', {"filter": "applied"} ).length == 0) {
          this.html('<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-info-circle fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<br>'+
            '<span style="font-size: 18px; color: #999">'+
              tr("There are no templates available")+
            '</span>'+
            '</div>');
        } else {
          $("#provision_flow_templates_table").html('<ul id="provision_flow_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.DOCUMENT;
        var body = data.TEMPLATE.BODY;
        var logo;

        var roles_li = "";
        if (body.roles) {
          $.each(body.roles, function(index, role) {
            var role_state = get_provision_flow_state(role);

            roles_li +=
              '<li class="provision-bullet-item text-left" style="margin-left: 10px;margin-right: 10px;">'+
                '<i class="fa fa-fw fa-cube"/>&emsp;'+
                role.name+
                '<span class="right">'+role.cardinality+" VMs</span>"+
              '</li>';
          });
        }

        if (body.LOGO) {
          logo = '<span class="provision-logo" href="#">'+
              '<img  src="'+body.LOGO+'">'+
            '</span>';
        } else {
          logo = '<span style="color: #bfbfbf; font-size: 60px;">'+
            '<i class="fa fa-fw fa-cubes"/>'+
          '</span>';
        }

        var li = $('<li>'+
            '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li style="height: 85px" class="provision-bullet-item">'+
                logo +
              '</li>'+
              roles_li +
              '<li class="provision-description" style="padding-top:0px">'+
                (data.TEMPLATE.DESCRIPTION || '')+
              '</li>'+
            '</ul>'+
          '</li>').appendTo($("#provision_flow_templates_ul"));

        $(".provision-pricing-table", li).data("opennebula", aData);

        return nRow;
      }
    });

    $('#provision_create_flow_template_search').on('keyup',function(){
      provision_flow_templates_datatable.fnFilter( $(this).val() );
    })

    $('#provision_create_flow_template_search').on('change',function(){
      provision_flow_templates_datatable.fnFilter( $(this).val() );
    })

    $("#provision_create_flow_template_refresh_button").click(function(){
      OpenNebula.Helper.clear_cache("SERVICE_TEMPLATE");
      update_provision_flow_templates_datatable(provision_flow_templates_datatable);

    });

    tab.on("click", ".provision_select_flow_template .provision-pricing-table.only-one" , function(){
      var context = $("#provision_create_flow");

      if ($(this).hasClass("selected")){
        $("#provision_customize_flow_template").hide();
        $("#provision_customize_flow_template").html("");
        $(".provision_network_selector", context).html("")
        $(".provision_custom_attributes_selector", context).html("")

        $(".provision_accordion_flow_template .selected_template").hide();
        $(".provision_accordion_flow_template .select_template").show();
      } else {
        $("#provision_customize_flow_template").show();
        $("#provision_customize_flow_template").html("");

        var data = $(this).data("opennebula");
        var body = data.DOCUMENT.TEMPLATE.BODY;

        $(".provision_accordion_flow_template .selected_template").show();
        $(".provision_accordion_flow_template .select_template").hide();
        $(".provision_accordion_flow_template .selected_template_name").html(body.name)
        $(".provision_accordion_flow_template .selected_template_logo").html('<i class="fa fa-cubes fa-lg"/>&emsp;');
        $(".provision_accordion_flow_template a").first().trigger("click");

        var context = $("#provision_create_flow");

        if (body.custom_attrs) {
          var network_attrs = [];
          var text_attrs = [];

          $.each(body.custom_attrs, function(key, value){
            var parts = value.split("|");
            // 0 mandatory; 1 type; 2 desc;
            var attrs = {
              "name": key,
              "mandatory": parts[0],
              "type": parts[1],
              "description": parts[2],
            }

            switch (parts[1]) {
              case "vnet_id":
                network_attrs.push(attrs)
                break;
              case "text":
                text_attrs.push(attrs)
                break;
              case "password":
                text_attrs.push(attrs)
                break;
            }
          })

          if (network_attrs.length > 0) {
            generate_provision_network_accordion(
              $(".provision_network_selector", context), true);

            $.each(network_attrs, function(index, vnet_attr){
              generate_provision_network_table(
                $(".provision_nic_accordion", context),
                null,
                vnet_attr);
            });
          }

          //if (text_attrs.length > 0) {
          //  generate_custom_attrs(
          //    $(".provision_custom_attributes_selector", context),
          //    text_attrs);
          //}
        } else {
          $(".provision_network_selector", context).html("")
          $(".provision_custom_attributes_selector", context).html("")
        }

        $.each(body.roles, function(index, role){
          var context = $('<div id="provision_create_flow_role_'+index+'" class="provision_create_flow_role">'+
            '<div class="row">'+
              '<div class="large-10 large-centered columns">'+
                '<h2 class="subheader">'+
                  '<i class="fa fa-cube fa-lg"></i>&emsp;'+
                  role.name+
                '</h2>'+
                '<br>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="provision_cardinality_selector large-9 large-centered columns">'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="provision_custom_attributes_selector large-9 large-centered columns">'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<br>').appendTo($("#provision_customize_flow_template"))

          context.data("opennebula", role);

          var template_id = role.vm_template;
          var role_html_id = "#provision_create_flow_role_"+index;

          OpenNebula.Template.show({
            data : {
                id: template_id
            },
            success: function(request,template_json){
              var role_context = $(role_html_id)

              generate_cardinality_selector(
                $(".provision_cardinality_selector", context),
                role,
                template_json);

              if (template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS) {
                generate_custom_attrs(
                  $(".provision_custom_attributes_selector", role_context),
                  template_json.VMTEMPLATE.TEMPLATE.USER_INPUTS);
              }
            }
          })


        })

        $(document).foundation();
      }
    })

    tab.on("click", "#provision_create_flow .provision-pricing-table.only-one" , function(){
      if ($(this).hasClass("selected")){
        $(this).removeClass("selected");
      } else {
        $(".provision-pricing-table", $(this).parents(".large-block-grid-3,.large-block-grid-2")).removeClass("selected")
        $(this).addClass("selected");
      }
    })

    $("#provision_create_flow").submit(function(){
      var context = $(this);

      var flow_name = $("#flow_name", context).val();
      var template_id = $(".provision_select_flow_template .selected", context).attr("opennebula_id");

      if (!template_id) {
        $(".alert-box-error", context).fadeIn().html(tr("You must select at least a template configuration"));
        return false;
      }

      var custom_attrs = {}
      var missing_network = false;
      if ($(".provision_nic_accordion", context)) {
        $(".selected_network", $(".provision_nic_accordion", context)).each(function(){
          if (!$(this).attr("opennebula_id")) {
            $(this).css("color", "red");
            missing_network = true;
          } else {
            $(this).css("color", "#777");
            custom_attrs[$(this).attr("attr_name")] = $(this).attr("opennebula_id");
          }
        })
      }

      if (missing_network) {
        $(".alert-box-error", context).fadeIn().html(tr("You have not specified all the Networks for this Service"));
        return false;
      }

      var roles = [];
      var missing_attr = false;

      $(".provision_create_flow_role", context).each(function(){
        var user_inputs_values = {};
        if ($(".provision_custom_attributes", $(this))) {
          $(".provision_custom_attribute", $(".provision_custom_attributes", $(this))).each(function(){
            if (!$(this).val()) {
              $(this).parent("label").css("color", "red");
              missing_attr = true;
            } else {
              $(this).parent("label").css("color", "#777");
              user_inputs_values[$(this).attr("attr_name")] = $(this).val();
            }
          })
        }

        var role_template = $(this).data("opennebula");

        $.each(role_template.elasticity_policies, function(i, pol){
            pol.expression = htmlDecode(pol.expression);
        });

        roles.push($.extend(role_template, {
          "cardinality": $(".cardinality_value", $(this)).text(),
          "user_inputs_values": user_inputs_values
        }));
      })

      var extra_info = {
        'merge_template': {
          "name" : flow_name,
          "roles" : roles,
          "custom_attrs_values": custom_attrs
        }
      }

      if (missing_attr) {
        $(".alert-box-error", $(this)).fadeIn().html(tr("You have not specified all the Custom Atrributes for this Service"));
        return false;
      }

      Sunstone.runAction("Provision.Flow.instantiate", template_id, extra_info);
      return false;
    })

    $(".provision_create_flow_button").on("click", function(){
      show_provision_create_flow();
    });

    //
    // VDC Info
    //


    $("#provision_vdc_info_button").on("click", function(){
      OpenNebula.Helper.clear_cache("GROUP");
      show_provision_vdc_info();
    });

    //
    // Create User
    //

    var context = $("#provision_create_user");

    setup_provision_quota_widget(context);

    // Workaround to fix sliders. Apparently the setup fails while they are hidden
    $('a[href="#provision_create_user_manual_quota"]', context).on("click", function(){
      $(".provision_rvms_quota_input", context).change();
      $(".provision_memory_quota_input", context).change();
      $(".provision_memory_quota_tmp_input", context).change();
      $(".provision_cpu_quota_input", context).change();
    });

    $("#provision_create_user").submit(function(){
      var context = $(this);

      var username = $("#username", context).val();
      var password = $("#password", context).val();
      var repeat_password = $("#repeat_password", context).val();

      // TODO driver
      var driver = 'core';

      if (!username.length || !password.length){
        $(".alert-box-error", context).fadeOut();
        $(".alert-box-error", context).fadeIn().html(tr("You have to provide a username and password"));
        return false;
      }

      if (password !== repeat_password){
        $(".alert-box-error", context).fadeOut();
        $(".alert-box-error", context).fadeIn().html(tr("Passwords do not match"));
        return false;
      }

      var user_json = { "user" :
                        { "name" : username,
                          "password" : password,
                          "auth_driver" : driver
                        }
                      };

      Sunstone.runAction("Provision.User.create",user_json);
      $(".alert-box-error", context).html('<div class="text-center">'+
        '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
          '<i class="fa fa-cloud fa-stack-2x"></i>'+
          '<i class="fa  fa-spinner fa-spin fa-stack-1x fa-inverse"></i>'+
        '</span>'+
        '<br>'+
        '<br>'+
        '<span style="font-size: 18px; color: #999">'+
        '</span>'+
        '</div>');

      return false;
    });

    $(document).on("click", ".provision_create_user_button", function(){
      show_provision_create_user();
    });
  }
});
