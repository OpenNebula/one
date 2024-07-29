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

  function GroupRoleAffinity(html_group_role_id, valueSt, affinity) {
    this.html_group_role_id = html_group_role_id;
    this.valueSt = valueSt;
    this.affinity = affinity;
    this.values = valueSt.split(",");
    return this;
  }

  GroupRoleAffinity.prototype = {
    'html': _group_role_tab_content,
    'retrieve': _retrieve,
    'fill': _fill,
    'getAffinity': _getAffinity,
    'equal': _equals,
    'changeGroup': _change_group
  };
  GroupRoleAffinity.prototype.constructor = GroupRoleAffinity;

  return GroupRoleAffinity;

  function _group_role_tab_content(){
    var that = this;
    return _generateBox(that);
  }

  function _generateBox(that){
    var html = "";
    if(that.valueSt){
      if(that.affinity == "ANTI_AFFINED"){
        html = "<a value="+that.valueSt+" id="+that.html_group_role_id+" class='button alert small radius group_roles' style='font-size: 100%; width: 90%; margin-top:0.5em;'>\
                  <i style='float: left' class='fas fa-lg fa-times-circle remove_group_affinity'></i> "+that.valueSt+"\
                  </a>\
                  <br/>";
      }
      else{
        html = "<a value="+that.valueSt+" id="+that.html_group_role_id+" class='button success small radius group_roles' style='font-size: 100%; width: 90%; margin-top:0.5em;'>\
                    <i style='float: left' class='fas fa-lg fa-times-circle remove_group_affinity'> </i>"+that.valueSt+"\
                  </a>\
                  <br/>";
      }
    }
    return html;
  }

  function _retrieve(context){

    return this.valueSt;
  }

  function _fill(context, index, value) {
    $("#role_name", context).val(value.NAME);
    $("#role_name", context).change();
    $("#role_cardinality", context).val(value.CARDINALITY);
    $("#role_protocol", context).val(value.PROTOCOL);
  }  

  function _getAffinity(){
    return this.affinity;
  }

  function _equals(name){
    return this.values.indexOf(name);
  }

  function _change_group(index, name){
    if(name == ""){
      delete this.values[index];
      //this.values.length-=1;
    }
    else
      this.values[index] = name;
    var text = "";
    for(val in this.values){
      text+= this.values[val] +",";
    }
    text = text.slice(0,-1);
    this.valueSt = text;
    return text.split(",").length;
  }
});
