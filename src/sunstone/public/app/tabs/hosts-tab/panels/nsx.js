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
  var TemplateUtils = require('utils/template-utils');
  var Tips = require('utils/tips');
  var Notifier = require('utils/notifier');
  var Locale = require('utils/locale');
  var TemplateTable = require("utils/panel/template-table");

  /*
    TEMPLATES
   */

  var TemplateNsx = require('hbs!./nsx/html');

  /*
    CONSTANTS
   */

  var PANEL_ID = require('./nsx/panelId');
  var RESOURCE = "Host";
  var NSX = 'NSX';
  var tabID = '#hosts-tab-panelsTabs';
  var user = "NSX_USER";
  var pass = "NSX_PASSWORD";
  var submit = "nsx_submit"; 
  var showForm = true;
  var template = {};

  /*
    CONSTRUCTOR
   */

  function Panel(info) {
    var that = this;
    this.title = Locale.tr("NSX");
    this.icon = "fa-desktop";
    this.element = info[RESOURCE.toUpperCase()];

    // Hide information of the Wild VMs of the Host and the ESX Hosts
    //  in the template table. Unshow values are stored in the unshownTemplate
    //  object to be used when the host info is updated.
    that.strippedTemplateNSX = {};
    $.each(that.element.TEMPLATE, function(key, value) {
      if (key.match(/^NSX_*/)){
        that.strippedTemplateNSX[key] = value;
      }
    });

    return this;
  };

  Panel.PANEL_ID = PANEL_ID;
  Panel.prototype.html = _html;
  Panel.prototype.setup = _setup;
  Panel.prototype.onShow = _onShow;

  return Panel;

  /*
    FUNCTION DEFINITIONS
   */

  function _html() {
    showForm = true;
    if(this && this.element && this.element.IM_MAD && this.element.IM_MAD !== "vcenter"){
      showForm=false;
    }

    // NSX Atributes Table
    var templateTableHTML = TemplateTable.html(
      this.strippedTemplateNSX,
      RESOURCE,
      Locale.tr("NSX Specific Attributes"));
    
    return TemplateNsx({"templateTableHTML":templateTableHTML});
  }

  function _onShow(context){
    var that = this;
  }

  function displayTab(status){
    $(tabID).find('li').each(function(i, li){
      var element = $(li);
      if(element.text().trim() === NSX){
        if(status){
          element.show();
        }else{
          element.hide();
        }
      }
    });
  }

  function _setup(context) {
    var that = this;
    var title = $("<h4 />").text("NSX Credentials");
    var full = $("<div />",{"class": "small-12 columns"});
    var middle = $("<div />",{"class": "small-6 columns"});
    var label = $("<label />");
    var input = $("<input />",{type: 'text'});
    var form = $("#nsx-form").empty();
    var button = $("<button>");
    var userValue = (that && that.element && that.element.TEMPLATE && that.element.TEMPLATE.NSX_USER) || "";
    var passValue = (that && that.element && that.element.TEMPLATE && that.element.TEMPLATE.NSX_PASSWORD) || "";
    displayTab(showForm);
    if(showForm){
      form.append(
        full.clone().append(title)
        .add(
          middle.clone().append(
            label.clone().text(user).attr('for', user.toLowerCase()).add(
              input.clone().val(userValue).attr('id',user.toLowerCase())
            )
          )
        ).add(
          middle.clone().append(
            label.clone().text(pass).attr("for", pass.toLowerCase()).add(
              input.clone().text(passValue).attr({'id':pass.toLowerCase(), 'type': 'password'})
            )
          )
        ).add(
          full.clone().append(
            button.clone().attr({id: submit, class:'button success'}).text('Submit')
          )
        )
      );
    }

    //action
    $("#"+submit).off().on('click',function(){
      var template = that.element.TEMPLATE;
      if($('#'+user.toLowerCase()).val() && $('#'+pass.toLowerCase()).val() && template && template.NSX_MANAGER && template.NSX_TYPE){
        var sendUser = $('#'+user.toLowerCase()).val();
        var sendPass = $('#'+pass.toLowerCase()).val();
        Sunstone.runAction(RESOURCE + ".validateCredentials", {
          user:sendUser, 
          pass: sendPass, 
          nsxmngr: template.NSX_MANAGER, 
          nsxtype: template.NSX_TYPE
        },{
          success: function(response){
            template[user] = sendUser;
            template[pass] = sendPass;
            template_str  = TemplateUtils.templateToString(template);
            Sunstone.runAction(RESOURCE + ".update_template", that.element.ID,template_str);
            Notifier.notifyMessage(Locale.tr("NSX information valid"));
          }
        });
      }
    });
  }
});
