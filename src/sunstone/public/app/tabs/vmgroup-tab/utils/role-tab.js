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
  var Config = require('sunstone-config');
  var HostsTable = require('./datatable');
  var TemplateUtils = require("../../../utils/template-utils");
  var Tips = require('utils/tips');

  // Templates
  var TemplateHTML = require('hbs!./role-tab/html');

  function RoleTab(html_role_id) {
    this.html_role_id = html_role_id;
    this.host_affined = [];
    this.host_anti_affined = [];
    this.old_name = "none";
    return this;
  } 

  RoleTab.prototype = {
    'html': _role_tab_content,
    'setup': _setup_role_tab_content,
    'onShow': _onShow,
    'retrieve': _retrieve,
    'fill': _fill,
    'oldName': _get_old_name,
    'changeNameTab': _change_name_tab
  };
  RoleTab.prototype.constructor = RoleTab;

  return RoleTab;

  function _role_tab_content(){
    var optsTable = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.hostsTable = new HostsTable("table_hosts_"+this.html_role_id, optsTable);
    this.hostsTable.initialize();

    return TemplateHTML({
      'idRole': this.html_role_id,
      'hostsTableHTML': this.hostsTable.dataTableHTML,
      'value_host_affinity': "value_host_affinity_"+this.html_role_id,
      'tf_btn_host_affined': "btn_host_vm_roles_affined"+this.html_role_id,
      'tf_btn_host_anti_affined': "btn_host_vm_roles_anti_affined"+this.html_role_id,
      'group_vm_host_roles':"group_vm_host_roles_"+this.html_role_id,
      'hostAffinityEnabled': Config.isTabEnabled('hosts-tab')
    })
  }

  function _setup_role_tab_content(role_section,context) {
    var that = this;
    this.role_section = role_section;
    Tips.setup(role_section);
    this.hostsTable.initialize();

    $("#btn_host_vm_roles_anti_affined"+this.html_role_id, context).bind("click",function(){
      var selectedHostsList = that.hostsTable.retrieveResourceTableSelect();
      var selectedHosts = {};
      $.each(selectedHostsList, function(i,e){
        selectedHosts[e] = 1;
      });
      var text = "";
      for(key in selectedHosts){
        _generateBox("ANTI_AFFINED",key,that);
      }
    });

    $("#btn_host_vm_roles_affined"+this.html_role_id, context).bind("click",function(){
      var selectedHostsList = that.hostsTable.retrieveResourceTableSelect();
      var selectedHosts = {};
      $.each(selectedHostsList, function(i,e){
        selectedHosts[e] = 1;
      });

      for(key in selectedHosts){
        _generateBox("AFFINED",key,that);
      }
    });
  }

  function _generateBox(affinity,text, that){
      var html = "";
      if(affinity == "ANTI_AFFINED"){
        if(text != ""){
          if(!equals(that.host_affined, text) && !equals(that.host_anti_affined, text)){
            html = "<a value="+text+" id='btn_HOST_ANTI_AFFINED_"+that.html_role_id+"' class='button alert radius btn_group_host_vm_roles' style='margin-top: 0.5em;'>\
                      <i class='fas fa-lg fa-times-circle remove_host_affinity'> "+text+" </i>\
                      </a>";
            var div = '<div style="margin: 3px; display: inline;" id="ANTI_AFFINED_'+that.html_role_id+'" class="group_host_role_content" typeAffinity="ANTI_AFFINED">' + html + '</div>';
            $("#group_vm_host_roles_"+that.html_role_id+"_anti_affined").append(div);
            that.host_anti_affined.push(text);
          }
        } 
      }
      else{
        if(text != ""){
          if(!equals(that.host_affined, text) && !equals(that.host_anti_affined, text)){
            html = "<a value="+text+" id='btn_HOST_AFFINED_"+that.html_role_id+"' class='button success radius btn_group_host_vm_roles' style='margin-top: 0.5em;'>\
                      <i class='fas fa-lg fa-times-circle remove_host_affinity'> "+text+" </i>\
                      </a>";
            var div = '<div style="margin: 3px; display: inline;" id="AFFINED_'+that.html_role_id+'" class="group_host_role_content" typeAffinity="AFFINED">' + html + '</div>';
            $("#group_vm_host_roles_"+that.html_role_id+"_affined").append(div);
            that.host_affined.push(text);
          }
        }
      }
      $(".btn_group_host_vm_roles").on("click", "i.remove_host_affinity", function() {
        var affinity = $(this.parentElement.parentElement).attr('typeAffinity');
        $(this.parentElement.parentElement).remove();
        var index = -1;
        if(affinity == "AFFINED"){
          index = that.host_affined.indexOf(text);
          delete that.host_affined[index];
        }
        else{
          index = that.host_anti_affined.indexOf(text);
          delete that.host_anti_affined[index];
        }
        return false;
      });
      $.each($('tr', that.role_section),function(index, row) {
        if(row.childNodes[0].className == "markrowchecked"){
          var row_id = row.childNodes[0].innerText;
          $('td', row).removeClass('markrowchecked');
          $('td', row).prop('checked', false);
          $('#selected_ids_row_table_hosts_'+that.html_role_id + ' span[row_id="' + row_id + '"]', that.role_section).remove();
        }
      });
  }
  function _onShow(){
    this.hostsTable.refreshResourceTableSelect();
  }

  function _retrieve(context){
    
    var role = {};
    var text = "";
    role['NAME'] = TemplateUtils.removeHTMLTags($('input[name="name"]', context).val());
    role['VIRTUAL_MACHINES'] = TemplateUtils.removeHTMLTags($('input[name="cardinality"]', context).val());
    role['POLICY'] = TemplateUtils.removeHTMLTags($('input[name="protocol_'+this.html_role_id+'"]:checked', context).val());
    if(this.host_affined.length > 0){
      for(data in this.host_affined)
        text += this.host_affined[data] + ", ";
      text = text.slice(0,-2); 
      role['HOST_AFFINED'] = TemplateUtils.removeHTMLTags(text)
      text = "";
    }
    if(this.host_anti_affined.length > 0){
      for(data in this.host_anti_affined)
        text += this.host_anti_affined[data] + ", "; 
      text = text.slice(0,-2); 
      role['HOST_ANTI_AFFINED'] = TemplateUtils.removeHTMLTags(text);
    }
    role = _removeEmptyObjects(role);
    return role;
  }

  function _fill(context, value, element) {
    this.host_anti_affined ="";
    this.host_affined = "";
    $("#role_name", context).val(value.NAME);
    $("#role_name", context).change();
    $("#role_cardinality", context).val(value.VIRTUAL_MACHINES);
    $('input[name="protocol_'+this.html_role_id+', value='+value.POLICY+']', context).attr("checked", true);
    if(value.HOST_AFFINED)
      _generateBox("AFFINED",value.HOST_AFFINED, this);
    if(value.HOST_ANTI_AFFINED)
      _generateBox("ANTI_AFFINED", value.HOST_ANTI_AFFINED, this);
  }

  function _get_old_name() {
    return this.old_name;
  }

  function _change_name_tab(name){
    if(this.old_name != name){
      this.old_name = name;
      $("#" + this.html_role_id +" #role_name_text").html(name);
    }
  }

  //----------------------------------------------------------------------------

  function _removeEmptyObjects(obj){
    for (var elem in obj){
      var remove = false;
      var value = obj[elem];
      if (value instanceof Array){
        if (value.length == 0)
          remove = true;
        else if (value.length > 0){
          value = jQuery.grep(value, function (n) {
            var obj_length = 0;
            for (e in n)
              obj_length += 1;

            if (obj_length == 0)
              return false;

            return true;
          });

          if (value.length == 0)
            remove = true;
        }
      }
      else if (value instanceof Object){
        var obj_length = 0;
        for (e in value)
          obj_length += 1;
        if (obj_length == 0)
          remove = true;
      }else{
        value = String(value);
        if (value.length == 0)
          remove = true;
      }

      if (remove)
        delete obj[elem];
    }

    return obj;
  }

  function equals(list, term) {
    for(data in list){
      if(list[data] == term)
        return true;
    }
    return false;
  }
});
