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

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var OpenNebula = require('opennebula');
  var TemplateUtils = require('utils/template-utils');
  var Navigation = require('utils/navigation');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./placement/panelId');
  var RESOURCE = "VM";
  var XML_ROOT = "VM";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.panelId = PANEL_ID;
    this.title = Locale.tr("Placement");
    this.icon = "fa-sitemap";

    this.element = info[XML_ROOT];

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    var that = this;
    var html = '<div class="row"><div class="large-12 columns">\
           <table id="vm_history_table" class="dataTable">\
                    <thead>\
                      <tr>\
                          <th>' + Locale.tr("#") + '</th>\
                          <th>' + Locale.tr("Host") + '</th>\
                          <th>' + Locale.tr("Datastore") + '</th>\
                          <th>' + Locale.tr("Action") + '</th>\
                          <th>' + Locale.tr("UID") + '</th>\
                          <th>' + Locale.tr("GID") + '</th>\
                          <th>' + Locale.tr("ReqID") + '</th>\
                          <th>' + Locale.tr("Change time") + '</th>\
                          <th>' + Locale.tr("Total time") + '</th>\
                          <th colspan="2">' + Locale.tr("Prolog time") + '</th>\
                      </tr>\
                    </thead>\
                    <tbody>'                   ;

    var history = [];
    if (that.element.HISTORY_RECORDS.HISTORY) {
      if (Array.isArray(that.element.HISTORY_RECORDS.HISTORY))
          history = that.element.HISTORY_RECORDS.HISTORY;
      else if (that.element.HISTORY_RECORDS.HISTORY.SEQ)
          history = [that.element.HISTORY_RECORDS.HISTORY];
    } else {
      html += '     <tr>\
                <td colspan="8" style="width:5%">' + Locale.tr("No data available in table") + '</td>\
               </tr>'
    }

    var now = Math.round(new Date().getTime() / 1000);

    for (var i = 0; i < history.length; i++) {
      // :TIME time calculations copied from onevm_helper.rb
      var stime = parseInt(history[i].STIME, 10);

      var etime = parseInt(history[i].ETIME, 10)
      etime = etime == 0 ? now : etime;

      var dtime = etime - stime;
      // end :TIME

      //:PTIME
      var stime2 = parseInt(history[i].PSTIME, 10);
      var etime2;
      var ptime2 = parseInt(history[i].PETIME, 10);
      if (stime2 == 0)
          etime2 = 0;
      else
          etime2 = ptime2 == 0 ? now : ptime2;
      var dtime2 = etime2 - stime2;

      var uid = history[i].UID == -1 ? "-":history[i].UID;
      var gid = history[i].UID == -1 ? "-":history[i].GID;
      var req_id = history[i].UID == -1 ? "-":history[i].REQUEST_ID;

      //end :PTIME

      html += '     <tr>\
                        <td style="width:5%">' + history[i].SEQ + '</td>\
                        <td style="width:15%">' + Navigation.link(history[i].HOSTNAME, "hosts-tab", history[i].HID) + '</td>\
                        <td style="width:5%">' + Navigation.link(OpenNebula.Datastore.getName(history[i].DS_ID), "datastores-tab", history[i].DS_ID) + '</td>\
                        <td style="width:16%">' + OpenNebula.VM.migrateActionStr(parseInt(history[i].ACTION, 10)) + '</td>\
                        <td style="width:3%">' + uid + '</td>\
                        <td style="width:3%">' + gid + '</td>\
                        <td style="width:3%">' + req_id + '</td>\
                        <td style="width:16%">' + Humanize.prettyTime(history[i].STIME) + '</td>\
                        <td style="width:16%">' + Humanize.prettyDuration(dtime) + '</td>\
                        <td style="width:16%">' + Humanize.prettyDuration(dtime2) + '</td>\
                        <td></td>\
                       </tr>'
    };
    html += '</tbody>\
                 </table>\
           </div>\
         </div>'        ;

    if (that.element.USER_TEMPLATE.SCHED_MESSAGE) {
      html += '<div class="row">\
         <div class="large-12 columns">\
           <table id="vm_ds_placement_table" class="dataTable">\
                    <thead>\
                      <tr>\
                          <th align="center">' + Locale.tr("Sched Message") + '</th>\
                      </tr>\
                    </thead>\
                    <tbody>\
                       <tr>\
                        <td>' + TemplateUtils.htmlEncode(that.element.USER_TEMPLATE.SCHED_MESSAGE) + '</td>\
                      </tr>\
                    </tbody>\
           </table>\
           </div>\
         </div>'      ;
    }

    var requirements_str = TemplateUtils.htmlEncode(that.element.USER_TEMPLATE.SCHED_REQUIREMENTS ? that.element.USER_TEMPLATE.SCHED_REQUIREMENTS : "-");
    var rank_str = TemplateUtils.htmlEncode(that.element.USER_TEMPLATE.SCHED_RANK ? that.element.USER_TEMPLATE.SCHED_RANK : "-");
    var ds_requirements_str = TemplateUtils.htmlEncode(that.element.USER_TEMPLATE.SCHED_DS_REQUIREMENTS ? that.element.USER_TEMPLATE.SCHED_DS_REQUIREMENTS : "-");
    var ds_rank_str = TemplateUtils.htmlEncode(that.element.USER_TEMPLATE.SCHED_DS_RANK ? that.element.USER_TEMPLATE.SCHED_DS_RANK : "-");

    html += '<div class="row">\
       <div class="large-9 columns">\
           <table id="vm_placement_table" class="dataTable">\
                    <thead>\
                      <tr>\
                          <th colspan="2" align="center">' + Locale.tr("Placement - Host") + '</th>\
                      </tr>\
                    </thead>\
                    <tbody>\
                       <tr>\
                        <td>' + Locale.tr("Requirements") + '</td>\
                        <td>' + requirements_str + '</td>\
                      </tr>\
                       <tr>\
                        <td>' + Locale.tr("Rank") + '</td>\
                        <td>' + rank_str + '</td>\
                      </tr>\
                    </tbody>\
           </table>\
           <table id="vm_ds_placement_table" class="dataTable">\
                    <thead>\
                      <tr>\
                          <th colspan="2" align="center">' + Locale.tr("Placement - Datastore") + '</th>\
                      </tr>\
                    </thead>\
                    <tbody>\
                       <tr>\
                        <td>' + Locale.tr("DS Requirements") + '</td>\
                        <td>' + ds_requirements_str + '</td>\
                      </tr>\
                       <tr>\
                        <td>' + Locale.tr("DS Rank") + '</td>\
                        <td>' + ds_rank_str + '</td>\
                      </tr>\
                    </tbody>\
           </table>\
           </div>\
         </div>'        ;

    return html;
  }

  function _setup(context) {
  }
});
