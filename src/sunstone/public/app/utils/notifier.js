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
  require("jgrowl");

  var Locale = require("utils/locale");

  //Notification of submission of action
  var _notifySubmit = function(action, args, extra_param) {
    var action_text = action.replace(/OpenNebula\./, "").replace(/\./, " ");

    var msg = "";
    if (!args || (typeof args === "object" && args.constructor != Array)) {

      msg += action_text;
    } else {

      msg += action_text + ": " + args;
    };
    if (extra_param && extra_param.constructor != Object) {
      msg += " >> " + extra_param;
    };

    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right"});
  };

  //Notification on error
  var _notifyError = function(msg, target=undefined, context=undefined) {
    if(target && context){
      var tab = $(target).find($(".is-invalid-input",context));
      tab.parents().each(
        function(id,element){
          var parent = $(element); 
          if(parent.hasClass("tabs-panel")){
            var tabs = parent.parent().siblings($(".tabs",context));
            if(tabs && tabs.length){
              var find = tabs.find($("a[href$=\"#"+parent.attr("id")+"\"]",context))
              if(find && find.length){
                find.click();
                return false;
              }
            }
          }
        }
      );
    }
    $.jGrowl(msg, {theme: "jGrowl-notify-error", position: "bottom-right", sticky: true});
  };

  //Standard notification
  var _notifyMessage = function(msg) {
    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right"});
  };

  var _notifyCustom = function(title, msg, sticky) {
    msg = (title ? title + "</br>" : "") + msg;
    $.jGrowl(msg, {theme: "jGrowl-notify-submit", position: "bottom-right", sticky: sticky});
  };

  //standard handling for the server errors on ajax requests.
  //Pops up a message with the information.
  var _onError = function(request, error_json, container) {
    var method;
    var action;
    var object;
    var id;
    var reason;
    var m;
    var message = error_json.error.message;

    //redirect to login if unauthenticated
    if (error_json.error.http_status == "401") {
      window.location.href = "login";
      return false;
    };

    if (!message) {
      _notifyError(Locale.tr("Cannot contact server: is it running and reachable?"));
      return false;
    };

    if (error_json.error.http_status == "404") {
      _notifyError(message);
      return false;
    }

    if (container) {
      container.show();
      return false;
    }

    if (message.match(/^Network is unreachable .+$/)) {
      _notifyError(Locale.tr("Network is unreachable: is OpenNebula running?"));
      return false;
    };

    //Parse known errors:
    var get_error = /^\[(\w+)\] Error getting ([\w ]+) \[(\d+)\]\.$/;
    var auth_error = /^\[(\w+)\] User \[(\d+)\] not authorized to perform action on ([\w ]+).$/;

    if (m = message.match(get_error)) {
      method  = m[1];
      action  = "Show";
      object  = m[2];
      id      = m[3];
    } else if (m = message.match(auth_error)) {
      method = m[1];
      object     = m[3];
      reason = Locale.tr("Unauthorized");
    };

    if (m) {
      var rows;
      var i;
      var value;
      rows = ["method", "action", "object", "id", "reason"];
      message = "";
      for (i = 0; i < rows.length; i++) {
        key = rows[i];
        value = eval(key);
        if (value)
            message += "<tr><td class=\"key_error\">" + key + "</td><td>" + value + "</td></tr>";
      }
      message = "<table>" + message + "</table>";
    };

    _notifyError(message);
    return true;
  };

  return {
    "notifySubmit": _notifySubmit,
    "notifyError": _notifyError,
    "notifyMessage": _notifyMessage,
    "notifyCustom": _notifyCustom,
    "onError": _onError
  };
});
