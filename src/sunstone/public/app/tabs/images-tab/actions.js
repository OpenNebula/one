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
  var OpenNebulaResource = require('opennebula/image');
  var OpenNebula = require('opennebula');
  var OpenNebulaAction = require('opennebula/action');
  var CommonActions = require('utils/common-actions');
  var Navigation = require('utils/navigation');

  var RESOURCE = "Image";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require('./tabId');
  var MARKETPLACEAPPS_TAB_ID = require('tabs/marketplaceapps-tab/tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var CLONE_DIALOG_ID = require('./dialogs/clone/dialogId');
  var CREATE_APP_DIALOG_ID = require('tabs/marketplaceapps-tab/form-panels/create/formPanelId');
  var IMPORT_DIALOG_ID = require('./form-panels/import/formPanelId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("Image created"));

  var _actions = {
    "Image.create" : _commonActions.create(CREATE_DIALOG_ID),
    "Image.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "Image.import_dialog" : {
      type: "custom",
      call: function() {
        Sunstone.showFormPanel(TAB_ID, IMPORT_DIALOG_ID, "import");
      }
    },
    "Image.list" : _commonActions.list(),
    "Image.show" : _commonActions.show(),
    "Image.refresh" : _commonActions.refresh(),
    "Image.delete" : _commonActions.del(),
    "Image.append_template" : _commonActions.appendTemplate(),
    "Image.update_template" : _commonActions.updateTemplate(),
    "Image.chown": _commonActions.multipleAction('chown'),
    "Image.chgrp": _commonActions.multipleAction('chgrp'),
    "Image.chmod": _commonActions.singleAction('chmod'),
    "Image.rename": _commonActions.singleAction('rename'),
    "Image.enable": _commonActions.multipleAction('enable'),
    "Image.disable": _commonActions.multipleAction('disable'),
    "Image.persistent": _commonActions.multipleAction('persistent'),
    "Image.nonpersistent": _commonActions.multipleAction('nonpersistent'),
    "Image.chtype": _commonActions.singleAction('chtype'),
    "Image.snapshot_flatten": _commonActions.singleAction("snapshot_flatten"),
    "Image.snapshot_revert": _commonActions.singleAction("snapshot_revert"),
    "Image.snapshot_delete": _commonActions.singleAction("snapshot_delete"),
    "Image.lockM": _commonActions.multipleAction('lock', false),
    "Image.lockU": _commonActions.multipleAction('lock', false),
    "Image.lockA": _commonActions.multipleAction('lock', false),
    "Image.unlock": _commonActions.multipleAction('unlock', false),
    "Image.upload_marketplace_dialog" : {
      type: "custom",
      call: function(params) {
        var selectedNodes = Sunstone.getDataTable(TAB_ID).elements();

        if (selectedNodes.length !== 1) {
          Notifier.notifyMessage(Locale.tr("Please select one (and just one) Image to export."));
          return false;
        }

        var resourceId = '' + selectedNodes[0];

        OpenNebulaResource.show({
          data : {
              id: resourceId
          },
          success: function(request, img_json){
            var img = img_json[XML_ROOT];

            if (OpenNebula.Datastore.isMarketExportSupported(img.DATASTORE_ID)){
              Sunstone.showTab(MARKETPLACEAPPS_TAB_ID);
              Sunstone.showFormPanel(MARKETPLACEAPPS_TAB_ID, CREATE_APP_DIALOG_ID, "export",
                function(formPanelInstance, context) {
                  formPanelInstance.setImageId(resourceId);
                });
            } else {
              Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
                header : Locale.tr("Error"),
                headerTabId: TAB_ID,
                body : Locale.tr("This Image resides in Datastore ") +
                  img.DATASTORE_ID + " (" + img.DATASTORE + ")" +
                  Locale.tr(". The export action is not supported for that Datastore DS_MAD driver."),
                question : "",
                buttons : [
                  Locale.tr("Ok"),
                ],
                submit : [
                  function(){
                    return false;
                  }
                ]
              });

              Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
              Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
            }
          },
          error: Notifier.onError
        });
      }
    },

    "Image.clone_dialog" : {
      type: "custom",
      call: function(){
        Sunstone.getDialog(CLONE_DIALOG_ID).show();
      }
    },
    "Image.clone" : {
      type: "single",
      call: OpenNebulaResource.clone,
      callback: function(request, response) {
        OpenNebulaAction.clear_cache("IMAGE");
        Notifier.notifyCustom(Locale.tr("Image created"),
          Navigation.link(" ID: " + response.IMAGE.ID, TAB_ID, response.IMAGE.ID),
          false);
      },
      error: Notifier.onError,
      notify: true
    },
    "Image.restore" : {
      type: "single",
      call: OpenNebulaResource.restore,
      callback: function(request, response) {
        OpenNebulaAction.clear_cache("IMAGE");
        ids = response.split(' ')
        idTemplate = ids.shift()
        Notifier.notifyCustom(Locale.tr("Template restored"),
          Navigation.link(" ID: " + idTemplate, TEMPLATES_TAB_ID, idTemplate),
          false);
        ids.forEach(id => {
          Notifier.notifyCustom(Locale.tr("Disk restored"),
          Navigation.link(" ID: " + id, TAB_ID, id),
          false);
        });
        
      },
      error: Notifier.onError,
      notify: true
    }
  };

  return _actions;
});
