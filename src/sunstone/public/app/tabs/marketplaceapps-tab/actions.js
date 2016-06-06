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

define(function(require) {
  var Sunstone = require('sunstone');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var CommonActions = require('utils/common-actions');
  var OpenNebulaResource = require('opennebula/marketplaceapp');
  var OpenNebula = require('opennebula');
  var OpenNebulaAction = require('opennebula/action');

  var RESOURCE = "MarketPlaceApp";
  var XML_ROOT = "MARKETPLACEAPP";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');
  var EXPORT_DIALOG_ID = require('./form-panels/export/formPanelId');
  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("MarketPlace App created"));

  var _actions = {
    "MarketPlaceApp.create" : _commonActions.create(CREATE_DIALOG_ID),
    "MarketPlaceApp.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "MarketPlaceApp.download_opennebula_dialog" : {
      type: "custom",
      call: function() {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();
        if (selected_nodes.length != 1) {
          Notifier.notifyMessage("Please select one (and just one) app to export.");
          return false;
        }

        var resourceId = "" + selected_nodes[0];

        Sunstone.resetFormPanel(TAB_ID, EXPORT_DIALOG_ID);
        Sunstone.showFormPanel(TAB_ID, EXPORT_DIALOG_ID, "export",
          function(formPanelInstance, context) {
            formPanelInstance.setResourceId(context, resourceId);
          });
      }
    },
    "MarketPlaceApp.export" : {
      type: "multiple",
      call: OpenNebulaResource.export,
      callback: function(req, response) {
        if (response['IMAGE'] !== undefined) {
          $.each(response['IMAGE'], function(i, image) {
            if (image.error != undefined){
              Notifier.notifyError(image.error.message);
            } else {
              Notifier.notifyCustom(Locale.tr("Image created"), " ID: " + image.ID, false);
            }
          });
        };

        if (response['VMTEMPLATE'] !== undefined) {
          $.each(response['VMTEMPLATE'], function(i, vmTemplate) {
            if (vmTemplate.error != undefined) {
              Notifier.notifyError(vmTemplate.error.message);
            } else if (vmTemplate.ID != -1) {
              Notifier.notifyCustom(Locale.tr("VM Template created"), " ID: " + vmTemplate.ID, false);
            }
          });
        };

        Sunstone.hideFormPanel(TAB_ID);
        OpenNebulaAction.clear_cache("IMAGE");
        OpenNebulaAction.clear_cache("VMTEMPLATE");
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: function(request, response){
        // without tab id param to work for both templates and vms tab
        Sunstone.hideFormPanelLoading();
        Notifier.onError(request, response);
      },
      notify: true
    },
    "MarketPlaceApp.download_local": {
      type: "multiple",
      call: function(params) {
        var selected_nodes = Sunstone.getDataTable(TAB_ID).elements();

        $.each(selected_nodes, function() {
          window.open("http://localhost:9869/marketplaceapp/"+this+"/download?csrftoken="+csrftoken, "_blank");
        });
      },
      elements: function(opts) {
        return Sunstone.getDataTable(TAB_ID).elements(opts);
      },
      error: Notifier.onError
    },
    "MarketPlaceApp.list" : _commonActions.list(),
    "MarketPlaceApp.show" : _commonActions.show(),
    "MarketPlaceApp.refresh" : _commonActions.refresh(),

    "MarketPlaceApp.delete" : {
      type: "multiple",
      call : function(params){
        OpenNebulaResource.show({
          data : {
              id: params.data.id
          },
          success: function(request,app_json){
            var zone = app_json[XML_ROOT].ZONE_ID;

            if (zone != config.zone_id){
              Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
                header : Locale.tr("Error"),
                body : Locale.tr(
                  "This MarketPlace App resides in Zone ") +
                  zone + " (" + OpenNebula.Zone.getName(zone) + ")" +
                  Locale.tr(". To delete it you need to switch to that Zone from the zone selector in the top-right corner." ),
                question : "",
                buttons : [
                  Locale.tr("Ok"),
                ],
                submit : [
                  function(){
                    $("a#zonelector").focus().click();
                    return false;
                  }
                ]
              });

              Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
              Sunstone.getDialog(CONFIRM_DIALOG_ID).show();
            } else {
              _commonActions.del().call(params);
            }
          },
          error: Notifier.onError
        });
      },
      callback : _commonActions.del().callback,
      elements: _commonActions.del().elements,
      error: _commonActions.del().error,
      notify: _commonActions.del().notify
    },

    "MarketPlaceApp.chown": _commonActions.multipleAction('chown'),
    "MarketPlaceApp.chgrp": _commonActions.multipleAction('chgrp'),
    "MarketPlaceApp.chmod": _commonActions.singleAction('chmod'),
    "MarketPlaceApp.enable": _commonActions.multipleAction('enable'),
    "MarketPlaceApp.disable": _commonActions.multipleAction('disable'),
    //"MarketPlaceApp.update" : _commonActions.updateTemplate(),
    "MarketPlaceApp.update_template" : _commonActions.updateTemplate(),
    "MarketPlaceApp.append_template" : _commonActions.appendTemplate(),
    "MarketPlaceApp.rename": _commonActions.singleAction('rename')
  }

  return _actions;
});
