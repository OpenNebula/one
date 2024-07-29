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
  /*
    This module insert a row with the name of the resource.
    The row can be edited and a rename action will be sent
   */

  var TemplateEC2Tr = require('hbs!./ec2-tr/html');
  var TemplateUtils = require('utils/template-utils');
  var Sunstone = require('sunstone');
  var Config = require('sunstone-config');

  /*
    Generate the tr HTML with the name of the resource and an edit icon
    @param {String} tabName
    @param {String} resourceType Resource type (i.e: Zone, Host, Image...)
    @param {String} resourceName Name of the resource
    @returns {String} HTML row
   */
  var _html = function(resourceType, ec2_attributes) {
    this.element = ec2_attributes;
    this.valueRegion = ec2_attributes['REGION_NAME']? ec2_attributes['REGION_NAME']: "";
    this.valueSecret = ec2_attributes['EC2_SECRET']? ec2_attributes['EC2_SECRET']: "";
    this.valueAccess = ec2_attributes['EC2_ACCESS']? ec2_attributes['EC2_ACCESS']: "";
    var renameTrHTML = TemplateEC2Tr({
      'region_name': ec2_attributes['REGION_NAME'],
      'ec2_secret': ec2_attributes['EC2_SECRET'],
      'ec2_access': ec2_attributes['EC2_ACCESS']
    });

    return renameTrHTML;
  };


  function _setup(resourceType, resourceId,context) {
    var that = this;
      context.off("click", "#div_edit_region_link");
      context.on("click", "#div_edit_region_link", function() {
        var valueStr = $(".value_td_region", context).text();
        $(".value_td_region", context).html('<input class="input_edit_value_region" id="input_edit_region" type="text" value="' + that.valueRegion + '"/>');
      });

      context.off("click", "#div_edit_access_link");
      context.on("click", "#div_edit_access_link", function() {
        var valueStr = $(".value_td_access", context).text();
        $(".value_td_access", context).html('<input class="input_edit_value_access" id="input_edit_access" type="text" value="' + that.valueAccess + '"/>');
      });

      context.off("click", "#div_edit_secret_link");
      context.on("click", "#div_edit_secret_link", function() {
        var valueStr = $(".input_edit_value_secret", context).text();
        $(".value_td_secret", context).html('<input class="input_edit_value_secret" id="input_edit_secret" type="text" value="' + that.valueSecret + '"/>');
      });

      context.off("change", ".input_edit_value_region");
      context.on("change", ".input_edit_value_region", function() {
        var valueRegion = $(".input_edit_value_region").val();
        that.element["REGION_NAME"] = valueRegion;
        Sunstone.runAction(resourceType+".update_template",resourceId, TemplateUtils.templateToString(that.element));
      });

      context.off("change", ".input_edit_value_access");
      context.on("change", ".input_edit_value_access", function() {
        var valueAccess = $(".input_edit_value_access").val();
        that.element["EC2_ACCESS"] = valueAccess;
        Sunstone.runAction(resourceType+".update_template",resourceId, TemplateUtils.templateToString(that.element));
      });

      context.off("change", ".input_edit_value_secret");
      context.on("change", ".input_edit_value_secret", function() {
        var valueSecret = $(".input_edit_value_secret").val();
        that.element["EC2_SECRET"] = valueSecret;
        Sunstone.runAction(resourceType+".update_template",resourceId, TemplateUtils.templateToString(that.element));
      });
  }

  return {
    'html': _html,
    'setup': _setup
  }
});
