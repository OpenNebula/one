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

  var Config = require('sunstone-config');
  var DiskTab = require('./storage/disk-tab');
  var Locale = require('utils/locale');
  var OpenNebula = require('opennebula');
  var Tips = require('utils/tips');
  var UniqueId = require('utils/unique-id');

  /*
    TEMPLATES
   */

  var TemplateHTML = require('hbs!./storage/html');

  /*
    CONSTANTS
   */

  var WIZARD_TAB_ID = require('./storage/wizardTabId');
  var LINKS_CONTAINER_ID = 'template_create_storage_tabs';
  var CONTENTS_CONTAINER_ID = 'template_create_storage_tabs_content';

  /*
    CONSTRUCTOR
   */

  function WizardTab(opts) {
    if (!Config.isTemplateCreationTabEnabled(opts.tabId, 'storage')) {
      throw "Wizard Tab not enabled";
    }

    this.wizardTabId = WIZARD_TAB_ID + UniqueId.id();
    this.icon = 'fa-server';
    this.title = Locale.tr("Storage");
    this.classes = "hypervisor";

    if(opts.listener != undefined){
      this.listener = opts.listener;
    }
  }

  WizardTab.prototype.constructor = WizardTab;
  WizardTab.prototype.html = _html;
  WizardTab.prototype.setup = _setup;
  WizardTab.prototype.onShow = _onShow;
  WizardTab.prototype.retrieve = _retrieve;
  WizardTab.prototype.fill = _fill;
  WizardTab.prototype.renameTabLinks = _renameTabLinks;
  WizardTab.prototype.addDiskTab = _addDiskTab;

  return WizardTab;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    return TemplateHTML({
      'linksContainerId': LINKS_CONTAINER_ID,
      'contentsContainerId': CONTENTS_CONTAINER_ID
    });
  }

  function _onShow() {
    $.each(this.diskTabObjects, function(id, tab) {
      tab.onShow();
    })
  }

  function _setup(context) {
    Tips.setup(context);
    var that = this;
    var ds_tm_mads = [];
    var groupDropdownOptions = '<option value="">'+Locale.tr("Default")+'</option>';

    that.numberOfDisks = 0;
    that.diskTabObjects = {};

    Foundation.reflow(context, 'tabs');

    context.on("click", "#tf_btn_disks", function() {
      that.addDiskTab(context);
      return false;
    });

    that.addDiskTab(context);

    if(that.listener != undefined){
      $(context).on("change", "input", function(){
        that.listener.notify();
      });
    }

    OpenNebula.Datastore.list({
      timeout: true,
      success: function(_, ds_list){
        $.each(ds_list, function(_, ds){
          if (ds["DATASTORE"]["TEMPLATE"]["TYPE"] === "IMAGE_DS") {
            tm_mad_system = ds["DATASTORE"]["TEMPLATE"]["TM_MAD_SYSTEM"]
            if (tm_mad_system){
              tm_mad_system.split(",").map(function(item) {
                var i = item.trim();
                if(ds_tm_mads.indexOf(i) === -1){
                  ds_tm_mads.push(i);
                  $('select#TM_MAD_SYSTEM > option.' + i, context).show()
                }
              });
            }
          }
        });
      }
    });
  }

  function _retrieve(context) {
    var templateJSON = {};

    var disksJSON = [];
    var diskJSON;
    $.each(this.diskTabObjects, function(_, diskTab) {
      diskJSON = diskTab.retrieve($("#" + diskTab.diskTabId, context));
      if (!$.isEmptyObject(diskJSON)) { disksJSON.push(diskJSON); };
    });

    $('select#TM_MAD_SYSTEM', context).each(function(index, element){
      var value = $(element).val();
      if(value){
        templateJSON["TM_MAD_SYSTEM"] = value;
      }
    });

    if (disksJSON.length > 0) {
      templateJSON["DISK"] = disksJSON;
      localStorage.setItem("disksJSON", JSON.stringify(disksJSON));
      $("#DISK_COST").trigger("change");
    };

    return templateJSON;
  }

  function _fill(context, templateJSON) {
    var that = this;
    var disks = templateJSON.DISK

    if (disks instanceof Array) {
      $.each(disks, function(diskId, diskJSON) {
        if (diskId > 0) {
          that.addDiskTab(context);
        }

        var diskTab = that.diskTabObjects[that.numberOfDisks];
        var diskContext = $('#' + diskTab.diskTabId, context);
        diskTab.fill(diskContext, diskJSON);
      });
    } else if (disks instanceof Object) {
      var diskTab = that.diskTabObjects[that.numberOfDisks];
      var diskContext = $('#' + diskTab.diskTabId, context);
      diskTab.fill(diskContext, disks);
    }

    if ( templateJSON.TM_MAD_SYSTEM ){
      $('select#TM_MAD_SYSTEM', context).val(templateJSON.TM_MAD_SYSTEM);
      if ( !$('select#TM_MAD_SYSTEM', context).val() ) {
        $('select#TM_MAD_SYSTEM', context).val("");
      }
      delete templateJSON.TM_MAD_SYSTEM;
    } else {
      $('select#TM_MAD_SYSTEM', context).val("");
    }

    if (templateJSON.DISK) {
      delete templateJSON.DISK;
    }
  }

  function _addDiskTab(context) {
    var that = this;
    that.numberOfDisks++;
    var diskTab = new DiskTab(that.numberOfDisks);

    var content = $('<div id="' + diskTab.diskTabId + '" class="disk wizard_internal_tab tabs-panel">' +
        diskTab.html() +
      '</div>').appendTo($("#" + CONTENTS_CONTAINER_ID, context));

    var a = $("<li class='tabs-title'>" +
       "<a href='#" + diskTab.diskTabId + "'>" + Locale.tr("DISK") + "</a>" +
      "</li>").appendTo($("#" + LINKS_CONTAINER_ID, context));

    Foundation.reInit($("#" + LINKS_CONTAINER_ID, context));

    $("a", a).trigger("click");

    diskTab.setup(content);
    content.attr("diskId", that.numberOfDisks);

    that.renameTabLinks(context);
    that.diskTabObjects[that.numberOfDisks] = diskTab;

    // close icon: removing the tab on click
    a.on("click", "i.remove-tab", function() {
      var target = $(this).parent().attr("href");
      var li = $(this).closest('li');
      var ul = $(this).closest('ul');
      var content = $(target);

      li.remove();
      content.remove();

      var diskId = content.attr("diskId");
      delete that.diskTabObjects[diskId];

      if (li.hasClass('is-active')) {
        $('a', ul.children('li').last()).click();
      }

      that.renameTabLinks(context);
    });
  }

  function _renameTabLinks(context) {
    $("#" + LINKS_CONTAINER_ID + " li", context).each(function(index) {
      $("a", this).html(Locale.tr("DISK") + ' ' + index + " <i class='fas fa-times-circle remove-tab'></i>");
    })

    if(this.listener != undefined){
      this.listener.notify();
    }
  }
});
