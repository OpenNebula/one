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

var provision_create_vm = '<form id="provision_create_vm" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        '<i class="fa fa-fw fa-cloud"/>&emsp;'+
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
    '<div class="large-5 large-centered columns">'+
      '<hr>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
          tr("Select Template")+
        '</span>'+
        '<a href"#" id="provision_create_template_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
        '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_create_template_search"/>'+
      '</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-9 large-centered columns">'+
      '<dl class="tabs text-center" data-tab style="width: 100%">'+
        '<dd class="active" style="width: 33%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_system_templates_selector">'+ tr("System") +'</a></dd>'+
        '<dd style="width: 33%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_vdc_templates_selector">'+ tr("VDC") +'</a></dd>'+
        '<dd style="width: 34%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_saved_templates_selector">'+ tr("Saved") +'</a></dd>'+
      '</dl>'+
      '<br>'+
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
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<dl class="accordion" data-accordion>'+
        '<dd>'+
          '<a href="#provision_create_extra_accordion" class="text-center accordion-a">'+
            '<i class="fa fa-edit"></i>&emsp;'+
            tr("Customize")+
          '</a>'+
          '<div id="provision_create_extra_accordion" class="content" style="padding: 0.9375rem 0px;">'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<h3 class="subheader text-right">'+
                  '<span class="left">'+
                    '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                    tr("Change Capacity")+
                  '</span>'+
                  '<a href"#" id="provision_create_instance_types_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip right">'+
                    '<i class="fa fa-fw fa-refresh"/>'+
                  '</a>'+
                  '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_create_instance_types_search"/>'+
                '</h3>'+
                '<br>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-11 large-centered columns">'+
                '<table id="provision_instance_types_table">'+
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
            '<div class="row">'+
              '<div class="large-5 large-centered columns">'+
                '<hr>'+
                '<br>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-12 large-centered columns">'+
                '<h3 class="subheader text-right">'+
                  '<span class="left">'+
                    '<i class="fa fa-fw fa-globe"/>&emsp;'+
                    tr("Select Network")+
                  '</span>'+
                  '<a href"#" id="provision_create_networks_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip right">'+
                    '<i class="fa fa-fw fa-refresh"/>'+
                  '</a>'+
                  '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_create_networks_search"/>'+
                '</h3>'+
                '<br>'+
              '</div>'+
            '</div>'+
            '<br>'+
            '<div class="row">'+
              '<div class="large-11 large-centered columns">'+
                '<table id="provision_networks_table">'+
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
      '</dl>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-6 small-6 large-centered columns">'+
      '<div class="large-5 columns">'+
        '<hr>'+
      '</div>'+
      '<div class="large-2 small-2 text-center columns">'+
        '<p style="color: #999">'+ tr('or') + '</p>'+
      '</div>'+
      '<div class="large-5 small-5 columns">'+
        '<hr>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-7 columns large-centered">'+
      '<div data-alert class="alert-box alert-box-error radius text-center hidden">'+
      '</div>'+
      '<button href="#" class="button large radius large-12 small-12" type="submit" style="height: 59px">'+tr("Create")+'</button>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
'</form>';

