/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

  var TemplateHTML = require('hbs!./role-tab/html');
  var HostsTable = require('tabs/hosts-tab/datatable');

  function RoleTab(html_role_id) {
    this.html_role_id = html_role_id;
    this.host_affined = "";
    this.host_anti_affined = "";
    return this;
  } 

  RoleTab.prototype = {
    'html': _role_tab_content,
    'setup': _setup_role_tab_content,
    'onShow': _onShow,
    'retrieve': _retrieve,
    'fill': _fill,
  };
  RoleTab.prototype.constructor = RoleTab;

  return RoleTab;

  function _role_tab_content(){
    var opts = {
      info: false,
      select: true
    };
    var optsTable = {
      info: false,
      select: true,
      selectOptions: {"multiple_choice": true}
    };

    this.hostsTable = new HostsTable("table_hosts_"+this.html_role_id, optsTable);
    this.hostsTable.initialize();

    return TemplateHTML({
      'hostsTableHTML': this.hostsTable.dataTableHTML,
      'value_host_affinity': "value_host_affinity_"+this.html_role_id,
      'btn_host_vm_roles': "btn_host_vm_roles_"+this.html_role_id,
      'group_vm_host_roles':"group_vm_host_roles_"+this.html_role_id
    })
  }

  function _setup_role_tab_content(role_section,context) {
    var that = this;
    Tips.setup(role_section);
    this.hostsTable.initialize();
    role_section.on("change", "#role_name", function(){
      $("#" + that.html_role_id +" #role_name_text").html($(this).val());
    });

    $("#btn_host_vm_roles_"+this.html_role_id).bind("click",function(){
      var selectedHostsList = that.hostsTable.retrieveResourceTableSelect();
      var selectedHosts = {};
      $.each(selectedHostsList, function(i,e){
        selectedHosts[e] = 1;
      });
      var text = "";
      for(key in selectedHosts){
        text+= key+" ,";
      }
      text = text.slice(0,-2);

      var affinity = $("#value_host_affinity_"+that.html_role_id).val();
      _generateBox(affinity,text,that);
    });

    $("#btn_HOST_ANTI_AFFINED_"+this.html_role_id).bind("click", function(){
       console.log(this.remove());
       that.host_anti_affined = "";
    });

    $("#btn_HOST_AFFINED_"+this.html_role_id).bind("click", function(){
       console.log(this.remove());
       that.host_affined = "";
    });
  }

  function _generateBox(affinity,text, that){
      var html = "";
      if(affinity == "ANTI_AFFINED"){
        if(that.host_anti_affined  == "" && text != ""){
          html = "<a value="+text+" id='btn_HOST_ANTI_AFFINED_"+that.html_role_id+"' class='button alert small radius btn_group_host_vm_roles' style='vertical-align: text-top; width: 90%; margin-left: 1em;'>\
                    <i class='fa fa-lg fa-times-circle remove_host_affinity'><label for="+text+">"+text+"</label></i>\
                    </a>\
                    <br/>";
          var div = '<div id="ANTI_AFFINED_'+that.html_role_id+'" class="group_host_role_content" typeAffinity="ANTI_AFFINED">' + html + '</div>';
          $("#group_vm_host_roles_"+that.html_role_id).append(div);
          that.host_anti_affined = text;
        } 
      }
      else{
        if(that.host_affined == "" && text != ""){
          html = "<a value="+text+" id='btn_HOST_AFFINED_"+that.html_role_id+"' class='button success small radius btn_group_host_vm_roles' style='vertical-align: text-top; width: 90%; margin-left: 1em;'>\
                    <i class='fa fa-lg fa-times-circle remove_host_affinity'><label for="+text+">"+text+"</label></i>\
                    </a>\
                    <br/>";
          var div = '<div id="AFFINED_'+that.html_role_id+'" class="group_host_role_content" typeAffinity="AFFINED">' + html + '</div>';
          $("#group_vm_host_roles_"+that.html_role_id).append(div);
          that.host_affined = text;
        }
      }
      $(".group_vm_host_roles").on("click", "i.remove_host_affinity", function() {
        var affinity = $(this.parentElement.parentElement).attr('typeAffinity');
        $(this.parentElement.parentElement).remove();
        if(affinity == "AFFINED")
          that.host_affined = "";
        else
          that.host_anti_affined = "";
        return false;
      });
  }
  function _onShow(){
    this.hostsTable.refreshResourceTableSelect();
  }

  function _retrieve(context){
    
    var role = {};
    role['NAME'] = $('input[name="name"]', context).val();
    role['VIRTUAL_MACHINES'] = $('input[name="cardinality"]', context).val();
    role['POLICY'] = $('select[name="protocol"]', context).val();
    if(this.host_affined != "")
      role['AFFINED_HOSTS'] = this.host_affined;
    if(this.host_anti_affined != "")
      role['HOST_ANTI_AFFINED'] = this.host_anti_affined;
    role = _removeEmptyObjects(role);
    return role;
  }

  function _fill(context, value, element) {
    this.host_anti_affined ="";
    this.host_affined = "";
    $("#role_name", context).val(value.NAME);
    $("#role_name", context).change();
    $("#role_cardinality", context).val(value.VIRTUAL_MACHINES);
    if(value.POLICY)
      $("#role_protocol", context).val(value.POLICY);
    else
      $("#role_protocol", context).val("NONE");
    if(value.HOST_AFFINED)
      _generateBox("AFFINED",value.HOST_AFFINED, this);
    if(value.HOST_ANTI_AFFINED)
      _generateBox("ANTI_AFFINED", value.HOST_ANTI_AFFINED, this);
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
});
