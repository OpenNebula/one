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
  var CommonActions = require('utils/common-actions');
  var OpenNebulaResource = require('opennebula/marketplace');

  var RESOURCE = "MarketPlace";
  var XML_ROOT = "MARKETPLACE";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("MarketPlace created"));

  var _actions = {
    "MarketPlace.create" : _commonActions.create(CREATE_DIALOG_ID),
    "MarketPlace.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "MarketPlace.list" : _commonActions.list(),
    "MarketPlace.show" : _commonActions.show(),
    "MarketPlace.refresh" : _commonActions.refresh(),
    "MarketPlace.delete" : _commonActions.del(),
    "MarketPlace.chown": _commonActions.multipleAction('chown'),
    "MarketPlace.chgrp": _commonActions.multipleAction('chgrp'),
    "MarketPlace.chmod": _commonActions.singleAction('chmod'),
    "MarketPlace.update" : _commonActions.update(),
    "MarketPlace.update_template" : _commonActions.updateTemplate(),
    "MarketPlace.append_template" : _commonActions.appendTemplate(),
    "MarketPlace.update_dialog" : _commonActions.checkAndShowUpdate(),
    "MarketPlace.show_to_update" : _commonActions.showUpdate(CREATE_DIALOG_ID),
    "MarketPlace.rename": _commonActions.singleAction('rename'),
    "MarketPlace.enable" : _commonActions.multipleAction('enable'),
    "MarketPlace.disable": _commonActions.multipleAction('disable'),
  }

  return _actions;
});
