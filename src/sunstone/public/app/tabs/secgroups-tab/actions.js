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
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var DataTable = require('./datatable');
  var OpenNebulaResource = require('opennebula/securitygroup');
  var CommonActions = require('utils/common-actions');

  var RESOURCE = "SecurityGroup";
  var XML_ROOT = "SECURITY_GROUP";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Security Group created"));

  var _actions = {
    "SecurityGroup.create" : _commonActions.create(CREATE_DIALOG_ID),
    "SecurityGroup.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "SecurityGroup.list" : _commonActions.list(),
    "SecurityGroup.show" : _commonActions.show(),
    "SecurityGroup.refresh" : _commonActions.refresh(),
    "SecurityGroup.delete" : _commonActions.del(),
    "SecurityGroup.chown": _commonActions.multipleAction('chown'),
    "SecurityGroup.chgrp": _commonActions.multipleAction('chgrp'),
    "SecurityGroup.chmod": _commonActions.singleAction('chmod'),
    "SecurityGroup.rename": _commonActions.singleAction('rename'),
    "SecurityGroup.update" : _commonActions.update(),
    "SecurityGroup.update_template" : _commonActions.updateTemplate(),
    "SecurityGroup.append_template" : _commonActions.appendTemplate(),
    "SecurityGroup.update_dialog" : _commonActions.checkAndShowUpdate(),
    "SecurityGroup.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "SecurityGroup.commit": _commonActions.multipleAction('commit'),

    "SecurityGroup.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },

    "SecurityGroup.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      callback: function(request, response) {
        Sunstone.getDialog(CLONE_DIALOG_ID).hide();
        Sunstone.getDialog(CLONE_DIALOG_ID).reset();
        Sunstone.runAction('SecurityGroup.refresh');
      },
      error: Notifier.onError,
      notify: true
    },

    "SecurityGroup.commit_dialog":
      {
        type: "custom",
        call: function() {
          Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
            //header :
            headerTabId: TAB_ID,
            body : Locale.tr(
              "Please note: each time the rules are edited, the commit operation is done automatically. "+
              "<br/><br/>"+
              "This action will force the propagation of security group changes to VMs. "+
              "The operation takes time to iterate over all VMs in the security group, "+
              "the progress can be checked in the \"VMs\" panel."),
            //question :
            buttons : [
              Locale.tr("Commit"),
            ],
            submit : [
              function(){
                Sunstone.runAction('SecurityGroup.commit', Sunstone.getDataTable(TAB_ID).elements(), false);
                return false;
              }
            ]
          });

          Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
          Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
        }
      },
  };

  return _actions;
})
