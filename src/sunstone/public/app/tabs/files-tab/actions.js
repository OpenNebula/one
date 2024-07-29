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
  var CommonActions = require("utils/common-actions");
  var Locale = require("utils/locale");
  var OpenNebulaResource = require("opennebula/image");

  var RESOURCE = "File";
  var XML_ROOT = "IMAGE";
  var TAB_ID = require("./tabId");
  var CREATE_DIALOG_ID = require("./form-panels/create/formPanelId");

  var _commonActions = new CommonActions(OpenNebulaResource, RESOURCE, TAB_ID,
    XML_ROOT, Locale.tr("File created"));

  var _actions = {
    "File.create" : _commonActions.create(CREATE_DIALOG_ID),
    "File.create_dialog" : _commonActions.showCreate(CREATE_DIALOG_ID),
    "File.list" : _commonActions.list(),
    "File.show" : _commonActions.show(),
    "File.refresh" : _commonActions.refresh(),
    "File.delete" : _commonActions.del(),
    "File.update_template" : _commonActions.updateTemplate(),
    "File.append_template" : _commonActions.appendTemplate(),
    "File.chown": _commonActions.multipleAction("chown"),
    "File.chgrp": _commonActions.multipleAction("chgrp"),
    "File.chmod": _commonActions.singleAction("chmod"),
    "File.rename": _commonActions.singleAction("rename"),
    "File.enable": _commonActions.multipleAction("enable"),
    "File.disable": _commonActions.multipleAction("disable"),
    "File.chtype": _commonActions.singleAction("chtype")
  };

  return _actions;
});
