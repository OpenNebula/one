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

define(function(require){
  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Humanize = require('utils/humanize');
  var Config = require('sunstone-config');
  var Sunstone = require('sunstone');
  var Tree = require('utils/tree');
  var TemplateHtml = require('hbs!./snapshots/html');
  var TemplateEmptyTable = require('hbs!utils/tab-datatable/empty-table');

  var CONFIRM_DIALOG_ID = require('utils/dialogs/generic-confirm/dialogId');

  /*
    CONSTANTS
   */

  var TAB_ID = require('../tabId');
  var PANEL_ID = require('./snapshots/panelId');
  var RESOURCE = "Image";
  var XML_ROOT = "IMAGE";

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    this.title = Locale.tr("Snapshots");
    this.icon = "fa-camera";

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

    var snapshotsHTML = TemplateEmptyTable();

    if (!$.isEmptyObject(this.element.SNAPSHOTS)){
      var snapshots = this.element.SNAPSHOTS.SNAPSHOT;

      if (!Array.isArray(snapshots)){
        snapshots = [snapshots];
      }

      var treeRoot = {
        htmlStr : '',
        subTree : []
      };

      var indexedSnapshots = {};
      var noParent = [];

      $.each(snapshots, function(){
        indexedSnapshots[this.ID] = this;

        if(this.PARENT == "-1"){
          noParent.push(this.ID);
        }
      });

      $.each(noParent, function(){
        treeRoot.subTree.push(
          _makeTree(indexedSnapshots[this], indexedSnapshots)
        );
      });

      snapshotsHTML = Tree.html(treeRoot);
    }

    return TemplateHtml({snapshotsHTML: snapshotsHTML});
  }

  function _setup(context) {
    var that = this;

    $(".snapshot_check_item", context).on("change", function() {
      // Unselect other check inputs
      var checked = $(this).is(':checked');
      $('.snapshot_check_item:checked', context).prop('checked', false);
      $(this).prop('checked', checked);

      // Enable/disable buttons
      if ($(this).is(":checked")) {
        $("#snapshot_flatten", context).prop('disabled', false);
        $("#snapshot_revert", context).prop('disabled', false);
        $("#snapshot_delete", context).prop('disabled', false);
      } else {
        $("#snapshot_flatten", context).prop('disabled', true);
        $("#snapshot_revert", context).prop('disabled', true);
        $("#snapshot_delete", context).prop('disabled', true);
      }
    });

    if (Config.isTabActionEnabled("images-tab", "Image.snapshot_flatten")) {
      $("#snapshot_flatten", context).on('click', function() {
        var snapshot_id = $(".snapshot_check_item:checked", context).attr('snapshot_id');

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will delete all the other image snapshots"),
          //question :
          submit : function(){
            Sunstone.runAction('Image.snapshot_flatten', that.element.ID,
              { "snapshot_id": snapshot_id});
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }

    if (Config.isTabActionEnabled("images-tab", "Image.snapshot_revert")) {
      $("#snapshot_revert", context).on('click', function() {
        var snapshot_id = $(".snapshot_check_item:checked", context).attr('snapshot_id');

        Sunstone.runAction('Image.snapshot_revert', that.element.ID,
          { "snapshot_id": snapshot_id});

        return false;
      });
    }

    if (Config.isTabActionEnabled("images-tab", "Image.snapshot_delete")) {
      $("#snapshot_delete", context).on('click', function() {
        var snapshot_id = $(".snapshot_check_item:checked", context).attr('snapshot_id');

        Sunstone.getDialog(CONFIRM_DIALOG_ID).setParams({
          //header :
          headerTabId: TAB_ID,
          body : Locale.tr("This will delete the image snapshot "+snapshot_id),
          //question :
          submit : function(){
            Sunstone.runAction('Image.snapshot_delete', that.element.ID,
              { "snapshot_id": snapshot_id});
          }
        });

        Sunstone.getDialog(CONFIRM_DIALOG_ID).reset();
        Sunstone.getDialog(CONFIRM_DIALOG_ID).show();

        return false;
      });
    }
    return false;
  }

  function _makeTree(snapshot, indexedSnapshots){
    var SPACE = '&nbsp;&nbsp;&nbsp;&nbsp;';

    var subTree = [];

    if (snapshot.CHILDREN){
      $.each(snapshot.CHILDREN.split(","), function(){
        subTree.push(
          _makeTree(indexedSnapshots[this], indexedSnapshots)
        );
      });
    }

    var html = '<div class="snapshot_row nowrap">'+
      '<input class="snapshot_check_item" type="checkbox" snapshot_id="'+snapshot.ID+'"/>'+
      SPACE + snapshot.ID + SPACE;

    var active = (snapshot.ACTIVE == "YES");

    if(active){
      html += '<i class="fas fa-play-circle fa-lg" title="'+
              Locale.tr("Active")+'"/>' + SPACE;
    }

    html += Humanize.prettyTime(snapshot.DATE) + SPACE +
            Humanize.sizeFromMB(snapshot.SIZE) + SPACE +
            (snapshot.NAME ? snapshot.NAME + SPACE : '');

    html += '</div>';

    return {
      htmlStr : html,
      subTree : subTree
    };
  }
});
