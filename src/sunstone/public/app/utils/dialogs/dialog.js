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
//  require('foundation.reveal');

  function BaseDialog() {
    return this;
  }

  BaseDialog.prototype = {
    'insert': _insert,
    'show': _show,
    'hide': _hide,
    'reset': _reset,
  };

  return BaseDialog;

  function _insert(dialog) {
    var that = this;
    var dialogElement = $(that.html()).appendTo('div#dialogs');
    that.setup(dialogElement);
    Foundation.reflow(dialogElement, 'reveal');

    dialogElement.on('open.zf.reveal', function (e) {
      that.onShow(dialogElement);
    });

    dialogElement.on('closed.zf.reveal', function (e) {
      if (that.onClose) {
        that.onClose(dialogElement);
      }
    });

    dialogElement.on('click', '.resetDialog', function() {
      that.reset();
      that.show();
    });

    that.dialogElement = dialogElement;

    return that.dialogElement;
  }

  function _show() {
    this.dialogElement.foundation('open');
    return false;
  }

  function _hide() {
    this.dialogElement.foundation('close');
  }

  function _reset() {
    this.dialogElement.remove();
    this.dialogElement = this.insert();
    return false;
  }
})
