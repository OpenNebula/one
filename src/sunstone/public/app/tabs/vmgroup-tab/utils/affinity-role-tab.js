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
  // Dependencies
  var Locale = require('utils/locale');
  var Tips = require('utils/tips');
  var GroupRoleAffinity = require('tabs/vmgroup-tab/utils/group-role-affinity');
  var TemplateHTML = require('hbs!./affinity-role-tab/html');
  var Notifier = require('utils/notifier');

  function AffinityRoleTab(list_roles) {
    this.list_roles = list_roles;
    return this;
  } 

  AffinityRoleTab.prototype = {
    'html': _affinity_role_tab_content,
    'setup': _setup_affinity_role_tab_content,
    'onShow': _onShow,
    'retrieve': _retrieve,
    'fill': _fill,
    'refresh': _refresh,
    'removeRole': _remove_role
  };

  AffinityRoleTab.prototype.constructor = AffinityRoleTab;

  return AffinityRoleTab;

  function _affinity_role_tab_content(){
    return TemplateHTML;
  }

  function _setup_affinity_role_tab_content(context) {
    this.group_roles_affinity = {};
    var group_roles_index = 0;
    var that = this;
    $("#tf_btn_host_anti_affined").bind("click", function(){
      var rolesSt = "";
      var numRoles = 0;
      $(".roles", context).each(function(){
        if($(this)[0].selected){
          rolesSt += $(this)[0].id + ",";
          numRoles++;
        }
      });
      if(rolesSt != "" && numRoles > 1){
        _add_group_affinity_box(rolesSt.slice(0,-1), context, group_roles_index, that.group_roles_affinity, "ANTI_AFFINED");
        group_roles_index++;
      }
      else
        Notifier.notifyError(Locale.tr("You have to choose at least two roles."));
    });

    $("#tf_btn_host_affined").bind("click", function(){
      var rolesSt = "";
      var numRoles = 0;
      $(".roles",context).each(function(){
        if($(this)[0].selected){
          rolesSt += $(this)[0].id + ",";
          numRoles++;
        }
      });
      if(rolesSt != "" && numRoles > 1){
        _add_group_affinity_box(rolesSt.slice(0,-1), context, group_roles_index, that.group_roles_affinity, "AFFINED");
        group_roles_index++;
      }
      else
        Notifier.notifyError(Locale.tr("You have to choose at least two roles."));
    });
  }

  function _onShow(){

  }

  function _retrieve(context){
    var that = this;
    var roles_affinity ={};
    roles_affinity["AFFINED"] = [];
    roles_affinity["ANTI_AFFINED"] = [];

    //RETRIEVE ALL GROUPS OF AFFINITY ROLES
    $('.group_role_content', context).each(function() {
      var group_role_id = $(this).attr("group_role_id");
      var group_role = that.group_roles_affinity[group_role_id];
      roles_affinity[group_role.getAffinity()].push(group_role.retrieve($(this)));
    });
    if(roles_affinity["ANTI_AFFINED"].length == 0)
      delete roles_affinity["ANTI_AFFINED"];
    if(roles_affinity["AFFINED"].length == 0)
      delete roles_affinity["AFFINED"];
    return roles_affinity;
  }

  function _fill(context, element) {
    var that = this;
    var group_roles_index = 0;
    $.each(element.TEMPLATE, function(affinity, value){
      if(affinity == "AFFINED" || affinity == "ANTI_AFFINED"){
        if(Array.isArray(value)){
          for(dbs in value){
            _add_group_affinity_box(value[dbs], context, group_roles_index, that.group_roles_affinity, affinity);
            group_roles_index++;
          }
        }
        else {
          _add_group_affinity_box(value, context, group_roles_index, that.group_roles_affinity, affinity);
          group_roles_index++;
        }
      }
    });
  }

  function _refresh(name, oldName){
    var that = this;
    if(name){
      var index_role = this.list_roles.indexOf(oldName);
      if(index_role != -1){
        var input = $("#list_roles_select [value ='" + oldName +"']");
        input[0].id = name;
        input[0].value = name;
        input[0].innerHTML = name;
        for(group in this.group_roles_affinity){
          var index = this.group_roles_affinity[group].equal(oldName);
          if(index != -1){
            this.group_roles_affinity[group].changeGroup(index, name);
            $("#group_role_" + group)[0].innerHTML = this.group_roles_affinity[group].html();
            $(".group_roles").on("click", "i.remove_group_affinity", function() {
              $(this.parentElement.parentElement).remove();
              delete that.group_roles_affinity[index];
              return false;
            });
          }
        }
        this.list_roles[index_role] = name;
      }
      else {
        this.list_roles.push(name);
        var html = "<option id='" + name + "' class='roles' value=" + name + "> " + name + "</option>";
        $("#list_roles_select").append(html);
        $("select [value ='" + name + "']").mousedown(function(e) {
          e.preventDefault();
          $(this).prop('selected', !$(this).prop('selected'));
          return false;
        });
      }
    }
  }

  function _remove_role(name){
    if(name){
      var index_role = this.list_roles.indexOf(name);
      if(index_role != -1){
        $("#list_roles_select #" + name)[0].remove();
        delete this.list_roles[index_role];
        for(group in this.group_roles_affinity){
          var index = this.group_roles_affinity[group].equal(name);
          if(index != -1){
            if(this.group_roles_affinity[group].changeGroup(index, "") > 1){
              $("#group_role_" + group)[0].innerHTML = this.group_roles_affinity[group].html();
            }
            else {
              $("#group_role_" + group).remove();
              delete this.group_roles_affinity[group];
            }
          }
        }
      }
    }
  }

  function _add_group_affinity_box(rolesSt, context, group_roles_index, group_roles_affinity, affinity){
    for(group in group_roles_affinity){
      if(group_roles_affinity[group].retrieve(context) == rolesSt){
        Notifier.notifyError(Locale.tr("Already exists a group role with these values."));
        return false;
      }
    }

    $(".select_role").each(function(){
      $("option").prop("selected", false);
    });
    
    var that = this;
    var index = group_roles_index;
    var group_roles_id  = 'group_role_' + group_roles_index;
    var group_role = new GroupRoleAffinity(group_roles_id, rolesSt, affinity);
    group_roles_affinity[group_roles_index] = group_role;
    var html = '<div id="' + group_roles_id + '" class="group_role_content" group_role_id="' + group_roles_index + '">' + group_role.html() + '</div>';
    $("#group_vm_roles_" + affinity.toLowerCase()).append(html);
    $(".group_roles").on("click", "i.remove_group_affinity", function() {
      $(this.parentElement.parentElement).remove();
      delete group_roles_affinity[index];
      return false;
    });
  }

});
