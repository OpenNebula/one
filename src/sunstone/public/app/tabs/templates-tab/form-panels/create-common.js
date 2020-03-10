 /* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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
  var Notifier = require("utils/notifier");
  var BaseFormPanel = require("utils/form-panels/form-panel");
  var Sunstone = require("sunstone");
  var Locale = require("utils/locale");
  var Tips = require("utils/tips");
  var TemplateUtils = require("utils/template-utils");
  var WizardFields = require("utils/wizard-fields");
  var OpenNebulaAction = require("opennebula/action");
  var OpenNebulaTemplate = require("opennebula/template");
  /*
    TEMPLATES
   */

  var TemplateWizardHTML = require("hbs!./create/wizard");
  var TemplateAdvancedHTML = require("hbs!./create/advanced");

  /*
    CONSTANTS
   */

  var WIZARD_TABS = [
    require("./create/wizard-tabs/general"),
    require("./create/wizard-tabs/storage"),
    require("./create/wizard-tabs/network"),
    require("./create/wizard-tabs/os"),
    require("./create/wizard-tabs/io"),
    require("./create/wizard-tabs/actions"),
    require("./create/wizard-tabs/context"),
    require("./create/wizard-tabs/scheduling"),
    require("./create/wizard-tabs/hybrid"),
    require("./create/wizard-tabs/vmgroup"),
    require("./create/wizard-tabs/other"),
    require("./create/wizard-tabs/numa")
  ];

  var TEMPLATES_TAB_ID = require("tabs/templates-tab/tabId");
  var VROUTER_TEMPLATES_TAB_ID = require("tabs/vrouter-templates-tab/tabId");

  /*
    CONSTRUCTOR
  */

  function FormPanel() {
    var create_title;
    var update_title;

    if (this.resource == "Template"){
      create_title = Locale.tr("Create VM Template");
      update_title = Locale.tr("Update VM Template");
    } else {
      create_title = Locale.tr("Create Virtual Router VM Template");
      update_title = Locale.tr("Update Virtual Router VM Template");
    }

    this.actions = {
      "create": {
        "title": create_title,
        "buttonText": Locale.tr("Create"),
        "resetButton": true
      },
      "update": {
        "title": update_title,
        "buttonText": Locale.tr("Update"),
        "resetButton": false
      }
    };

    var that = this;

    var tabId;

    if (this.resource == "Template"){
      tabId = TEMPLATES_TAB_ID;
    } else {
      tabId = VROUTER_TEMPLATES_TAB_ID;
    }

    that.wizardTabs = [];
    var wizardTabInstance;
    $.each(WIZARD_TABS, function(index, wizardTab) {
      try {
        wizardTabInstance = new wizardTab({listener: that, tabId: tabId});
        wizardTabInstance.contentHTML = wizardTabInstance.html();
        that.wizardTabs.push(wizardTabInstance);
      } catch (err) {
        console.log(err);
      }
    });

    BaseFormPanel.call(this);
  }

  FormPanel.prototype = Object.create(BaseFormPanel.prototype);
  FormPanel.prototype.constructor = FormPanel;
  FormPanel.prototype.htmlWizard = _htmlWizard;
  FormPanel.prototype.htmlAdvanced = _htmlAdvanced;
  FormPanel.prototype.setup = _setup;
  FormPanel.prototype.onShow = _onShow;
  FormPanel.prototype.submitWizard = _submitWizard;
  FormPanel.prototype.submitAdvanced = _submitAdvanced;
  FormPanel.prototype.fill = _fill;
  FormPanel.prototype.notify = _notify;
  FormPanel.prototype.retrieve = _retrieve;

  return FormPanel;

  /*
    FUNCTION DEFINITIONS
   */

  function _htmlWizard() {

    return TemplateWizardHTML({
      "formPanelId": this.formPanelId,
      "wizardTabs": this.wizardTabs
    });
  }

  function _htmlAdvanced() {
    return TemplateAdvancedHTML({formPanelId: this.formPanelId});
  }

  function _setup(context) {
    $.each(this.wizardTabs, function(index, wizardTab) {
      wizardTab.setup($("#" + wizardTab.wizardTabId, context));
    });

    Foundation.reflow(context, "tabs");
    Foundation.reflow(context, "tooltip");
  }

  function _onShow(context) {
    var that = this;
    $("a[href=\"#"+ that.wizardTabs[0].wizardTabId +"\"]", context).trigger("click");

    $.each(that.wizardTabs, function(index, wizardTab) {
      wizardTab.onShow($("#" + wizardTab.wizardTabId, context), that);
    });
  }

  function _retrieve(context) {
    var templateJSON = {};
    $.each(this.wizardTabs, function(index, wizardTab) {
      $.extend(true, templateJSON, wizardTab.retrieve($("#" + wizardTab.wizardTabId, context)));
      var a = templateJSON;
    });


    if(templateJSON["TOPOLOGY"] && templateJSON["TOPOLOGY"]["BORRAR"]){
      delete templateJSON["TOPOLOGY"];
    }

    if(
      templateJSON["TOPOLOGY"] &&
      (templateJSON["TOPOLOGY"]["HUGEPAGE_SIZE"] === undefined || 
      templateJSON["TOPOLOGY"]["HUGEPAGE_SIZE"] === null ||
      templateJSON["TOPOLOGY"]["HUGEPAGE_SIZE"].length<=0)
    ){
      delete templateJSON["TOPOLOGY"]["HUGEPAGE_SIZE"];
    }

    if(
      templateJSON["TOPOLOGY"] &&
      (templateJSON["TOPOLOGY"]["MEMORY_ACCESS"] === undefined || 
      templateJSON["TOPOLOGY"]["MEMORY_ACCESS"] === null ||
      templateJSON["TOPOLOGY"]["MEMORY_ACCESS"].length<=0)
    ){
      delete templateJSON["TOPOLOGY"]["MEMORY_ACCESS"];
    }

    // vCenter PUBLIC_CLOUD is not defined in the hybrid tab. Because it is
    // part of an array, and it is filled in different tabs, the $.extend deep
    // merge can't work. We define an auxiliary attribute for it.

    if (templateJSON["PUBLIC_CLOUD"] == undefined) {
      templateJSON["PUBLIC_CLOUD"] = [];
    }

    // PCI with TYPE=NIC is not defined in the 'other' tab. Because it is
    // part of an array, and it is filled in different tabs, the $.extend deep
    // merge can't work. We define an auxiliary attribute for it.

    if (templateJSON["NIC_ALIAS"]) {
        var alias = templateJSON["NIC_ALIAS"];

        if (alias) {
            templateJSON["NIC_ALIAS"] = alias;
        } else {
            delete templateJSON["NIC_ALIAS"];
        }
    }

    if (templateJSON["NIC_PCI"] != undefined) {
      if (templateJSON["PCI"] == undefined) {
        templateJSON["PCI"] = [];
      }

      templateJSON["PCI"] = templateJSON["PCI"].concat(templateJSON["NIC_PCI"]);

      delete templateJSON["NIC_PCI"];
    }
 
    return templateJSON;
  }

  function _submitWizard(context) {
    var templateJSON = this.retrieve(context);
    var current = {};
    cachedTemplate = OpenNebulaAction.cache("VMTEMPLATE");
    if(
      this && 
      this.resourceId && 
      cachedTemplate && 
      cachedTemplate.data &&
      Array.isArray(cachedTemplate.data)
    ){
      var id = this.resourceId;
      var currentTemplate = cachedTemplate.data.filter(function(vmtemplate){
        var rtn = false;
        if(
          vmtemplate && 
          vmtemplate.VMTEMPLATE && 
          vmtemplate.VMTEMPLATE.TEMPLATE && 
          vmtemplate.VMTEMPLATE.ID && 
          vmtemplate.VMTEMPLATE.ID === id
        ){
          return vmtemplate.VMTEMPLATE.TEMPLATE;
        }
        return rtn;
      });
      if(
        currentTemplate &&
        currentTemplate[0] &&
        currentTemplate[0].VMTEMPLATE && 
        currentTemplate[0].VMTEMPLATE.TEMPLATE
      ){
        current = currentTemplate[0].VMTEMPLATE.TEMPLATE;
      }
      if(current) {
        for (key in current) {
          if (!templateJSON[key]) {
            delete current[key]
          }
        }
      }
    }
    if (this.action == "create") {
      Sunstone.runAction(this.resource+".create", {"vmtemplate": templateJSON});
      return false;
    } else if (this.action == "update") {
      var actionUpdate = this.resource + ".update";
      var resourceId = this.resourceId;
      if(
        window &&
        window.lastInfoVmTemplate &&
        window.lastInfoVmTemplate.data &&
        templateJSON &&
        templateJSON.DISK &&
        templateJSON.HYPERVISOR &&
        templateJSON.HYPERVISOR === "vcenter"
      ){
        params = {
          data: window.lastInfoVmTemplate.data,
          success: function(request, response){
            if(response){
              var template = response.VMTEMPLATE && response.VMTEMPLATE.TEMPLATE;
              if(
                template &&
                template.DISK &&
                template.DISK instanceof Array &&
                templateJSON &&
                templateJSON.DISK &&
                templateJSON.DISK instanceof Array
              ){
                var disks = [];
                var lastDisks = template.DISK;
                var lengthLastDisks = lastDisks.length;
                var lengthNewDisks = templateJSON.DISK.length;
                var diffPositions = lengthLastDisks - lengthNewDisks;
                templateJSON.DISK.map(function(element,id){
                  var disk = element;
                  var position = diffPositions>0? id+diffPositions : id;
                  if(lastDisks && lastDisks[position] && JSON.stringify(lastDisks[position]) !== JSON.stringify(element)){
                    if(element.OPENNEBULA_MANAGED && element.OPENNEBULA_MANAGED === "NO"){
                      disk.LAST_IMAGE_DISK = (lastDisks[position] && lastDisks[position].IMAGE_ID) || (lastDisks[position] && lastDisks[position].IMAGE);
                      delete disk.OPENNEBULA_MANAGED;
                    }
                  }
                  
                  disks.push(disk);
                });
                templateJSON.DISK = disks;
                Sunstone.runAction(
                  actionUpdate,
                  resourceId,
                  TemplateUtils.templateToString(
                    $.extend( current, templateJSON)
                  )
                );
              }else{
                Sunstone.runAction(
                  actionUpdate,
                  resourceId,
                  TemplateUtils.templateToString(
                    $.extend( current, templateJSON)
                  )
                );
              }
            }
          }
        };
        OpenNebulaAction.show(params,OpenNebulaTemplate.resource);
      }else{
        Sunstone.runAction(
          actionUpdate,
          resourceId,
          TemplateUtils.templateToString(
            $.extend( current, templateJSON)
          )
        );
      }
      return false;
    }
  }

  function _submitAdvanced(context) {
    var templateStr = $("textarea#template", context).val();

    if (this.action == "create") {
      Sunstone.runAction(this.resource+".create", {"vmtemplate": {"template_raw": templateStr}});
      return false;

    } else if (this.action == "update") {
      Sunstone.runAction(this.resource+".update", this.resourceId, templateStr);
      return false;
    }
  }

  function _fill(context, element) {
    if (this.action != "update") {return;}

    this.setHeader(element);

    this.resourceId = element.ID;
    if(element && element.TEMPLATE && element.TEMPLATE.SCHED_RANK){
      $("#SCHED_RANK").val(element.TEMPLATE.SCHED_RANK);
    }
    var templateJSON = element.TEMPLATE;

    // Fills the name
    WizardFields.fillInput($("#NAME", context), element.NAME);

    // Populates the Avanced mode Tab
    $("#template", context).val(TemplateUtils.templateToString(templateJSON));

    $.each(this.wizardTabs, function(index, wizardTab) {
      wizardTab.fill($("#" + wizardTab.wizardTabId, context), templateJSON);
    });

    // After all tabs have been filled, perform a notify
    this.notify();
  }

  var in_progress = false;

  function _notify() {
    var that = this;

    // Avoid lots of calls (debounce)
    if(in_progress){
      return;
    }

    in_progress = true;

    setTimeout(function(){
      var context = that.formContext;
      var templateJSON = that.retrieve(context);

      $.each(that.wizardTabs, function(index, wizardTab) {
        if (wizardTab.notify != undefined){
          wizardTab.notify($("#" + wizardTab.wizardTabId, context), templateJSON);
        }
      });

      in_progress = false;
    }, 500);
  }
});
