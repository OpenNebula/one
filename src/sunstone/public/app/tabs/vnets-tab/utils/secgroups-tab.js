/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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

define(function(require) {
  // Dependencies
  var Tips = require('utils/tips');
  var CustomTagsTable = require('utils/custom-tags-table');
  var SecurityGroupsTable = require('tabs/secgroups-tab/datatable');
  
  // Templates
  var TemplateHTML = require('hbs!./secgroups-tab/html');

  function SecGroupsTab() {
    return this;
  }

  SecGroupsTab.prototype = {
    'html': _generate_secgroup_tab_content,
    'setup': _setup_secgroup_tab_content,
    'onShow': _onShow,
    'fill': _fill_secgroup_tab_data,
    'retrieve': _retrieve_secgroup_tab_data
  };
  SecGroupsTab.prototype.constructor = SecGroupsTab;

  return SecGroupsTab;

  function _generate_secgroup_tab_content(str_secgroup_tab_id){
    var opts = {
      info: false,
      select: true,
      selectOptions: {
        "multiple_choice": true
      }
    };

    this.securityGroupsTable = new SecurityGroupsTable(str_secgroup_tab_id, opts);

    return TemplateHTML({
      'str_secgroup_tab_id': str_secgroup_tab_id,
      'customTagsHTML': CustomTagsTable.html(),
      'securityGroupsTableHTML': this.securityGroupsTable.dataTableHTML
    });
  }

  function _setup_secgroup_tab_content(secgroup_section, str_secgroup_tab_id) {
    this.secgroup_section = secgroup_section;

    CustomTagsTable.setup($('#'+str_secgroup_tab_id+'_custom_tags',secgroup_section));

    this.securityGroupsTable.initialize();

    Tips.setup(secgroup_section);
  }

  function _onShow(){
    this.securityGroupsTable.refreshResourceTableSelect();
  }

  function _retrieve_secgroup_tab_data(){
    var data  = {};

    $.extend(data, CustomTagsTable.retrieve(this.secgroup_section));

    var secgroups = this.securityGroupsTable.retrieveResourceTableSelect();

    if (secgroups !== undefined && secgroups.length !== 0){
      data["SECURITY_GROUPS"] = secgroups.join(",");
    }

    return data;
  }

  function _fill_secgroup_tab_data(secgroup_json){
    if (
      secgroup_json["SECURITY_GROUPS"] !== undefined &&
      secgroup_json["SECURITY_GROUPS"].length !== 0
    ){

      var secgroups = secgroup_json["SECURITY_GROUPS"].split(",");

      this.securityGroupsTable.selectResourceTableSelect({ ids: secgroups });
    }

    delete secgroup_json["SECURITY_GROUPS"];

    CustomTagsTable.fill(this.secgroup_section, secgroup_json);
  }
});
