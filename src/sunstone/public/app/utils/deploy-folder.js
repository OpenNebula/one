/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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
  var Locale = require('utils/locale');
  var Config = require('sunstone-config');
  var OpenNebula = require('opennebula');
  var OpenNebulaImage = require('opennebula/image');
  var UserInputs = require('utils/user-inputs');
  var WizardFields = require('utils/wizard-fields');
  var DeployFolderTemplate = require('hbs!./deploy-folder/html');

  return {
    'setup': _setup,
    'fill': _fill,
    'retrieveChanges': _retrieveChanges
  };

  function _setup(context) {
    if (!Config.isFeatureEnabled("vcenter_deploy_folder")){
      $(context).remove();
    }
  }

  function _fill(context, element) {

    if (Config.isFeatureEnabled("vcenter_deploy_folder")){
      var deployFolderContext = context;
      var template_public_cloud_type = element.TEMPLATE.PUBLIC_CLOUD.TYPE

      if ($.isEmptyObject(template_public_cloud_type)) {
        deployFolderContext.html("");
      } else {
        if (template_public_cloud_type === 'vcenter') {
          var deploy_folder = element.TEMPLATE.DEPLOY_FOLDER
          deployFolderContext.html(DeployFolderTemplate());
          $("#deploy_folder_input", deployFolderContext).val(deploy_folder);
          $("#deploy_folder_input", deployFolderContext).data("original_value",deploy_folder);
        } else {
          deployFolderContext.html("");
        }
      }
    }
  }


  function _retrieveChanges(context) {

    var templateJSON = WizardFields.retrieve(context);
    var fields = $('[wizard_field]', context);

    fields.each(function() {
      var field_name = $(this).attr('wizard_field');
      if (templateJSON[field_name] == $(this).data("original_value")){
          delete templateJSON[field_name];
      }
    });

    return templateJSON;
  }
});