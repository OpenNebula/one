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

define(function(require){

  /*
    DEPENDENCIES
  */
  var TemplateVms = require('hbs!./vms/html');
  var Locale = require('utils/locale');
  var VMsTable = require('tabs/vms-tab/datatable');

  /*
    CONSTANTS
  */
  var PANEL_ID = require('./vms/panelId');
  var VMS_TABLE_ID = PANEL_ID + "VMsTable";
  var RESOURCE = "VMGroup";
  var XML_ROOT = "VM_GROUP";
  var indexTable=0;

  /*
    CONSTRUCTOR
   */
  function Panel(info) {
    this.title = Locale.tr("VMs");
    this.icon = "fa-cloud";
    this.element = info[XML_ROOT].ROLES.ROLE;

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
  */
  function _html(){
  	var vms = [];
  	this.vmsTable = [];
  	this.vmsTableHTML = [];
  	var that = this;

  	if (this.element != undefined){
  		if(Array.isArray(this.element)){
  			$.each(this.element, function(){
  				if(this.VMS){
  					vms = this.VMS.split(",");
  					var opts = {
					      info: true,
					      select: true,
					      selectOptions: {
					        read_only: true,
					        fixed_ids: vms
					      }
					    };
					var table = new VMsTable(VMS_TABLE_ID + indexTable, opts);
					that.vmsTable.push(table);
          var html={}
          html.name = this.NAME;
          html.table = table.dataTableHTML;
          that.vmsTableHTML.push(html);
          indexTable++;
  				}
  			});	
  		}
  		else {
  			if(this.VMS){
  				vms = this.VMS.split(",");
  				var opts = {
					      info: true,
					      select: true,
					      selectOptions: {
					        read_only: true,
					        fixed_ids: vms
					      }
					    };

				var table = new VMsTable(VMS_TABLE_ID + indexTable, opts);
				that.vmsTable.push(table);
        var html={}
				html.name = Locale.tr(this.NAME);
        html.table = table.dataTableHTML;
        that.vmsTableHTML.push(html);
				indexTable++;
  			}
  		}
    }
    if(that.vmsTable.length == 0){
      vms = [];
      var opts = {
        info: true,
        select: true,
        selectOptions: {
          read_only: true,
          fixed_ids: vms
        }
      };
      var table = new VMsTable(VMS_TABLE_ID + indexTable, opts);
      that.vmsTable.push(table);
      var html={}
      html.name = Locale.tr("Role");
      html.table = table.dataTableHTML;
      that.vmsTableHTML.push(html);
    }

    return TemplateVms({
      'arrayDataTable': this.vmsTableHTML
    });
  }

  function _setup(context) {

  	$.each(this.vmsTable, function(){
  		this.initialize();
    	this.refreshResourceTableSelect();
  	});
  		
    return false;
  }
});	