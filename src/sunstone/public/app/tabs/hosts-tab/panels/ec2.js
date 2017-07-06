/* -------------------------------------------------------------------------- */
/* Copyright 2002-2017, OpenNebula Project, OpenNebula Systems                */
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
  /*
    DEPENDENCIES
   */
  require('foundation');
  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var Sunstone = require('sunstone');
  var TemplateUtils = require('utils/template-utils');
  var CapacityTable = require('utils/custom-tags-table');
  var EC2Tr = require('utils/panel/ec2-tr');

  /*
    TEMPLATES
   */

  var TemplateEC2 = require('hbs!./ec2/html');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./ec2/panelId');
  var RESOURCE = "Host"
  var XML_ROOT = "HOST"

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
     var that = this;
    that.title = Locale.tr("EC2");
    that.icon = "fa-info-circle";

    that.element = info[XML_ROOT];
    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */
  function _html() {
   return TemplateEC2({
      'ec2_tr': EC2Tr.html(RESOURCE, this.element.TEMPLATE),
      'capacityTableHTML': CapacityTable.html()
    });
  }

  function _setup(context) {
    var that = this;
    CapacityTable.setup(context, true, RESOURCE, this.element.TEMPLATE, this.element.ID);
    EC2Tr.setup(RESOURCE, this.element.ID, context);
    CapacityTable.fill(context, this.element.TEMPLATE.CAPACITY);
    $(".change_to_vector_attribute", context).hide();
    $(".custom_tag_value",context).focusout(function(){
        var key = $(".custom_tag_key",this.parentElement.parentElement).val();
        if(!that.element.TEMPLATE.CAPACITY){
          that.element.TEMPLATE.CAPACITY = {};
        }
        that.element.TEMPLATE.CAPACITY[key] = this.value;
        Sunstone.runAction(RESOURCE+".update_template",that.element.ID, TemplateUtils.templateToString(that.element.TEMPLATE));
      });
  }

});
