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
  /*
    DEPENDENCIES
   */

  var Sunstone = require('sunstone');

  /*
    CONSTANTS
   */
 
  var TemplateInfo = require('hbs!./info/html');

  /*
    CONSTANTS
   */

  var TAB_ID      = require('../tabId');
  var PANEL_ID    = require('./info/panelId');
  var RESOURCE    = "Support";
  var XML_ROOT    = "REQUEST";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = "Info";
    this.icon = "fa-info-circle";

    this.element = info[XML_ROOT];

    return this;
  }

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var message;
    if (this.element["status"] == "open") {
      message = "This request is currently being processed by our staff";
    } else if (this.element["status"] == "pending") {
      message = "This request is awaiting your response";
    }

    var comments = [];
    if (this.element["comments"]) {
      $.each(this.element["comments"], function(index, comment){
        var author = (comment["author_id"] == config["support"]["author_id"] ? config["support"]["author_name"] : 'Me');

        comments.push({
          title: '<span style="width: 100%;">'+author+' <span style="color: #999;"> - '+comment["created_at"]+'</span></span>',
          html_body: comment["html_body"]
        });
      });
    }

    return TemplateInfo({
      'element': this.element,
      'message': message,
      'comments': comments
    });
  }

  function _setup(context) {
    var that = this;

    $("#submit_support_comment").on("submit", function(){
      $("button[type=submit]", context).attr("disabled", "disabled");
      $("button[type=submit]", context).html('<i class="fas fa-spinner fa-spin"></i>');

      var request_id = that.element.id;
      var request_json = {
        "comment" : {
          "value" : $(".comment", this).val()
        },
        "solved" : $("#solved:checked", this).length > 0 ? true : false
      };

      Sunstone.runAction("Support.update", request_id, request_json);
      return false;
    });

    $(".accordion_advanced_toggle", context).trigger("click");
    $("dl.sunstone-info-tabs", context).hide();

    return false;
  }
});