var provision_create_user = '<form id="provision_create_user" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader">'+
        '<i class="fa fa-fw fa-user"/>&emsp;'+
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
          '<i class="fa fa-fw fa-align-left"/>&emsp;'+
          tr("Define Quotas")+
        '</span>'+
      '</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<h5 class="subheader text-right">'+
        '<span class="left">'+
          tr("Running VMs")+
        '</span>'+
      '</h5>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<div class="row collapse">'+
        '<div class="large-9 small-9 columns">'+
          '<div id="provision_rvms_quota_slider">'+
          '</div>'+
        '</div>'+
        '<div class="large-2 small-2 columns">'+
          '<input type="text"  class="provision-input" id="provision_rvms_quota_input" style="margin-top: -17px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<h5 class="subheader text-right">'+
        '<span class="left">'+
          tr("CPU")+
        '</span>'+
      '</h5>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<div class="row collapse">'+
        '<div class="large-9 small-9 columns">'+
          '<div id="provision_cpu_quota_slider">'+
          '</div>'+
        '</div>'+
        '<div class="large-2 small-2 columns">'+
          '<input type="text"  class="provision-input" id="provision_cpu_quota_input" style="margin-top: -17px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<h5 class="subheader text-right">'+
        '<span class="left">'+
          tr("Memory (GBs)")+
        '</span>'+
      '</h5>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="vm_param">'+
      '<input type="hidden" id="provision_memory_quota_input"/>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-8 large-centered columns">'+
      '<div class="row collapse">'+
        '<div class="large-9 small-9 columns">'+
          '<div id="provision_memory_quota_slider">'+
          '</div>'+
        '</div>'+
        '<div class="large-2 small-2 columns">'+
          '<input type="text"  class="provision-input" id="provision_memory_quota_tmp_input" style="margin-top: -17px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
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
    '<div class="large-11 large-centered columns">'+
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
    '<div class="large-10 large-centered columns">'+
      '<dl class="tabs text-center" data-tab style="width: 100%">'+
        '<dd class="active" style="width: 25%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_info_ssh_key"><i class="fa fa-fw fa-lg fa-key"/>&emsp;'+ tr("SSH Key") +'</a></dd>'+
        '<dd style="width: 25%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_info_acct"><i class="fa fa-fw fa-lg fa-bar-chart-o"/>&emsp;'+ tr("Accounting") +'</a></dd>'+
        '<dd style="width: 25%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_info_quotas"><i class="fa fa-fw fa-lg fa-align-left"/>&emsp;'+ tr("Quotas") +'</a></dd>'+
        '<dd style="width: 25%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_info_settings"><i class="fa fa-fw fa-lg fa-cogs"/>&emsp;'+ tr("Settings") +'</a></dd>'+
      '</dl>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="tabs-content">'+
    '<div class="content active" id="provision_info_ssh_key">'+
      '<form id="provision_add_ssh_key_form">'+
        '<div class="row">'+
          '<div class="large-8 large-centered columns">'+
            '<div class="text-center">'+
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa fa-key fa-stack-1x fa-inverse"></i>'+
              '</span>'+
              '<br>'+
              '<p style="font-size: 18px; color: #999">'+
                '<span class="provision_add_ssh_key_button">'+
                  tr("Add a public SSH key to your account!")+
                  '<br>'+
                  tr("You will be able to access your Virtual Machines without password")+
                '</span>'+
                '<span class="provision_update_ssh_key_button">'+
                  tr("Update your public SSH key!")+
                  '<br>'+
                  tr("You will be able to access your Virtual Machines without password")+
                  '<br><br>'+
                  '<span id="provision_ssh_key_text" style="text-overflow: ellipsis; word-break: break-all; word-wrap: break-word"></span>'+
                '</span>'+
              '</p>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-8 large-centered columns">'+
            '<dl class="accordion" data-accordion>'+
              '<dd >'+
                '<a href="#provision_add_ssh_key_accordion" class="text-center accordion-a">'+
                  '<span class="provision_add_ssh_key_button">'+ tr("Add SSH Key")+ '</span>'+
                  '<span class="provision_update_ssh_key_button">'+ tr("Update SSH Key")+ '</span>'+
                '</a>'+
                '<div id="provision_add_ssh_key_accordion" class="content">'+
                  '<div class="row">'+
                    '<div class="large-12 large-centered columns">'+
                      '<textarea id="provision_ssh_key" style="height: 100px; font-size: 16px" placeholder="SSH key" class="provision-input"></textarea>'+
                    '</div>'+
                  '</div>'+
                  '<br>'+
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
    '<div class="content" id="provision_info_acct">'+
      '<div class="row">'+
        '<div id="provision_user_info_acct_div" class="large-9 large-centered columns">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="content" id="provision_info_quotas">'+
      '<div class="row">'+
        '<div id="provision_user_info_quotas_div" class="large-9 large-centered columns">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="content" id="provision_info_settings">'+
      '<div class="row">'+
        '<div class="large-8 large-centered columns">'+
          '<div class="text-center">'+
            '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
              '<i class="fa fa-cloud fa-stack-2x"></i>'+
              '<i class="fa fa-comments fa-stack-1x fa-inverse"></i>'+
            '</span>'+
            '<br>'+
            '<p style="font-size: 18px; color: #999">'+
              tr("Portal not in your native language?")+
            '</p>'+
          '</div>'+
        '</div>'+
      '</div>'+
        '<div class="row">'+
          '<div class="large-8 large-centered columns">'+
            '<dl class="accordion" data-accordion>'+
              '<dd>'+
                '<a href="#provision_update_language_accordion" class="text-center accordion-a">'+
                  '<i class="fa fa-comments"></i>&emsp;'+
                  tr("Change Language")+
                '</a>'+
                '<div id="provision_update_language_accordion" class="content">'+
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
        '<br>'+
        '<br>'+
        '<div class="row">'+
          '<div class="large-12 large-centered columns">'+
            '<div class="text-center">'+
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa fa-lock fa-stack-1x fa-inverse"></i>'+
              '</span>'+
              '<br>'+
              '<p style="font-size: 18px; color: #999">'+
                tr("Someone might have been eavesdropping?")+
              '</p>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-8 large-centered columns">'+
            '<dl class="accordion" data-accordion>'+
              '<dd>'+
                '<a href="#provision_update_password_accordion" class="text-center accordion-a">'+
                  '<i class="fa fa-lock"></i>&emsp;'+
                  tr("Change Password")+
                '</a>'+
                '<div id="provision_update_password_accordion" class="content">'+
                  '<form id="provision_change_password_form">'+
                    '<div class="row">'+
                      '<div class="large-12 columns">'+
                        '<input type="password" id="provision_new_password" class="provision-input" placeholder="'+tr("New Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                      '</div>'+
                    '</div>'+
                    '<div class="row">'+
                      '<div class="large-12 columns">'+
                        '<input type="password" id="provision_new_confirm_password" class="provision-input" placeholder="'+tr("Confirm Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                        '<br>'+
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
        '<br>'+
        '<br>'+
        '<div class="row">'+
          '<div class="large-8 large-centered columns">'+
            '<div class="text-center">'+
              '<span class="fa-stack fa-5x" style="color: #dfdfdf">'+
                '<i class="fa fa-cloud fa-stack-2x"></i>'+
                '<i class="fa fa-picture-o fa-stack-1x fa-inverse"></i>'+
              '</span>'+
              '<br>'+
              '<p style="font-size: 18px; color: #999">'+
                tr("Are you an administrator?")+
              '</p>'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-8 large-centered columns">'+
            '<dl class="accordion" data-accordion>'+
              '<dd>'+
                '<a href="#provision_update_view_accordion" class="text-center accordion-a">'+
                  '<i class="fa fa-picture-o"></i>&emsp;'+
                  tr("Change view")+
                '</a>'+
                '<div id="provision_update_view_accordion" class="content">'+
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
  '</div>'+
'</div>';

var provision_list_users = '<div id="provision_list_users">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-users"/>&emsp;'+
          tr("Users")+
        '</span>'+
        '<a href"#" id="provision_users_list_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip tip-top right">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
        '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_list_users_search"/>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns" id="provision_confirm_delete_user_div">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<table id="provision_users_table">'+
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
'</div>';


var provision_manage_vdc = '<div id="provision_manage_vdc" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<dl class="tabs text-center" data-tab style="width: 100%">'+
        '<dd class="active" style="width: 33%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_vdc_users"><i class="fa fa-fw fa-lg fa-users"/>&emsp;'+ tr("VDC Users") +'</a></dd>'+
        '<dd style="width: 33%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_vdc_quotas"><i class="fa fa-fw fa-lg fa-align-left"/>&emsp;'+ tr("VDC Quotas") +'</a></dd>'+
        '<dd style="width: 33%;box-shadow: 0px 1px #dfdfdf;"><a href="#provision_vdc_acct"><i class="fa fa-fw fa-lg fa-bar-chart-o"/>&emsp;'+ tr("VDC Accounting") +'</a></dd>'+
      '</dl>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<div class="tabs-content">'+
    '<div class="content active" id="provision_vdc_users">'+
      provision_list_users+
    '</div>'+
    '<div class="content" id="provision_vdc_quotas">'+
      '<div class="row">'+
        '<div class="large-11 large-centered columns">'+
          '<h2 class="subheader text-right">'+
            '<span class="left">'+
              '<i class="fa fa-fw fa-align-left"/>&emsp;'+
              tr("VDC Quotas")+
            '</span>'+
          '</h2>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div class="large-10 columns large-centered" id="provision_vdc_quotas_div">'+
        '</div>'+
      '</div>'+
    '</div>'+
    '<div class="content" id="provision_vdc_acct">'+
      '<div class="row">'+
        '<div class="large-11 large-centered columns">'+
          '<h2 class="subheader text-right">'+
            '<span class="left">'+
              '<i class="fa fa-fw fa-bar-chart-o"/>&emsp;'+
              tr("VDC Accounting")+
            '</span>'+
          '</h2>'+
        '</div>'+
      '</div>'+
      '<br>'+
      '<div class="row">'+
        '<div  id="provision_info_vdc_group_acct" class="large-10 large-centered columns">'+
        '</div>'+
      '</div>'+
    '</div>'+
  '</div>'+
'</div>';

var provision_list_templates = '<div id="provision_list_templates" class="hidden section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-save"/>&emsp;'+
          tr("Saved Templates")+
        '</span>'+
        '<a href"#" id="provision_templates_list_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
        '<span id="provision_list_templates_filter" style="display: none"/></span>'+
        '<a href"#" id="provision_templates_list_filter_button" data-tooltip title="'+ tr("Filter by User")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-filter"/>'+
        '</a>'+
        '<span>'+
        '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_list_templates_search" style="display: none"/>'+
        '</span>'+
        '<a href"#" id="provision_templates_list_search_button" data-tooltip title="'+ tr("Search")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-search"/>'+
        '</a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns" id="provision_confirm_delete_template_div">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<table id="provision_templates_table">'+
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
'</div>';

var provision_list_vms = '<div id="provision_list_vms" class="section_content">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-th"/>&emsp;'+
          tr("Virtual Machines")+
        '</span>'+
        '<a href"#" id="provision_vms_list_refresh_button" data-tooltip title="'+ tr("Refresh")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
        '<span id="provision_list_vms_filter" style="display: none"/></span>'+
        '<a href"#" id="provision_vms_list_filter_button" data-tooltip title="'+ tr("Filter by User")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-filter"/>'+
        '</a>'+
        '<span>'+
        '<input type="search" class="provision-search-input right" placeholder="Search" id="provision_list_vms_search" style="display: none"/>'+
        '</span>'+
        '<a href"#" id="provision_vms_list_search_button" data-tooltip title="'+ tr("Search")+'" class="has-tip right">'+
          '<i class="fa fa-fw fa-search"/>'+
        '</a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<table id="provision_vms_table">'+
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
'</div>';

var provision_info_vdc_user =  '<div id="provision_info_vdc_user" class="section_content hidden">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader text-right">'+
        '<span id="provision_info_vdc_user_name" class="left">'+
        '</span>'+
        '<a href"#" id="provision_refresh_info" data-tooltip title="'+ tr("Refresh")+'" class="has-tip tip-top">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-align-left"/>&emsp;'+
          tr("Quotas")+
        '</span>'+
      '</h3>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div  id="provision_info_vdc_quotas" class="large-9 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-cloud"/>&emsp;'+
          tr("Resources")+
        '</span>'+
      '</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-9 large-centered columns">'+
      '<div class="large-6 columns">'+
        '<a href"#" class="show_vdc_user_vms_button button radius large-12 small-12"><i class="fa fa-fw fa-th"/>&emsp;'+tr("Go to User VMs")+'</a>'+
      '</div>'+
      '<div class="large-6 columns">'+
        '<a href"#" class="show_vdc_user_templates_button button radius large-12 small-12"><i class="fa fa-fw fa-save"/>&emsp;'+tr("Go to User Templates")+'</a>'+
      '</div>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-cogs"/>&emsp;'+
          tr("Actions")+
        '</span>'+
      '</h3>'+
      '<br>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-9 large-centered columns">'+
      '<h2 class="subheader">'+
        '<span class="right" style="padding: 5px;border: 1px solid #efefef; background: #f7f7f7; border-radius: 5px; color:#777 !important; width: 100%; box-shadow: 0px 1px #dfdfdf">'+
          '<div class="row">'+
            '<div class="large-11 large-centered columns" id="provision_vdc_user_confirm_action">'+
            '</div>'+
          '</div>'+
          '<ul class="inline-list text-center" style="font-size:12px; margin-bottom:0px; padding: 5px 10px">'+
            '<li class="right">'+
              '<a href"#" id="provision_vdc_user_delete_confirm_button" data-tooltip title="Delete the User" class="has-tip tip-top right">'+
                '<i class="fa fa-fw fa-2x fa-trash-o"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Delete")+'</span>'+
              '</a>'+
            '</li>'+
            '<li class="">'+
              '<a href"#" id="provision_vdc_user_quota_confirm_button" data-tooltip title="Update the User Quotas" class="has-tip tip-top">'+
                '<i class="fa fa-fw fa-2x fa-align-left"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Quotas")+'</span>'+
              '</a>'+
            '</li>'+
            '<li class="">'+
              '<a href"#" id="provision_vdc_user_password_confirm_button" data-tooltip title="Change the password of the User" class="has-tip tip-top">'+
                '<i class="fa fa-fw fa-2x fa-lock"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Password")+'</span>'+
              '</a>'+
            '</li>'+
          '</ul>'+
        '</span>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h3 class="subheader text-right">'+
        '<span class="left">'+
          '<i class="fa fa-fw fa-bar-chart-o"/>&emsp;'+
          tr("Accounting")+
        '</span>'+
      '</h3>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div  id="provision_info_vdc_user_acct" class="large-9 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<br>'+
'</div>'

var provision_info_vm =  '<div id="provision_info_vm" class="section_content hidden">'+
  '<div class="row">'+
    '<div class="large-11 large-centered columns">'+
      '<h2 class="subheader text-right">'+
        '<span id="provision_info_vm_name" class="left">'+
        '</span>'+
        '<a href"#" id="provision_refresh_info" data-tooltip title="'+ tr("Refresh")+'" class="has-tip tip-top">'+
          '<i class="fa fa-fw fa-refresh"/>'+
        '</a>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
  '<div class="row">'+
    '<div  id="provision_info_vm_state" class="large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div  id="provision_info_vm_state_hr" class="large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div id="provision_info_vm_resume" class="large-10 large-centered columns">'+
    '</div>'+
  '</div>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
  '<div class="row">'+
      '<div class="large-6 medium-6  columns">'+
        '<div class="row text-center">'+
          '<div class="large-12 columns">'+
            '<h3 class="subheader"><small>'+tr("CPU")+'</small></h3>'+
          '</div>'+
        '</div>'+
        '<div class="row">'+
          '<div class="large-12 columns">'+
            '<div class="large-10 columns centered graph vm_cpu_graph" style="height: 100px;">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row graph_legend">'+
          '<div class="large-10 columns centered" id="vm_cpu_legend">'+
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
            '<div class="large-10 columns centered graph vm_memory_graph" style="height: 100px;">'+
            '</div>'+
          '</div>'+
        '</div>'+
        '<div class="row graph_legend">'+
          '<div class="large-10 columns centered" id="vm_memory_legend">'+
          '</div>'+
        '</div>'+
      '</div>'+
  '</div>'+
      '</div>'+
  '</div>'+
  '<br>'+
  '<br>'+
  '<br>'+
  '<div class="row">'+
    '<div class="large-10 large-centered columns">'+
      '<h2 class="subheader">'+
        '<span class="right" style="padding: 5px;border: 1px solid #efefef; background: #f7f7f7; border-radius: 5px; color:#777 !important; width: 100%; box-shadow: 0px 1px #dfdfdf">'+
          '<div class="row">'+
            '<div class="large-11 large-centered columns" id="provision_confirm_action">'+
            '</div>'+
          '</div>'+
          '<ul class="inline-list text-center" style="font-size:12px; margin-bottom:0px; padding: 5px 10px">'+
          '<li>'+
          '<a href"#" id="provision_vnc_button" data-tooltip title="Open a VNC console in a new window" class="has-tip tip-top">'+
            '<i class="fa fa-fw fa-2x fa-desktop"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Console")+'</span>'+
          '</a>'+
          '</li>'+
          '<li>'+
          '<span id="provision_vnc_button_disabled" data-tooltip title="You have to boot the Virtual Machine first" class="has-tip tip-top" style="color: #999">'+
            '<i class="fa fa-fw fa-2x fa-desktop"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Console")+'</span>'+
          '</span>'+
          '</li>'+
          '<li>'+
          '<a href"#" id="provision_snapshot_button" data-tooltip title="The main disk of the Virtual Machine will be saved in a new Image" class="has-tip tip-top">'+
            '<i class="fa fa-fw fa-2x fa-save"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Save VM")+'</span>'+
          '</a>'+
          '</li>'+
          '<li>'+
          '<span id="provision_snapshot_button_disabled" data-tooltip title="You have to power-off the virtual machine first" class="has-tip tip-top" style="margin-left:15px; margin-right:15px; color: #999">'+
            '<i class="fa fa-fw fa-2x fa-save"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Save VM")+'</span>'+
          '</span>'+
          '</li>'+
          '<li class="right">'+
          '<a href"#" id="provision_delete_confirm_button" data-tooltip title="Delete" class="has-tip tip-top right">'+
            '<i class="fa fa-fw fa-2x fa-trash-o"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Delete")+'</span>'+
          '</a>'+
          '</li>'+
          '<li class="right">'+
          '<a href"#" id="provision_shutdownhard_confirm_button" data-tooltip title="Delete" class="has-tip tip-top right">'+
            '<i class="fa fa-fw fa-2x fa-trash-o"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Delete")+'</span>'+
          '</a>'+
          '</li>'+
          '<li class="right">'+
          '<a href"#" id="provision_poweroff_confirm_button" data-tooltip title="Power off" class="has-tip tip-top right">'+
            '<i class="fa fa-fw fa-2x fa-power-off"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Power off")+'</span>'+
          '</a>'+
          '</li>'+
          '<li class="right">'+
          '<a href"#" id="provision_poweron_button" data-tooltip title="Power on" class="has-tip tip-top right">'+
            '<i class="fa fa-fw fa-2x fa-play"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Power on")+'</span>'+
          '</a>'+
          '</li>'+
          '<li class="right">'+
          '<a href"#" id="provision_reboot_confirm_button" data-tooltip title="Reboot" class="has-tip tip-top right">'+
            '<i class="fa fa-fw fa-2x fa-repeat"/><span style="font-size: 12px; vertical-align: middle"><br>'+tr("Reboot")+'</span>'+
          '</a>'+
          '</li>'+
          '</ul>'+
        '</span>'+
      '</h2>'+
    '</div>'+
  '</div>'+
  '<br>'+
'</div>';


var provision_content = provision_user_info +
  provision_create_vm +
  provision_info_vm +
  provision_list_vms +
  provision_list_templates;

if (Config.isTabPanelEnabled("provision-tab", "users")) {
  provision_content += provision_manage_vdc;
  provision_content += provision_create_user;
  provision_content += provision_info_vdc_user;
}

var provision_header = '<img src="images/one_small_logo.png" style="height:40px; vertical-align:top">'+
    '<span class="right" style="font-size: 50%; color: #dfdfdf">'+
   '<ul class="inline-list text-center" style="font-size:12px">'+
    '<li class="left" >'+
        '<a href"#" class="medium button radius provision_create_vm_button" style=" margin-left: 10px;margin-right: 10px;">'+tr('Create VM')+'</a>';


if (Config.isTabPanelEnabled("provision-tab", "users")) {
  provision_header +=
        '<a href"#" class="medium button radius provision_create_user_button" style="display:none; margin-left: 10px;margin-right: 10px;">'+tr('Add User')+'</a>';
}

provision_header +=  '</li>';

if (Config.isTabPanelEnabled("provision-tab", "users")) {
  provision_header +=
    '<li>'+
      '<a href"#" class="medium off-color" id="provision_users_list_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-users"/><br>'+tr("Manage VDC")+'</a>'+
    '</li>'+
    '<li style="border-left: 1px solid #efefef; height: 40px"><br>'+
    '</li>';
}

provision_header +=  '<li>'+
      '<a href"#" class="medium off-color" id="provision_vms_list_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-th"/><br>'+tr("VMs")+'</a>'+
    '</li>'+
    '<li>'+
      '<a href"#" class="medium off-color" id="provision_templates_list_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-save"/><br>'+tr("Templates")+'</a>'+
    '</li>'+
    '<li style="border-left: 1px solid #efefef; height: 40px"><br>'+
    '</li>'+
    '<li>'+
      '<a href"#" class="medium off-color" id="provision_user_info_button" style=" margin-left: 10px;margin-right: 10px;"><i class="fa fa-fw fa-2x fa-user"/><br>'+config['display_name']+'</a>'+
    '</li>'+
    '<li>'+
      '<a href="#" data-dropdown="provision_zone_selector" class="button small radius secondary dropdown off-color" id="zonelector" style="background: #fff; padding:0px; font-size: 12px;">'+
        '<i class="fa fa-home fa-2x header-icon" style="margin-bottom: 2px"/><br> ' + config['zone_name'] +
      '</a>'+
      '<ul id="provision_zone_selector" data-dropdown-content class="zone-ul f-dropdown"></ul>'+
    '</li>'+
  '</ul>'+
  '</span>'

var provision_tab = {
  list_header: provision_header,
  content: provision_content
};

var povision_actions = {
  "Provision.Template.delete" : {
      type: "single",
      call: OpenNebula.Template.del,
      callback: function(){
        OpenNebula.Helper.clear_cache("VMTEMPLATE");
        show_provision_template_list(1000);
      },
      error: onError
  },

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

        // TODO if no quota is defined redefine?
        Sunstone.runAction("Provision.User.set_quota", [response.USER.ID], {
          "VM" : {
            "VOLATILE_SIZE":"-1",
            "VMS": $("#provision_rvms_quota_input").val()||0,
            "MEMORY": $("#provision_memory_quota_input").val()||0,
            "CPU": $("#provision_cpu_quota_input").val()||0}
          });
      },
      error: onError
  },

  "Provision.User.set_quota" : {
      type: "multiple",
      call: OpenNebula.User.set_quota,
      callback: function(request) {
        OpenNebula.Helper.clear_cache("USER");
        show_provision_user_list(0);

        var context = $("#provision_create_user");
        $("#username", context).val('');
        $("#password", context).val('');
        $("#provision_rvms_quota_input").val('');
        $("#provision_memory_quota_input").val('');
        $("#provision_memory_quota_tmp_input").val('');
        $("#provision_cpu_quota_input").val('');
        $("#repeat_password", context).val('');
        $(".alert-box-error", context).hide();
        $(".alert-box-error", context).html("");
      },
      error: onError
  },

  "Provision.VDCUser.show" : {
    type: "single",
    call: OpenNebula.User.show,
    callback: function(request, response){
        update_provision_vdc_user_info(response.USER);
    },
    error: onError
  },

  "Provision.VDCUser.passwd" : {
      type: "single",
      call: OpenNebula.User.passwd,
      callback: function() {
        show_provision_user_list();
        notifyMessage("Password updated successfully");
      },
      error: onError
  },

  "Provision.VDCUser.delete" : {
      type: "single",
      call: OpenNebula.User.del,
      callback: function(){
        OpenNebula.Helper.clear_cache("USER");
        show_provision_user_list(1000);
      },
      error: onError
  },

  "Provision.Group.show" : {
      type: "single",
      call: OpenNebula.Group.show,
      callback: show_provision_group_info_callback,
      error: onError
  },

  "Provision.show" : {
    type: "single",
    call: OpenNebula.VM.show,
    callback: function(request, response){
        update_provision_vm_info(response.VM);
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
      $(".provision-pricing-table", context).removeClass("selected");
      $(".alert-box-error", context).hide();
      $('a[href="#provision_system_templates_selector"]', context).click();
    },
    error: onError
  },
  "Provision.saveas" : {
    type: "single",
    call: OpenNebula.VM.saveas,
    callback: function(request, response){
      // TODO VMTEMPLATE
      OpenNebula.Helper.clear_cache("VMTEMPLATE");
      provision_show_vm_callback(request, response);
      notifyMessage(tr("Image") + ' ' + request.request.data[0][1].image_name + ' ' + tr("saved successfully"))
    },
    error: onError
  },
  "Provision.poweroff" : {
      type: "single",
      call: OpenNebula.VM.poweroff,
      callback: provision_show_vm_callback,
      error: onError
  },

  "Provision.poweroff_hard" : {
      type: "single",
      call: OpenNebula.VM.poweroff_hard,
      callback: provision_show_vm_callback,
      error: onError
  },
  "Provision.resume" : {
      type: "single",
      call: OpenNebula.VM.resume,
      callback: provision_show_vm_callback,
      error: onError
  },

  "Provision.shutdown_hard" : {
      type: "single",
      call: OpenNebula.VM.cancel,
      callback: function(){
        OpenNebula.Helper.clear_cache("VM");
        show_provision_vm_list(1000);
      },
      error: onError
  },

  "Provision.delete" : {
      type: "single",
      call: OpenNebula.VM.del,
      callback: function(){
        OpenNebula.Helper.clear_cache("VM");
        show_provision_vm_list(1000);
      },
      error: onError
  },
  "Provision.monitor" : {
    type: "monitor",
    call : OpenNebula.VM.monitor,
    callback: function(req,response) {
      var vm_graphs = [
          {
              monitor_resources : "CPU",
              labels : "Real CPU",
              humanize_figures : false,
              div_graph : $(".vm_cpu_graph")
          },
          {
              monitor_resources : "MEMORY",
              labels : "Real MEM",
              humanize_figures : true,
              div_graph : $(".vm_memory_graph")
          },
          //{ labels : "Network reception",
          //  monitor_resources : "NET_RX",
          //  humanize_figures : true,
          //  convert_from_bytes : true,
          //  div_graph : $("#vm_net_rx_graph")
          //},
          //{ labels : "Network transmission",
          //  monitor_resources : "NET_TX",
          //  humanize_figures : true,
          //  convert_from_bytes : true,
          //  div_graph : $("#vm_net_tx_graph")
          //},
          //{ labels : "Network reception speed",
          //  monitor_resources : "NET_RX",
          //  humanize_figures : true,
          //  convert_from_bytes : true,
          //  y_sufix : "B/s",
          //  derivative : true,
          //  div_graph : $("#vm_net_rx_speed_graph")
          //},
          //{ labels : "Network transmission speed",
          //  monitor_resources : "NET_TX",
          //  humanize_figures : true,
          //  convert_from_bytes : true,
          //  y_sufix : "B/s",
          //  derivative : true,
          //  div_graph : $("#vm_net_tx_speed_graph")
          //}
      ];

      // The network speed graphs require the derivative of the data,
      // and this process is done in place. They must be the last
      // graphs to be processed

      for(var i=0; i<vm_graphs.length; i++) {
          plot_graph(
              response,
              vm_graphs[i]
          );
      }
    },
    //error: vmMonitorError
  },
  "Provision.reboot" : {
      type: "single",
      call: OpenNebula.VM.reboot,
      callback: provision_show_vm_callback,
      error: onError
  },
  "Provision.reboot_hard" : {
      type: "single",
      call: OpenNebula.VM.reset,
      callback: provision_show_vm_callback,
      error: onError
  },
  "Provision.startvnc" : {
      type: "single",
      call: OpenNebula.VM.startvnc,
      callback: function(request, response) {
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
      },
      error: onError
  }

}

