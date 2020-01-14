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
    Generate an Object containing the html for the real and allocated MEMORY
   */

  /*
    FUNCTION DEFINITIONS
   */

  function _html(element) {
    var hostShare = element.HOST_SHARE;

    var datastores = []
    if ($.isArray(hostShare.DATASTORES.DS))
      datastores = hostShare.DATASTORES.DS
    else if (!$.isEmptyObject(hostShare.DATASTORES.DS))
      datastores = [hostShare.DATASTORES.DS]
    else
      return "";

    var datastoreBars = [];
    $.each(datastores, function(index, value){
      datastoreBars.push({
        'datastoreId': value.ID,
        'datastoreBar': DatastoreCapacityBar.html(value)
      })
    });

    return TemplateDatastoresCapacityTable({'datastoreBars': datastoreBars});

  /*
    @param {Object} info Object representing the Host as returned by OpenNebula
    @param {Boolean} hostShareFlag if true the info param is the HOST_SHARE element instead of HOSt
   */
  var html_pepe = function(resourcePoolItems) {
    str = ''

//    $.each(resourcePoolItems, function(key, value) {
//        str += "<div class=\"column\">" +
 //           "<ul class=\"provision-pricing-table menu vertical\">" +
 //               "<li class=\"provision-title\">" +
 //                   "<a class=\"provision_info_vm_button\">" +
  //                      value["NAME"] +
   //                 "</a>" +
    //            "</li>" +
     //           "<li class=\"\"></li>";

    //    $.each(value, function(key, value) {
     //   console.log(key);
   //     console.log(value);
    //        if (key !== "NAME")
     //           str += "<table><div class=\"key_td\">" + key + "</div><div class=\"value_td\">" + value + "</div></table>";
       // });
       // str += "</ul></div>";
    //});

    return str;
  }

  return {
    'html': _html
  }
})
