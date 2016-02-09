/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

  var RESOURCE = "MarketPlaceApp";
  var XML_ROOT = "MARKETPLACEAPP";
  var TAB_ID = require('./tabId');
  var CREATE_DIALOG_ID = require('./form-panels/create/formPanelId');

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID, XML_ROOT);

  var _actions = {
    "MarketPlaceApp.create" : _commonActions.create(CREATE_DIALOG_ID),
    "MarketPlaceApp.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "MarketPlaceApp.list" : _commonActions.list(),
    "MarketPlaceApp.show" : _commonActions.show(),
    "MarketPlaceApp.refresh" : _commonActions.refresh(),
    "MarketPlaceApp.delete" : _commonActions.del(),
    "MarketPlaceApp.chown": _commonActions.multipleAction('chown'),
    "MarketPlaceApp.chgrp": _commonActions.multipleAction('chgrp'),
    "MarketPlaceApp.chmod": _commonActions.singleAction('chmod'),
    //"MarketPlaceApp.update" : _commonActions.updateTemplate(),
    //"MarketPlaceApp.update_template" : _commonActions.updateTemplate(),
    //"MarketPlaceApp.append_template" : _commonActions.appendTemplate(),
    "MarketPlaceApp.rename": _commonActions.singleAction('rename')
  }

  return _actions;
});