Sunstone.addMainTab('provision-tab',provision_tab);
Sunstone.addActions(povision_actions);


function show_provision_user_info() {
  Sunstone.runAction("Provision.User.show", "-1");
  $(".section_content").hide();
  $("#provision_user_info").fadeIn();
  $("dd.active a", $("#provision_user_info")).trigger("click");

  $(".provision_create_user_button").hide();
  $(".provision_create_vm_button").show();
}


function show_provision_user_info_callback(request, response) {
  var info = response.USER;

  var default_user_quotas = Quotas.default_quotas(info.DEFAULT_USER_QUOTAS);
  var vms_quota = Quotas.vms(info, default_user_quotas);
  var cpu_quota = Quotas.cpu(info, default_user_quotas);
  var memory_quota = Quotas.memory(info, default_user_quotas);
  var volatile_size_quota = Quotas.volatile_size(info, default_user_quotas);
  var image_quota = Quotas.image(info, default_user_quotas);
  var network_quota = Quotas.network(info, default_user_quotas);
  var datastore_quota = Quotas.datastore(info, default_user_quotas);

  var quotas_html;
  if (vms_quota || cpu_quota || memory_quota || volatile_size_quota || image_quota || network_quota || datastore_quota) {
    quotas_html = '<div class="large-6 columns">' + vms_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + cpu_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + memory_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + volatile_size_quota+ '</div>';
    quotas_html += '<div class="large-6 columns">' + image_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + network_quota + '</div>';
    quotas_html += '<div class="large-12 columns">' + datastore_quota + '</div>';
  } else {
    quotas_html = '<div class="row">'+
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
    '</div>';
  }

  $("#provision_user_info_quotas_div").html(quotas_html);

  var ssh_key = info.TEMPLATE.SSH_PUBLIC_KEY;
  if (ssh_key && ssh_key.length) {
    $("#provision_ssh_key").val(ssh_key);
    $("#provision_ssh_key_text").text(ssh_key);
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
}


function show_provision_group_info_callback(request, response) {
  var info = response.GROUP;

  var context = $("#provision_manage_vdc");

  var default_group_quotas = Quotas.default_quotas(info.DEFAULT_GROUP_QUOTAS);
  var vms_quota = Quotas.vms(info, default_group_quotas);
  var cpu_quota = Quotas.cpu(info, default_group_quotas);
  var memory_quota = Quotas.memory(info, default_group_quotas);
  var volatile_size_quota = Quotas.volatile_size(info, default_group_quotas);
  var image_quota = Quotas.image(info, default_group_quotas);
  var network_quota = Quotas.network(info, default_group_quotas);
  var datastore_quota = Quotas.datastore(info, default_group_quotas);

  var quotas_html;
  if (vms_quota || cpu_quota || memory_quota || volatile_size_quota || image_quota || network_quota || datastore_quota) {
    quotas_html = '<div class="large-6 columns">' + vms_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + cpu_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + memory_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + volatile_size_quota+ '</div>';
    quotas_html += '<div class="large-6 columns">' + image_quota + '</div>';
    quotas_html += '<div class="large-6 columns">' + network_quota + '</div>';
    quotas_html += '<div class="large-12 columns">' + datastore_quota + '</div>';
  } else {
    quotas_html = '<div class="row">'+
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
    '</div>';
  }

  $("#provision_vdc_quotas_div").html(quotas_html);

  accountingGraphs(
    $("#provision_info_vdc_group_acct", context),
    {   fixed_group: info.ID,
        init_group_by: "user" });
>>>>>>> feature-2854
}

function show_provision_create_vm() {
  update_provision_templates_datatable(provision_system_templates_datatable);
  update_provision_templates_datatable(provision_saved_templates_datatable);
  update_provision_networks_datatable(provision_networks_datatable);

  $(".provision_create_user_button").hide();
  $(".provision_create_vm_button").hide();

  $(".section_content").hide();
  $("#provision_create_vm").fadeIn();
}

function show_provision_create_user() {
  $(".section_content").hide();
  $("#provision_create_user").fadeIn();

  $(".provision_create_user_button").hide();
  $(".provision_create_vm_button").hide();
}

function show_provision_vm_list(timeout) {
  $(".section_content").hide();
  $("#provision_list_vms").fadeIn();

  $(".provision_create_user_button").hide();
  $(".provision_create_vm_button").show();

  update_provision_vms_datatable(provision_vms_datatable, timeout);
}

function show_provision_user_list(timeout) {
  $(".section_content").hide();
  $("#provision_manage_vdc").fadeIn();

  $(".provision_create_user_button").show();
  $(".provision_create_vm_button").hide();

  $("a[href='#provision_vdc_users'").click();

  update_provision_users_datatable(provision_users_datatable, timeout);
}

function show_provision_template_list(timeout) {
  $(".section_content").hide();
  $("#provision_list_templates").fadeIn();

  $(".provision_create_user_button").hide();
  $(".provision_create_vm_button").show();

  $("#provision_confirm_delete_template_div").empty();

  update_provision_templates_datatable(provision_templates_datatable, timeout);
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
            tr("There are no networks available. Please contact your cloud administrator")+
          '</span>'+
          '</div>');
      } else {
        datatable.fnAddData(item_list);
      }
    },
    error: onError
  });
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

  setTimeout( function(){
    OpenNebula.VM.list({
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
              tr("Looks like you don't have any Virtual Machine. Click the button below to get started")+
            '</span>'+
            '</div>');
        } else {
          datatable.fnAddData(item_list);
        }
      },
      error: onError
    })
  }, timeout );
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
    return '<i class="fa fa-fw fa-download"></i>&emsp;' + disks[0].IMAGE;
  } else {
    return '<i class="fa fa-fw fa-download"></i>&emsp; -';
  }
}

