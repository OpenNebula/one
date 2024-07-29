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
  var TemplateButtons = require('tabs/templates-tab/buttons');
  var Locale = require('utils/locale');

  var Buttons = {
    "VirtualRouterTemplate.refresh" : TemplateButtons["Template.refresh"],
    "VirtualRouterTemplate.create_dialog" : TemplateButtons["Template.create_dialog"],
//    "VirtualRouterTemplate.import_dialog" : TemplateButtons["Template.import_dialog"],
    "VirtualRouterTemplate.update_dialog" : TemplateButtons["Template.update_dialog"],
//    "VirtualRouterTemplate.instantiate_vms" : TemplateButtons["Template.instantiate_vms"],
    "VirtualRouterTemplate.instantiate_dialog" : {
      type: "create_dialog",
      text:  Locale.tr("Instantiate"),
      layout: "create_flatten"
    },
    "VirtualRouterTemplate.chown" : TemplateButtons["Template.chown"],
    "VirtualRouterTemplate.chgrp" : TemplateButtons["Template.chgrp"],
    "VirtualRouterTemplate.clone_dialog" : TemplateButtons["Template.clone_dialog"],
    "VirtualRouterTemplate.share" : TemplateButtons["Template.share"],
    "VirtualRouterTemplate.unshare" : TemplateButtons["Template.unshare"],
    "VirtualRouterTemplate.delete_dialog" : TemplateButtons["Template.delete_dialog"],
    "VirtualRouterTemplate.edit_labels" : TemplateButtons["Template.edit_labels"]
  };

  return Buttons;
});
