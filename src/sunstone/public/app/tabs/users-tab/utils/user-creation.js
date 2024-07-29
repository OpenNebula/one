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

  var TemplateHTML = require('hbs!./user-creation/html');
  var Config = require('sunstone-config');
  var GroupsTable = require('tabs/groups-tab/datatable');
  var UniqueId = require('utils/unique-id');
  var ResourceSelect = require('utils/resource-select');

  /**
   * @param {string} idPrefix
   * @param  {object} [options] Options to hide/show each field. Each field is
   *                            enabled by default.
   *                            - name: true, false
   *                            - password: true, false
   *                            - auth_driver: true, false
   *                            - group_select: true, false
   */
  function UserCreation(idPrefix, options) {
    this.idPrefix = idPrefix;

    this.options = options;

    if (this.options == undefined){
      this.options = {};
    }

    if (this.options.name == undefined){
      this.options.name = true;
    }

    if (this.options.password == undefined){
      this.options.password = true;
    }

    if (this.options.auth_driver == undefined){
      this.options.auth_driver = true;
    }

    if (this.options.group_select == undefined){
      this.options.group_select = true;
    }

    if (Config.onedConf.AUTH_MAD !== undefined && Config.onedConf.AUTH_MAD['AUTHN'] !== undefined) {
      this.authMadNameList = Config.onedConf.AUTH_MAD['AUTHN'].split(',');
    } else {
      this.authMadNameList = []
    }

    this.groupsTable = new GroupsTable('user-creation-'+UniqueId.id(), {
        info: false,
        select: true,
        minColumns: true,
        selectOptions: {'multiple_choice': true}
      });
  }

  UserCreation.prototype.constructor = UserCreation;
  UserCreation.prototype.html = _html;
  UserCreation.prototype.setup = _setup;
  UserCreation.prototype.retrieve = _retrieve;
  UserCreation.prototype.enable = _enable;
  UserCreation.prototype.disable = _disable;
  UserCreation.prototype.setName = _setName;
  UserCreation.prototype.onShow = _onShow;

  return UserCreation;

  function _html(){
    return TemplateHTML({
      'idPrefix': this.idPrefix,
      'authMadNameList': this.authMadNameList,
      'groupsTableHTML': this.groupsTable.dataTableHTML
    });
  }

  /**
   * Setups the html
   * @param  {object} context jquery selector
   */
  function _setup(context){
    var that = this;

    if (this.options.name == false){
      $('#'+that.idPrefix+'_username',context).removeAttr('required');
      $('.name_row', context).hide();
    }

    if (this.options.password == false){
      $('#'+that.idPrefix+'_pass',context).removeAttr('required');
      $('.password_row', context).hide();
    }

    if (this.options.auth_driver == false){
      $('.auth_driver_row', context).hide();
    }

    if (this.options.group_select == false){
      $('.main_group_row', context).hide();
      $('.secondary_groups_row', context).hide();
    }

    $('#'+that.idPrefix+'_driver', context).change(function(){
      if ($(this).val() == "ldap"){
        $('#'+that.idPrefix+'_pass',context).removeAttr('required');
        $('.password_row', context).hide();
      } else if (that.options.password) {
        $('#'+that.idPrefix+'_pass',context).attr('required', '');
        $('.password_row', context).show();
      }
    });

    $('input[name="custom_auth"]',context).parent().hide();
    $('select#'+that.idPrefix+'_driver',context).change(function(){
      if ($(this).val() == "custom"){
        $('input[name="custom_auth"]',context).parent().show();
        $('input[name="custom_auth"]',context).attr('required', '');
      } else {
        $('input[name="custom_auth"]',context).parent().hide();
        $('input[name="custom_auth"]',context).removeAttr('required');
      }
    });

    ResourceSelect.insert({
        context: $('.main_group_div', context),
        resourceName: 'Group',
        extraOptions: '<option value="-1">'+Locale.tr("Default")+'</option>',
        emptyValue: false
      });

    this.groupsTable.initialize();
    this.groupsTable.refreshResourceTableSelect();
  }

  /**
   * @param  {object} context jquery selector
   * @return {object}         Returns an object with the attributes:
   *                                  - name
   *                                  - password
   *                                  - auth_driver
   */
  function _retrieve(context){
    var that = this;

    var user_name = $('#'+that.idPrefix+'_username',context).val();
    var user_password = $('#'+that.idPrefix+'_pass',context).val();
    var driver = $('#'+that.idPrefix+'_driver', context).val();

    if (driver == 'custom'){
      driver = $('input[name="custom_auth"]', context).val();
    } else if (driver == "ldap") {
      user_password = "-";
    }

    var gid = $("div.main_group_div .resource_list_select", context).val();

    var groups = [];

    if (gid != "-1"){
      groups = [parseInt(gid)];
    }

    var selectedGroupsList = that.groupsTable.retrieveResourceTableSelect();

    $.each(selectedGroupsList, function(i,id){
      groups.push( parseInt(id) );
    });

    return {
      "name" : user_name,
      "password" : user_password,
      "auth_driver" : driver,
      "gid" : gid,
      "gids" : groups
    };
  }

  /**
   * Disables all inputs, and removes the abide required tags
   * @param  {object} context jquery selector
   */
  function _disable(context){
    var that = this;

    $('#'+that.idPrefix+'_username',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_pass',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_confirm_password',context).attr('disabled','disabled');
    $('#'+that.idPrefix+'_driver',context).attr('disabled','disabled').removeAttr('required');
    $('#'+that.idPrefix+'_custom_auth',context).attr('disabled','disabled').removeAttr('required');
  }

  /**
   * Enables all inputs, and adds the abide required tags
   * @param  {object} context jquery selector
   */
  function _enable(context){
    var that = this;

    $('#'+that.idPrefix+'_username',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_pass',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_confirm_password',context).removeAttr("disabled");
    $('#'+that.idPrefix+'_driver',context).removeAttr("disabled").attr('required', '');
    $('#'+that.idPrefix+'_custom_auth',context).removeAttr("disabled");

    $('select#'+that.idPrefix+'_driver',context).change();
  }

  function _setName(context, name){
    $('#'+this.idPrefix+'_username',context).val(name);
  }

  function _onShow(context) {
    ResourceSelect.insert({
      context: $('.main_group_div', context),
      resourceName: 'Group',
      extraOptions: '<option value="-1">'+Locale.tr("Default")+'</option>',
      emptyValue: false
    });

    this.groupsTable.refreshResourceTableSelect();
  }
});