function get_provision_ips(data) {
  var nics = []
  if ($.isArray(data.TEMPLATE.NIC))
      nics = data.TEMPLATE.NIC
  else if (!$.isEmptyObject(data.TEMPLATE.NIC))
      nics = [data.TEMPLATE.NIC]

  if (nics.length > 0) {
    var ips = [];
    $.each(nics, function(index, nic){
      if (nic.IP)
        ips.push(nic.IP);
    })

    return '<i class="fa fa-fw fa-globe"></i>&emsp;' + ips.join(', ');
  } else {
    return '<i class="fa fa-fw fa-globe"></i>&emsp; -';
  }
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

function update_provision_vm_info(data) {
  var state = get_provision_vm_state(data);

  switch (state.color) {
    case "deploying":
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").hide();
      break;
    case "running":
      $("#provision_reboot_confirm_button").show();
      $("#provision_poweroff_confirm_button").show();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").hide();
      $("#provision_shutdownhard_confirm_button").show();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").show();
      $("#provision_snapshot_button_disabled").show();
      $("#provision_vnc_button_disabled").hide();
      break;
    case "off":
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").show();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").show();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").show();
      break;
    case "powering_off":
    case "error":
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").hide();
      break;
    default:
      color = 'secondary';
      $("#provision_reboot_confirm_button").hide();
      $("#provision_poweroff_confirm_button").hide();
      $("#provision_poweron_button").hide();
      $("#provision_delete_confirm_button").show();
      $("#provision_shutdownhard_confirm_button").hide();
      $("#provision_snapshot_button").hide();
      $("#provision_vnc_button").hide();
      $("#provision_snapshot_button_disabled").hide();
      $("#provision_vnc_button_disabled").hide();
      break;
  }

  var context = $("#provision_info_vm");
  $("#provision_info_vm").attr("vm_id", data.ID);
  $("#provision_info_vm_name", context).text(data.NAME);

  $("#provision_info_vm_resume").html('<ul class="inline-list" style="color: #555; font-size: 14px;">'+
      '<li>'+
        '<span>'+
          '<i class="fa fa-fw fa-laptop"/>&emsp;'+
          'x'+data.TEMPLATE.CPU+' - '+
          ((data.TEMPLATE.MEMORY > 1000) ?
            (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
            (data.TEMPLATE.MEMORY+'MB'))+
        '</span>'+
      '</li>'+
      '<li>'+
        '<span>'+
          get_provision_disk_image(data) +
        '</span>'+
      '</li>'+
      '<li>'+
        '<span>'+
          get_provision_ips(data) +
        '</span>'+
      '</li>'+
      '<li class="right">'+
        '<span style="color: #afafaf;px">'+
          "ID: " +
          data.ID+
        '</span>' +
      '</li>'+
    '</ul>');

  $("#provision_info_vm_state", context).html('<ul class="inline-list" style="color: #555; font-size: 14px; margin-bottom: 0px">'+
      '<li>'+
        '<span class="'+ state.color +'-color">'+
          '<i class="fa fa-fw fa-square"/>&emsp;'+
          state.str+
        '</span>'+
      '</li>'+
      '<li class="right">'+
        '<span style="color: #999;px">'+
          '<i class="fa fa-fw fa-clock-o"/>'+
          _format_date(data.STIME)+
        '</span>'+
      '</li>'+
      '<li class="right">'+
        '<span style="color: #999;px">'+
          '<i class="fa fa-fw fa-user"/>&emsp;'+
          data.UNAME+
        '</span>'+
      '</li>'+
    '</ul>');
  $("#provision_info_vm_state_hr", context).html('<div style="height:1px; margin-top:5px; margin-bottom: 5px; background: #cfcfcf"></div>');

  $("#provision_confirm_action", context).html("");

  Sunstone.runAction("Provision.monitor",data.ID, { monitor_resources : "CPU,MEMORY"});
}

function provision_show_vm_callback(request, response) {
    Sunstone.runAction("Provision.show",request.request.data[0]);
}

function update_provision_vdc_user_info(data) {

  var context = $("#provision_info_vdc_user");

  $("#provision_vdc_user_confirm_action",context).html("");
  $("#provision_info_vdc_user_acct",context).html("");

  context.attr("user_id", data.ID);
  context.attr("quotas", JSON.stringify(data.VM_QUOTA));
  $("#provision_info_vdc_user_name", context).html('<i class="fa fa-fw fa-user"/>&emsp;'+data.NAME);

  var default_user_quotas = Quotas.default_quotas(data.DEFAULT_USER_QUOTAS);
  var vms_quota = Quotas.vms(data, default_user_quotas);
  var cpu_quota = Quotas.cpu(data, default_user_quotas);
  var memory_quota = Quotas.memory(data, default_user_quotas);

  var quotas_html;
  if (vms_quota || cpu_quota || memory_quota) {
    quotas_html = '<div class="large-4 columns">' + vms_quota + '</div>';
    quotas_html += '<div class="large-4 columns">' + cpu_quota + '</div>';
    quotas_html += '<div class="large-4 columns">' + memory_quota + '</div>';
  } else {
    quotas_html = '<div class="row">'+
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
    '</div>';
  }

  accountingGraphs(
    $("#provision_info_vdc_user_acct", context),
    {   fixed_user: data.ID,
        init_group_by: "vm" });

  $("#acct_placeholder", context).hide();

  $("#provision_info_vdc_quotas").html(quotas_html);
}

$(document).ready(function(){
  var tab_name = 'provision-tab';
  var tab = $("#"+tab_name);

  if (Config.isTabEnabled(tab_name)) {
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
          $("#provision_system_templates_table").html('<ul id="provision_system_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VMTEMPLATE;
        $("#provision_system_templates_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<span style="font-size: 40px">'+
                '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                '<span style="vertical-align: middle; font-size:14px">'+
                  'x'+(data.TEMPLATE.CPU||'-')+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    ((data.TEMPLATE.MEMORY||'-')+'MB'))+
                '</span>'+
                '</span>'+
              '</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_templates_datatable(provision_system_templates_datatable);
    provision_system_templates_datatable.fnFilter("^-$", 2, true, false)

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
              tr("There are no templates available. Please contact your cloud administrator")+
            '</span>'+
            '</div>');
        } else {
          $("#provision_vdc_templates_table").html('<ul id="provision_vdc_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VMTEMPLATE;
        $("#provision_vdc_templates_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<span style="font-size: 40px">'+
                '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                '<span style="vertical-align: middle; font-size:14px">'+
                  'x'+(data.TEMPLATE.CPU||'-')+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    ((data.TEMPLATE.MEMORY||'-')+'MB'))+
                '</span>'+
                '</span>'+
              '</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
              '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; padding-bottom:10px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                _format_date(data.REGTIME)+
                " " + tr("from VM") + ": " + (data.TEMPLATE.SAVED_TEMPLATE_ID||'-') +
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_templates_datatable(provision_vdc_templates_datatable);
    provision_vdc_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
    provision_vdc_templates_datatable.fnFilter("^1$", 3, true, false);

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
              tr("There are no templates available. Please contact your cloud administrator")+
            '</span>'+
            '</div>');
        } else {
          $("#provision_saved_templates_table").html('<ul id="provision_saved_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VMTEMPLATE;
        $("#provision_saved_templates_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable only-one" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li class="provision-bullet-item">'+
                '<span style="font-size: 40px">'+
                '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                '<span style="vertical-align: middle; font-size:14px">'+
                  'x'+(data.TEMPLATE.CPU||'-')+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    ((data.TEMPLATE.MEMORY||'-')+'MB'))+
                '</span>'+
                '</span>'+
              '</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
              '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; padding-bottom:10px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                _format_date(data.REGTIME)+
                " " + tr("from VM") + ": " + (data.TEMPLATE.SAVED_TEMPLATE_ID||'-') +
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_templates_datatable(provision_saved_templates_datatable);
    provision_saved_templates_datatable.fnFilter("^(?!\-$)", 2, true, false);
    provision_saved_templates_datatable.fnFilter("^0$", 3, true, false);

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

    provision_instance_types_datatable = $('#provision_instance_types_table').dataTable({
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
          $("#provision_instance_types_table").html('<ul id="provision_instance_types_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData;
        $("#provision_instance_types_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable only-one" data=\''+JSON.stringify(data)+'\'>'+
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
          '</li>');

        return nRow;
      }
    });

    update_provision_instance_types_datatable(provision_instance_types_datatable);

    $('#provision_create_instance_types_search').on('keyup',function(){
      provision_instance_types_datatable.fnFilter( $(this).val() );
    })

    $('#provision_create_instance_types_search').on('change',function(){
      provision_instance_types_datatable.fnFilter( $(this).val() );
    })

    $("#provision_create_instance_types_refresh_button").click(function(){
      update_provision_instance_types_datatable(provision_instance_types_datatable);
    });

    provision_networks_datatable = $('#provision_networks_table').dataTable({
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
          $("#provision_networks_table").html('<ul id="provision_networks_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VNET;
        $("#provision_networks_ul").append('<li>'+
            '<ul class="provision-pricing-table hoverable more-than-one" opennebula_id="'+data.ID+'">'+
              '<li class="provision-title" title="'+data.NAME+'">'+
                data.NAME+
              '</li>'+
              '<li class="provision-bullet-item">'+'<i class="fa fa-fw fa-globe" style="font-size:40px;"/>'+'</li>'+
              //'<li class="provision-bullet-item">'+
              //  '<span style="font-size: 40px">'+
              //  '<i class="fa fa-fw fa-laptop"/>&emsp;'+
              //  '<span style="vertical-align: middle; font-size:14px">'+
              //    'x'+data.TEMPLATE.CPU+' - '+
              //    ((data.TEMPLATE.MEMORY > 1000) ?
              //      (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
              //      (data.TEMPLATE.MEMORY+'MB'))+
              //  '</span>'+
              //  '</span>'+
              //'</li>'+
              '<li class="provision-description">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_networks_datatable(provision_networks_datatable);

    $('#provision_create_networks_search').on('keyup',function(){
      provision_networks_datatable.fnFilter( $(this).val() );
    })

    $('#provision_create_networks_search').on('change',function(){
      provision_networks_datatable.fnFilter( $(this).val() );
    })

    $("#provision_create_networks_refresh_button").click(function(){
      OpenNebula.Helper.clear_cache("VNET");
      update_provision_networks_datatable(provision_networks_datatable);
    });

    tab.on("click", "#provision_create_vm .provision-pricing-table.more-than-one" , function(){
      if ($(this).hasClass("selected")) {
        $(this).removeClass("selected");
      } else {
        $(this).addClass("selected");
      }
    })

    tab.on("click", "#provision_create_vm .provision-pricing-table.only-one" , function(){
      $(".provision-pricing-table", $(this).parents(".large-block-grid-3,.large-block-grid-2")).removeClass("selected")
      $(this).addClass("selected");
    })

    $("#provision_create_vm").submit(function(){
      var context = $(this);

      var vm_name = $("#vm_name", context).val();
      var template_id = $(".tabs-content .content.active .selected", context).attr("opennebula_id");

      var nics = [];
      $("#provision_networks_ul .selected", context).each(function(){
        nics.push({
          'network_id': $(this).attr("opennebula_id")
        });
      });

      var instance_type = $("#provision_instance_types_ul .selected", context);

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
        var instance_typa_data = instance_type.attr("data");
        delete instance_typa_data.name;

        $.extend(extra_info.template, JSON.parse(instance_type.attr("data")))
      }

      Sunstone.runAction("Provision.instantiate", template_id, extra_info);
      return false;
    })

    $(".provision_create_vm_button").on("click", function(){
      show_provision_create_vm();
    });


    //
    // List Templates
    //

    provision_templates_datatable = $('#provision_templates_table').dataTable({
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
          $("#provision_templates_table").html('<ul id="provision_templates_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
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

        $("#provision_templates_ul").append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" saved_to_image_id="'+data.TEMPLATE.SAVED_TO_IMAGE_ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" title="'+data.NAME+'">'+
                data.NAME +
              '</li>'+
              '<li class="provision-description text-left" style="padding-top:0px; padding-bottom: 0px">'+
                (data.TEMPLATE.DESCRIPTION || '...')+
              '</li>'+
              '<li class="provision-description text-right" style="padding-top:5px; margin-right: 5px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                _format_date(data.REGTIME)+
                " " + tr("from VM") + ": " + (data.TEMPLATE.SAVED_TEMPLATE_ID||'-') +
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<i class="fa fa-fw fa-file-text-o"/>&emsp;'+
                  'x'+(data.TEMPLATE.CPU||'-')+' - '+
                  ((data.TEMPLATE.MEMORY > 1000) ?
                    (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                    ((data.TEMPLATE.MEMORY||'-')+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<i class="fa fa-fw fa-user"/>&emsp;'+
                data.UNAME+
              '</li>'+
              '<li class="provision-title" style="padding-top:15px">'+
                actions_html+
              '</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_templates_datatable(provision_templates_datatable);
    provision_templates_datatable.fnFilter("^(?!-$)", 2, true, false);

    $('#provision_list_templates_search').keyup(function(){
      provision_templates_datatable.fnFilter( $(this).val() );
    })

    $('#provision_list_templates_search').change(function(){
      provision_templates_datatable.fnFilter( $(this).val() );
    })

    $("#provision_templates_list_button").on("click", function(){
      OpenNebula.Helper.clear_cache("VMTEMPLATE");
      show_provision_template_list(0);
    });

    $("#provision_list_templates").on("click", "#provision_templates_list_refresh_button", function(){
      OpenNebula.Helper.clear_cache("VMTEMPLATE");
      show_provision_template_list(0);
    });

    $("#provision_list_templates").on("click", "#provision_templates_list_search_button", function(){
      $("#provision_list_templates_search", $("#provision_list_templates")).fadeIn();
    });

    $("#provision_list_templates").on("click", "#provision_templates_list_filter_button", function(){
      insertSelectOptions("#provision_list_templates_filter", $("#provision_list_templates"), "User", config['user_id'], false,
          '<option value="-2">'+tr("<< all >>")+'</option>');

      $("#provision_list_templates_filter ").on("change", ".resource_list_select", function(){
        var filter;
        if ($(this).val() == "-2"){
          filter = "";
        } else {
          filter = $(this).val();
        }

        provision_templates_datatable.fnFilter( filter, 3 );
      })

      $("#provision_list_templates_filter", $("#provision_list_templates")).fadeIn();
    });

    if (Config.isTabActionEnabled("provision-tab", "Template.delete")) {
      $("#provision_list_templates").on("click", ".provision_confirm_delete_template_button", function(){
        var context = $(this).parents(".provision-pricing-table");
        var template_id = context.attr("opennebula_id");
        var image_id = context.attr("saved_to_image_id");
        var template_name = $(".provision-title", context).text();

        $("#provision_confirm_delete_template_div").html(
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
              '<a href"#" id="provision_delete_template_button" class="alert button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+tr("Delete")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      $("#provision_confirm_delete_template_div").on("click", "#provision_delete_template_button", function(){
        var template_id = $(this).attr("template_id");
        var image_id = $(this).attr("image_id");

        OpenNebula.Image.del({
          timeout: true,
          data : {
            id : image_id
          },
          success: function (){
            Sunstone.runAction('Provision.Template.delete', template_id);
          },
          error: function (request,error_json, container) {
            if (error_json.error.http_status=="404") {
              Sunstone.runAction('Provision.Template.delete', template_id);
            } else {
              onError(request, error_json, container);
            }
          }
        })
      });
    }


    if (Config.isTabActionEnabled("provision-tab", "Template.chmod")) {
      $("#provision_list_templates").on("click", ".provision_confirm_chmod_template_button", function(){
        var context = $(this).parents(".provision-pricing-table");
        var template_id = context.attr("opennebula_id");
        var image_id = context.attr("saved_to_image_id");
        var template_name = $(".provision-title", context).text();

        $("#provision_confirm_delete_template_div").html(
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
              '<a href"#" id="provision_chmod_template_button" class="success button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+tr("Share template")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      $("#provision_confirm_delete_template_div").on("click", "#provision_chmod_template_button", function(){
        var template_id = $(this).attr("template_id");
        var image_id = $(this).attr("image_id");

        OpenNebula.Template.chmod({
          timeout: true,
          data : {
            id : template_id,
            extra_param: {'group_u': 1}
          },
          success: function (){
            OpenNebula.Helper.clear_cache("VMTEMPLATE");
            show_provision_template_list(1000);

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

      $("#provision_list_templates").on("click", ".provision_confirm_unshare_template_button", function(){
        var context = $(this).parents(".provision-pricing-table");
        var template_id = context.attr("opennebula_id");
        var image_id = context.attr("saved_to_image_id");
        var template_name = $(".provision-title", context).first().text();

        $("#provision_confirm_delete_template_div").html(
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
              '<a href"#" id="provision_unshare_template_button" class="success button large-12 radius right" style="margin-right: 15px" image_id="'+image_id+'" template_id="'+template_id+'">'+tr("Unshare template")+'</a>'+
            '</div>'+
            '</div>'+
            '<a href="#" class="close">&times;</a>'+
          '</div>');
      });

      $("#provision_confirm_delete_template_div").on("click", "#provision_unshare_template_button", function(){
        var template_id = $(this).attr("template_id");
        var image_id = $(this).attr("image_id");

        OpenNebula.Template.chmod({
          timeout: true,
          data : {
            id : template_id,
            extra_param: {'group_u': 0}
          },
          success: function (){
            OpenNebula.Helper.clear_cache("VMTEMPLATE");
            show_provision_template_list(1000);

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

    //
    // List VMs
    //

    provision_vms_datatable = $('#provision_vms_table').dataTable({
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
              tr("Looks like you don't have any Virtual Machine. Click the button below to get started")+
            '</span>'+
            '</div>');
        } else {
          $("#provision_vms_table").html('<ul id="provision_vms_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
        }

        return true;
      },
      "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
        var data = aData.VM;
        var state = get_provision_vm_state(data);

        $("#provision_vms_ul").append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" style="padding-bottom: 5px">'+
                '<a class="provision_info_vm_button" style="color:#555" href="#">'+ data.NAME + '</a>'+
              '</li>'+
              '<li class="provision-bullet-item text-right" style="font-size:12px; color: #999; padding-bottom:10px">'+
                '<i class="fa fa-fw fa-clock-o"/>'+
                _format_date(data.STIME)+
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<i class="fa fa-fw fa-laptop"/>&emsp;'+
                'x'+data.TEMPLATE.CPU+' - '+
                ((data.TEMPLATE.MEMORY > 1000) ?
                  (Math.floor(data.TEMPLATE.MEMORY/1024)+'GB') :
                  (data.TEMPLATE.MEMORY+'MB'))+
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                get_provision_disk_image(data) +
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                get_provision_ips(data) +
              '</li>'+
              '<li class="provision-bullet-item text-left">'+
                '<i class="fa fa-fw fa-user"/>&emsp;'+
                data.UNAME+
              '</li>'+
              '<li class="provision-bullet-item text-right" style="font-size:14px; color: #999; margin-top:15px; padding-bottom:10px">'+
                '<a class="provision_info_vm_button" style="color:#555;" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/></a>'+
                '<span class="'+ state.color +'-color left">'+
                  '<i class="fa fa-fw fa-square"/>&emsp;'+
                  state.str+
                '</span>'+
              '</li>'+
              //'<li class="provision-bullet-item" style="padding: 0px">'+
              //  '<div style="height:1px" class="'+ state.color +'-bg"></div>'+
              //'</li>'+
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_vms_datatable(provision_vms_datatable);

    $('#provision_list_vms_search').keyup(function(){
      provision_vms_datatable.fnFilter( $(this).val() );
    })

    $('#provision_list_vms_search').change(function(){
      provision_vms_datatable.fnFilter( $(this).val() );
    })

    $("#provision_vms_list_button").on("click", function(){
      OpenNebula.Helper.clear_cache("VM");
      show_provision_vm_list(0);
    });

    $("#provision_list_vms").on("click", "#provision_vms_list_refresh_button", function(){
      OpenNebula.Helper.clear_cache("VM");
      show_provision_vm_list(0);
    });

    $("#provision_list_vms").on("click", "#provision_vms_list_search_button", function(){
      $("#provision_list_vms_search", $("#provision_list_vms")).fadeIn();
    });

    $("#provision_list_vms").on("click", "#provision_vms_list_filter_button", function(){
      insertSelectOptions("#provision_list_vms_filter", $("#provision_list_vms"), "User", config['user_id'], false,
          '<option value="-2">'+tr("<< all >>")+'</option>');

      $("#provision_list_vms_filter ").on("change", ".resource_list_select", function(){
        var filter;
        if ($(this).val() == "-2"){
          filter = "";
        } else {
          filter = $(this).val();
        }

        provision_vms_datatable.fnFilter( filter, 2 );
      })

      $("#provision_list_vms_filter", $("#provision_list_vms")).fadeIn();
    });

    //
    // List Users
    //

    provision_users_datatable = $('#provision_users_table').dataTable({
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
          $("#provision_users_table").html('<ul id="provision_users_ul" class="large-block-grid-3 medium-block-grid-3 small-block-grid-1 text-center"></ul>');
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

            if (!$.isEmptyObject(quota.VM_QUOTA)){
                quotas_html = "";
                quotas_html += '<li class="provision-description text-left" style="padding-top: 0px; padding-bottom: 0px;margin-left:15px; margin-top: 5px">'+tr("Running VMs")+'</li>';
                quotas_html += '<li class="provision-bullet-item text-left" style="padding: 10px 25px 15px 25px; margin-bottom: 5px">';
                quotas_html += quotaBar(
                    quota.VM_QUOTA.VM.VMS_USED,
                    quota.VM_QUOTA.VM.VMS,
                    default_user_quotas.VM_QUOTA.VM.VMS);
                quotas_html += '</li>';

                quotas_html += '<li class="provision-description text-left" style="padding-top: 0px; padding-bottom: 0px;margin-left:15px">'+tr("CPU")+'</li>';
                quotas_html += '<li class="provision-bullet-item text-left" style="padding: 10px 25px 15px 25px; margin-bottom: 10px">';
                quotas_html += quotaBarFloat(
                    quota.VM_QUOTA.VM.CPU_USED,
                    quota.VM_QUOTA.VM.CPU,
                    default_user_quotas.VM_QUOTA.VM.CPU);
                quotas_html += '</li>';

                quotas_html += '<li class="provision-description text-left" style="padding-top: 0px; padding-bottom: 0px;margin-left:15px">'+tr("Memory")+'</li>';
                quotas_html += '<li class="provision-bullet-item text-left" style="padding: 10px 25px 15px 25px; margin-bottom: 5px">';
                quotas_html += quotaBarMB(
                    quota.VM_QUOTA.VM.MEMORY_USED,
                    quota.VM_QUOTA.VM.MEMORY,
                    default_user_quotas.VM_QUOTA.VM.MEMORY);
                quotas_html += '</li>';
            }
        }

        if (quotas_html == undefined) {
          quotas_html = "";
          quotas_html += '<li class="provision-description text-left" style="padding-top: 0px; padding-bottom: 0px;margin-left:15px; margin-top: 5px">'+tr("Running VMs")+'</li>';
          quotas_html += '<li class="provision-bullet-item text-left" style="padding: 10px 25px 15px 25px; margin-bottom: 5px">';
          quotas_html += quotaBar(0,0,null);
          quotas_html += '</li>';

          quotas_html += '<li class="provision-description text-left" style="padding-top: 0px; padding-bottom: 0px;margin-left:15px">'+tr("CPU")+'</li>';
          quotas_html += '<li class="provision-bullet-item text-left" style="padding: 10px 25px 15px 25px; margin-bottom: 10px">';
          quotas_html += quotaBarFloat(0,0,null);
          quotas_html += '</li>';

          quotas_html += '<li class="provision-description text-left" style="padding-top: 0px; padding-bottom: 0px;margin-left:15px">'+tr("Memory")+'</li>';
          quotas_html += '<li class="provision-bullet-item text-left" style="padding: 10px 25px 15px 25px; margin-bottom: 5px">';
          quotas_html += quotaBarMB(0,0,null);
          quotas_html += '</li>';
        }


        $("#provision_users_ul").append('<li>'+
            '<ul class="provision-pricing-table" opennebula_id="'+data.ID+'" datatable_index="'+iDisplayIndexFull+'">'+
              '<li class="provision-title text-left" style="padding-bottom: 5px">'+
                '<a class="provision_info_user_button" style="color:#555" href="#"><i class="fa fa-fw fa-lg fa-sign-in right only-on-hover"/>'+ data.NAME + '</a>'+
              '</li>'+
                quotas_html +
            '</ul>'+
          '</li>');

        return nRow;
      }
    });

    update_provision_users_datatable(provision_users_datatable);

    $('#provision_list_users_search').keyup(function(){
      provision_users_datatable.fnFilter( $(this).val() );
    })

    $('#provision_list_users_search').change(function(){
      provision_users_datatable.fnFilter( $(this).val() );
    })

    $("#provision_users_list_button").on("click", function(){
      OpenNebula.Helper.clear_cache("USER");
      show_provision_user_list(0);
    });

    $("#provision_list_users").on("click", "#provision_users_list_refresh_button", function(){
      OpenNebula.Helper.clear_cache("USER");
      show_provision_user_list(0);
    });

    $(".provision_create_user_button").on("click", function(){
      show_provision_create_user();
    });

    Sunstone.runAction('Provision.Group.show', "-1");

    //
    // Create User
    //

    var provision_rvms_quota_input = $("#provision_rvms_quota_input");
    var provision_rvms_quota_slider = $( "#provision_rvms_quota_slider").noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,5000],
        step: 100,
        start: 500,
        value: 500,
        slide: function(type) {
            if ( type != "move"){
                provision_rvms_quota_input.val($(this).val()/100);
            }
        }
    });

    provision_rvms_quota_slider.addClass("noUiSlider");

    provision_rvms_quota_input.change(function() {
        provision_rvms_quota_slider.val(this.value * 100)
    });

    var provision_cpu_quota_input = $("#provision_cpu_quota_input");
    var provision_cpu_quota_slider = $( "#provision_cpu_quota_slider").noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,20000],
        step: 100,
        start: 4000,
        value: 4000,
        slide: function(type) {
            if ( type != "move"){
                provision_cpu_quota_input.val($(this).val()/100);
            }
        }
    });

    provision_cpu_quota_slider.addClass("noUiSlider");

    provision_cpu_quota_input.change(function() {
        provision_cpu_quota_slider.val(this.value * 100)
    });

    var provision_memory_quota_input = $("#provision_memory_quota_input");
    var provision_memory_quota_tmp_input = $("#provision_memory_quota_tmp_input");

    var update_final_memory_input = function() {
      provision_memory_quota_input.val( Math.floor(provision_memory_quota_tmp_input.val() * 1024) );
    }

    var provision_memory_quota_slider = $( "#provision_memory_quota_slider").noUiSlider({
        handles: 1,
        connect: "lower",
        range: [0,6400],
        start: 1600,
        step: 50,
        value: 1600,
        slide: function(type) {
            if ( type != "move"){
                provision_memory_quota_tmp_input.val($(this).val()/100);
            }
        }
    });

    provision_memory_quota_tmp_input.change(function() {
        provision_memory_quota_slider.val(this.value * 100)
        update_final_memory_input();
    });

    provision_memory_quota_slider.addClass("noUiSlider");

    provision_memory_quota_input.change(function() {
        provision_memory_quota_slider.val(this.value)
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

    //
    // Info VM
    //

    $("#provision_list_vms").on("click", ".provision_info_vm_button", function(){
      $(".section_content").hide();
      $("#provision_info_vm").fadeIn();
      var vm_id = $(this).parents(".provision-pricing-table").attr("opennebula_id");
      Sunstone.runAction('Provision.show', vm_id);

      return false;
    })

    $("#provision_info_vm").on("click", "#provision_snapshot_button", function(){
      $("#provision_confirm_action").html(
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
              '<input type="text" id="provision_snapshot_name" placeholder="'+tr("Template Name")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important; margin: 0px"/>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-11 large-centered columns">'+
              '<a href"#" id="provision_snapshot_create_button" class="success button large-12 radius right">'+tr("Save Virtual Machine to Template")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_delete_confirm_button", function(){
      $("#provision_confirm_action").html(
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
            '<a href"#" id="provision_delete_button" class="alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_shutdownhard_confirm_button", function(){
      $("#provision_confirm_action").html(
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
            '<a href"#" id="provision_shutdownhard_button" class="alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_poweroff_confirm_button", function(){
      $("#provision_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
          '<div class="large-11 columns">'+
            '<span style="font-size: 14px; line-height: 20px">'+
              tr("This action will power off this Virtual Machine. The Virtual Machine will remain in the poweroff state, and can be powered on later")+
              '<br>'+
              '<br>'+
              tr("You can send the power off signal to the Virtual Machine (this is equivalent to execute the command form the console). If that doesn't effect your Virtual Machine, try to Power off the machine (this is equivalent to pressing the power off button a physical computer).")+
            '</span>'+
          '</div>'+
          '</div>'+
          '<br>'+
          '<div class="row">'+
          '<div class="large-12 columns">'+
            '<a href"#" id="provision_poweroff_button" class="button radius right" style="margin-right: 15px">'+tr("Power off")+'</a>'+
              '<input type="radio" name="provision_poweroff_radio" value="poweroff_hard" id="provision_poweroff_hard_radio">'+
                '<label for="provision_poweroff_hard_radio">'+
                  '<i class="fa fa-fw fa-bolt"/>'+tr("Power off the machine")+
                '</label>'+
              '<input type="radio" name="provision_poweroff_radio" value="poweroff" id="provision_poweroff_radio" checked>'+
                '<label for="provision_poweroff_radio">'+
                  '<i class="fa fa-fw fa-power-off"/>'+tr("Send the power off signal")+
                '</label>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_reboot_confirm_button", function(){
      $("#provision_confirm_action").html(
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
            '<a href"#" id="provision_reboot_button" class="button radius right" style="margin-right: 15px">'+tr("Reboot")+'</a>'+
              '<input type="radio" name="provision_reboot_radio" value="reboot_hard" id="provision_reboot_hard_radio">'+
              '<label for="provision_reboot_hard_radio">'+
                '<i class="fa fa-fw fa-bolt"/>'+tr("Reboot the machine")+
              '</label>'+
              '<input type="radio" name="provision_reboot_radio" value="reboot" id="provision_reboot_radio" checked>'+
              '<label for="provision_reboot_radio">'+
                '<i class="fa fa-fw fa-power-off"/>'+tr("Send the reboot signal")+
              '</label>'+
          '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vm").on("click", "#provision_snapshot_create_button", function(){
      var context = $("#provision_info_vm");

      var vm_id = context.attr("vm_id");
      var image_name = $('#provision_snapshot_name', context).val();

      var obj = {
        disk_id : "0",
        image_name : image_name,
        type: "",
        clonetemplate: true,
        hot: true
      };

      Sunstone.runAction('Provision.saveas', vm_id, obj);
    });

    $("#provision_info_vm").on("click", "#provision_delete_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.delete', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_shutdownhard_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.shutdown_hard', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_poweroff_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      var poweroff_action = $('input[name=provision_poweroff_radio]:checked').val()
      Sunstone.runAction('Provision.' + poweroff_action, vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_reboot_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      var reboot_action = $('input[name=provision_reboot_radio]:checked').val()
      Sunstone.runAction('Provision.' + reboot_action, vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_poweron_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.resume', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_vnc_button", function(){
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.startvnc', vm_id);
    });

    $("#provision_info_vm").on("click", "#provision_refresh_info", function(){
      $(".section_content").hide();
      $("#provision_info_vm").fadeIn();
      var vm_id = $("#provision_info_vm").attr("vm_id");
      Sunstone.runAction('Provision.show', vm_id);
    });

    //
    // Info VDC User
    //

    $("#provision_list_users").on("click", ".provision_info_user_button", function(){
      $(".section_content").hide();
      $("#provision_info_vdc_user").fadeIn();
      var user_id = $(this).parents(".provision-pricing-table").attr("opennebula_id");
      Sunstone.runAction('Provision.VDCUser.show', user_id);

      return false;
    })

    $("#provision_info_vdc_user").on("click", ".show_vdc_user_vms_button", function(){
      show_provision_vm_list(0);
      var user_id = $("#provision_info_vdc_user").attr("user_id");

      insertSelectOptions("#provision_list_vms_filter", $("#provision_list_vms"), "User", user_id, false,
          '<option value="-2">'+tr("<< all >>")+'</option>');

      $("#provision_list_vms_filter ").on("change", ".resource_list_select", function(){
        var filter;
        if ($(this).val() == "-2"){
          filter = "";
        } else {
          filter = $(this).val();
        }

        provision_vms_datatable.fnFilter( filter, 2 );
      })

      $("#provision_list_vms_filter", $("#provision_list_vms")).fadeIn();
    });

    $("#provision_info_vdc_user").on("click", ".show_vdc_user_templates_button", function(){
      show_provision_template_list(0);
      var user_id = $("#provision_info_vdc_user").attr("user_id");

      insertSelectOptions("#provision_list_templates_filter", $("#provision_list_templates"), "User", user_id, false,
          '<option value="-2">'+tr("<< all >>")+'</option>');

      $("#provision_list_templates_filter ").on("change", ".resource_list_select", function(){
        var filter;
        if ($(this).val() == "-2"){
          filter = "";
        } else {
          filter = $(this).val();
        }

        provision_templates_datatable.fnFilter( filter, 3 );
      })

      $("#provision_list_templates_filter", $("#provision_list_templates")).fadeIn();
    });

    $("#provision_info_vdc_user").on("click", "#provision_vdc_user_delete_confirm_button", function(){
      $("#provision_vdc_user_confirm_action").html(
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
              '<a href"#" id="provision_delete_button" class="alert button large-12 large radius">'+tr("Delete User")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');
    });

    $("#provision_info_vdc_user").on("click", "#provision_vdc_user_password_confirm_button", function(){
      $("#provision_vdc_user_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<form id="provision_vdc_user_change_password_form">'+
            '<div class="row">'+
              '<div class="large-10 large-centered columns">'+
                '<input type="password" id="provision_vdc_user_new_password" class="provision-input" placeholder="'+tr("New Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-10 large-centered columns">'+
                '<input type="password" id="provision_vdc_user_new_confirm_password" class="provision-input" placeholder="'+tr("Confirm Password")+'" style="height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                '<br>'+
              '</div>'+
            '</div>'+
            '<div class="row">'+
              '<div class="large-10 large-centered columns">'+
                '<button href"#" type="submit" class="button success large radius large-12 small-12">'+tr("Update Password")+'</button>'+
              '</div>'+
            '</div>'+
          '</form>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');

        $("#provision_vdc_user_change_password_form").submit(function(){
          var user_id = $("#provision_info_vdc_user").attr("user_id");
          var pw = $('#provision_vdc_user_new_password', this).val();
          var confirm_password = $('#provision_vdc_user_new_confirm_password', this).val();

          if (!pw.length){
              notifyError(tr("Fill in a new password"));
              return false;
          }

          if (pw !== confirm_password){
              notifyError(tr("Passwords do not match"));
              return false;
          }

          Sunstone.runAction("Provision.VDCUser.passwd", user_id, pw);
          return false;
        });
    });



    $("#provision_info_vdc_user").on("click", "#provision_vdc_user_quota_confirm_button", function(){
      $("#provision_vdc_user_confirm_action").html(
        '<div data-alert class="alert-box secondary radius">'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<h5 class="subheader text-right">'+
                '<span class="left">'+
                  tr("Running VMs")+
                '</span>'+
              '</h5>'+
              '<br>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<div class="row collapse">'+
                '<div class="large-9 small-9 columns">'+
                  '<div id="provision_rvms_quota_vdc_info_slider">'+
                  '</div>'+
                '</div>'+
                '<div class="large-2 small-2 columns">'+
                  '<input type="text"  class="provision-input" id="provision_rvms_quota_vdc_info_input" style="margin-top: -17px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<h5 class="subheader text-right">'+
                '<span class="left">'+
                  tr("CPU")+
                '</span>'+
              '</h5>'+
              '<br>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<div class="row collapse">'+
                '<div class="large-9 small-9 columns">'+
                  '<div id="provision_cpu_quota_vdc_info_slider">'+
                  '</div>'+
                '</div>'+
                '<div class="large-2 small-2 columns">'+
                  '<input type="text"  class="provision-input" id="provision_cpu_quota_vdc_info_input" style="margin-top: -17px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<h5 class="subheader text-right">'+
                '<span class="left">'+
                  tr("Memory (GBs)")+
                '</span>'+
              '</h5>'+
              '<br>'+
            '</div>'+
          '</div>'+
          '<div class="vm_param">'+
              '<input type="hidden" id="provision_memory_quota_vdc_info_input"/>'+
          '</div>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<div class="row collapse">'+
                '<div class="large-9 small-9 columns">'+
                  '<div id="provision_memory_quota_vdc_info_slider">'+
                  '</div>'+
                '</div>'+
                '<div class="large-2 small-2 columns">'+
                  '<input type="text"  class="provision-input" id="provision_memory_quota_vdc_info_tmp_input" style="margin-top: -17px; height: 40px !important; font-size: 16px; padding: 0.5rem  !important;"/>'+
                '</div>'+
              '</div>'+
            '</div>'+
          '</div>'+
          '<br>'+
          '<br>'+
          '<div class="row">'+
            '<div class="large-10 large-centered columns">'+
              '<a href"#" id="provision_update_quota_button" class="success large button large-12 radius" style="margin-right: 15px">'+tr("Update User Quota")+'</a>'+
            '</div>'+
          '</div>'+
          '<a href="#" class="close" style="top: 20px">&times;</a>'+
        '</div>');

        var provision_rvms_quota_vdc_info_input = $("#provision_rvms_quota_vdc_info_input");
        var provision_rvms_quota_vdc_info_slider = $( "#provision_rvms_quota_vdc_info_slider").noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0,5000],
            step: 100,
            start: 500,
            value: 500,
            slide: function(type) {
                if ( type != "move"){
                    provision_rvms_quota_vdc_info_input.val($(this).val()/100);
                }
            }
        });

        provision_rvms_quota_vdc_info_slider.addClass("noUiSlider");

        provision_rvms_quota_vdc_info_input.change(function() {
            provision_rvms_quota_vdc_info_slider.val(this.value * 100)
        });

        var provision_cpu_quota_vdc_info_input = $("#provision_cpu_quota_vdc_info_input");
        var provision_cpu_quota_vdc_info_slider = $( "#provision_cpu_quota_vdc_info_slider").noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0,5000],
            step: 100,
            start: 4000,
            value: 4000,
            slide: function(type) {
                if ( type != "move"){
                    provision_cpu_quota_vdc_info_input.val($(this).val()/100);
                }
            }
        });

        provision_cpu_quota_vdc_info_slider.addClass("noUiSlider");

        provision_cpu_quota_vdc_info_input.change(function() {
            provision_cpu_quota_vdc_info_slider.val(this.value * 100)
        });

        var provision_memory_quota_vdc_info_input = $("#provision_memory_quota_vdc_info_input");
        var provision_memory_quota_vdc_info_tmp_input = $("#provision_memory_quota_vdc_info_tmp_input");

        var update_final_memory_input = function() {
          provision_memory_quota_vdc_info_input.val( Math.floor(provision_memory_quota_vdc_info_tmp_input.val() * 1024) );
        }

        var provision_memory_quota_vdc_info_slider = $( "#provision_memory_quota_vdc_info_slider").noUiSlider({
            handles: 1,
            connect: "lower",
            range: [0,6400],
            start: 1600,
            step: 50,
            value: 1600,
            slide: function(type) {
                if ( type != "move"){
                    provision_memory_quota_vdc_info_tmp_input.val($(this).val()/100);
                }
            }
        });

        provision_memory_quota_vdc_info_tmp_input.change(function() {
            provision_memory_quota_vdc_info_slider.val(this.value * 100)
            update_final_memory_input();
        });

        provision_memory_quota_vdc_info_slider.addClass("noUiSlider");

        provision_memory_quota_vdc_info_input.change(function() {
            provision_memory_quota_vdc_info_slider.val(this.value)
        });

        var quotas_str = $("#provision_info_vdc_user").attr("quotas");
        if (quotas_str) {
          var quotas = JSON.parse(quotas_str);
          provision_rvms_quota_vdc_info_input.val(quotas.VM.VMS).change();
          provision_cpu_quota_vdc_info_input.val(quotas.VM.CPU).change();
          provision_memory_quota_vdc_info_tmp_input.val(Math.floor(quotas.VM.MEMORY/1024)).change();
        }
    });


    //$("#provision_info_vm").on("click", "#provision_shutdownhard_confirm_button", function(){
    //  $("#provision_confirm_action").html(
    //    '<div data-alert class="alert-box secondary radius">'+
    //      '<div class="row">'+
    //      '<div class="large-9 columns">'+
    //        '<span style="font-size: 14px; line-height: 20px">'+
    //          tr("Be careful, this action will inmediately destroy your Virtual Machine")+
    //          '<br>'+
    //          tr("All the information will be lost!")+
    //        '</span>'+
    //      '</div>'+
    //      '<div class="large-3 columns">'+
    //        '<a href"#" id="provision_shutdownhard_button" class="alert button large-12 radius right" style="margin-right: 15px">'+tr("Delete")+'</a>'+
    //      '</div>'+
    //      '</div>'+
    //      '<a href="#" class="close" style="top: 20px">&times;</a>'+
    //    '</div>');
    //});


//
    //$("#provision_info_vm").on("click", "#provision_poweroff_confirm_button", function(){
    //  $("#provision_confirm_action").html(
    //    '<div data-alert class="alert-box secondary radius">'+
    //      '<div class="row">'+
    //      '<div class="large-11 columns">'+
    //        '<span style="font-size: 14px; line-height: 20px">'+
    //          tr("This action will power off this Virtual Machine. The Virtual Machine will remain in the poweroff state, and can be powered on later")+
    //          '<br>'+
    //          '<br>'+
    //          tr("You can send the power off signal to the Virtual Machine (this is equivalent to execute the command form the console). If that doesn't effect your Virtual Machine, try to Power off the machine (this is equivalent to pressing the power off button a physical computer).")+
    //        '</span>'+
    //      '</div>'+
    //      '</div>'+
    //      '<br>'+
    //      '<div class="row">'+
    //      '<div class="large-12 columns">'+
    //        '<a href"#" id="provision_poweroff_button" class="button radius right" style="margin-right: 15px">'+tr("Power off")+'</a>'+
    //          '<input type="radio" name="provision_poweroff_radio" value="poweroff_hard" id="provision_poweroff_hard_radio">'+
    //            '<label for="provision_poweroff_hard_radio">'+
    //              '<i class="fa fa-fw fa-bolt"/>'+tr("Power off the machine")+
    //            '</label>'+
    //          '<input type="radio" name="provision_poweroff_radio" value="poweroff" id="provision_poweroff_radio" checked>'+
    //            '<label for="provision_poweroff_radio">'+
    //              '<i class="fa fa-fw fa-power-off"/>'+tr("Send the power off signal")+
    //            '</label>'+
    //      '</div>'+
    //      '</div>'+
    //      '<a href="#" class="close" style="top: 20px">&times;</a>'+
    //    '</div>');
    //});
//
    //$("#provision_info_vm").on("click", "#provision_reboot_confirm_button", function(){
    //  $("#provision_confirm_action").html(
    //    '<div data-alert class="alert-box secondary radius">'+
    //      '<div class="row">'+
    //      '<div class="large-11 columns">'+
    //        '<span style="font-size: 14px; line-height: 20px">'+
    //          tr("This action will reboot this Virtual Machine.")+
    //          '<br>'+
    //          '<br>'+
    //          tr("You can send the reboot signal to the Virtual Machine (this is equivalent to execute the reboot command form the console). If that doesn't effect your Virtual Machine, try to Reboot the machine (this is equivalent to pressing the reset button a physical computer).")+
    //        '</span>'+
    //      '</div>'+
    //      '</div>'+
    //      '<br>'+
    //      '<div class="row">'+
    //      '<div class="large-12 columns">'+
    //        '<a href"#" id="provision_reboot_button" class="button radius right" style="margin-right: 15px">'+tr("Reboot")+'</a>'+
    //          '<input type="radio" name="provision_reboot_radio" value="reboot_hard" id="provision_reboot_hard_radio">'+
    //          '<label for="provision_reboot_hard_radio">'+
    //            '<i class="fa fa-fw fa-bolt"/>'+tr("Reboot the machine")+
    //          '</label>'+
    //          '<input type="radio" name="provision_reboot_radio" value="reboot" id="provision_reboot_radio" checked>'+
    //          '<label for="provision_reboot_radio">'+
    //            '<i class="fa fa-fw fa-power-off"/>'+tr("Send the reboot signal")+
    //          '</label>'+
    //      '</div>'+
    //      '</div>'+
    //      '<a href="#" class="close" style="top: 20px">&times;</a>'+
    //    '</div>');
    //});
//
    //$("#provision_info_vm").on("click", "#provision_snapshot_create_button", function(){
    //  var context = $("#provision_info_vm");
//
    //  var vm_id = context.attr("vm_id");
    //  var image_name = $('#provision_snapshot_name', context).val();
//
    //  var obj = {
    //    disk_id : "0",
    //    image_name : image_name,
    //    type: "",
    //    clonetemplate: true,
    //    hot: true
    //  };
//
    //  Sunstone.runAction('Provision.saveas', vm_id, obj);
    //});
//
    $("#provision_info_vdc_user").on("click", "#provision_delete_button", function(){
      var user_id = $("#provision_info_vdc_user").attr("user_id");
      Sunstone.runAction('Provision.VDCUser.delete', user_id);
    });
//
    $("#provision_info_vdc_user").on("click", "#provision_update_quota_button", function(){
      var user_id = $("#provision_info_vdc_user").attr("user_id");
      Sunstone.runAction("Provision.User.set_quota", [user_id], {
        "VM" : {
          "VOLATILE_SIZE":"-1",
          "VMS": $("#provision_rvms_quota_vdc_info_input").val()||0,
          "MEMORY": $("#provision_memory_quota_vdc_info_input").val()||0,
          "CPU": $("#provision_cpu_quota_vdc_info_input").val()||0}
        });
    });
//
    //$("#provision_info_vm").on("click", "#provision_poweroff_button", function(){
    //  var vm_id = $("#provision_info_vm").attr("vm_id");
    //  var poweroff_action = $('input[name=provision_poweroff_radio]:checked').val()
    //  Sunstone.runAction('Provision.' + poweroff_action, vm_id);
    //});
//
    //$("#provision_info_vm").on("click", "#provision_reboot_button", function(){
    //  var vm_id = $("#provision_info_vm").attr("vm_id");
    //  var reboot_action = $('input[name=provision_reboot_radio]:checked').val()
    //  Sunstone.runAction('Provision.' + reboot_action, vm_id);
    //});
//
    //$("#provision_info_vm").on("click", "#provision_poweron_button", function(){
    //  var vm_id = $("#provision_info_vm").attr("vm_id");
    //  Sunstone.runAction('Provision.resume', vm_id);
    //});
//
    //$("#provision_info_vm").on("click", "#provision_vnc_button", function(){
    //  var vm_id = $("#provision_info_vm").attr("vm_id");
    //  Sunstone.runAction('Provision.startvnc', vm_id);
    //});
//
    //$("#provision_info_vm").on("click", "#provision_refresh_info", function(){
    //  $(".section_content").hide();
    //  $("#provision_info_vm").fadeIn();
    //  var vm_id = $("#provision_info_vm").attr("vm_id");
    //  Sunstone.runAction('Provision.show', vm_id);
    //});
  }
});
