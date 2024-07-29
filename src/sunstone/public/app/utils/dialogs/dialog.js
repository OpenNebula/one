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
  var TemplateUtils = require("utils/template-utils");
  var Sunstone = require("sunstone");

  function BaseDialog() {
    return this;
  }

  BaseDialog.prototype = {
    "insert": _insert,
    "show": _show,
    "hide": _hide,
    "reset": _reset,
    "setNames": _setNames,
  };

  return BaseDialog;

  function _insert(dialog) {
    var that = this;
    var dialogElement = $(that.html()).appendTo("div#dialogs");
    that.setup(dialogElement);
    Foundation.reflow(dialogElement, "reveal");

    dialogElement.on("open.zf.reveal", function (e) {
      that.onShow(dialogElement);
    });

    dialogElement.on("closed.zf.reveal", function (e) {
      if (that.onClose) {
        that.onClose(dialogElement);
      }
    });

    dialogElement.on("click", ".resetDialog", function() {
      that.reset();
      that.show();
    });

    dialogElement.on("keydown", function(evt) {
        if (evt.keyCode == 27 && dialogElement[0].id == "vncVMDialog") {
          evt.keyCode = 0;
          evt.key = "";
          evt.which = 0;
        }
    });

    that.dialogElement = dialogElement;

    return that.dialogElement;
  }

  function _show() {
    this.dialogElement.foundation("open");
    return false;
  }

  function _hide() {
    this.dialogElement.foundation("close");
  }

  function _reset() {
    $('.reveal-overlay').remove();
    this.dialogElement.remove();
    this.dialogElement = this.insert();
    return false;
  }

  /**
   * Sets the ID & names of the selected objects
   *
   * @param   {Object}  opts
   *          - tabId: Optional. If given, the object names will be taken from
   *                   the selected elements of this tab's dataTable
   *          - elements: Optional. Array of objects: [{id, name}]
   */
  function _setNames(opts){
    var html = "";

    var elements = undefined;

    if (opts.elements != undefined) {
      elements = opts.elements;
    } else if ( opts.tabId != undefined &&
                Sunstone.getDataTable(opts.tabId) != undefined){

      elements = Sunstone.getDataTable(opts.tabId).elements({names: true})
    }

    if (elements) {
      if (elements.id || elements.name) {
        html = "<h6 class=\"subheader\">";

        html += elements.map(function(element){
          return (TemplateUtils.htmlEncode(element.id)+"&nbsp;"+
                  TemplateUtils.htmlEncode(element.name));
          }).join(",&emsp;")

        html += "</h6>";
      }
    }

    $(".confirm-resources-header", this.dialogElement).html(html);
  }
});
