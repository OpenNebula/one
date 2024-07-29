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
  var TemplateUtils = require('utils/template-utils');
  var Config = require('sunstone-config');

  /**
   * Returns an html string with a link to the given tab (and element)
   *
   * @param      {string}  text       The <a> text
   * @param      {string}  tabId      e.g. vms-tab
   * @param      {string}  elementId  optional. Numeric ID
   * @return     {string}  html '<a>' element
   */
  function _link(text, tabId, elementId){
    if (!Config.isTabEnabled(tabId)) {
      return TemplateUtils.htmlEncode(text);
    }

    if (elementId != undefined){
      return '<a href="/#'+tabId+'/'+elementId+'">'+TemplateUtils.htmlEncode(text)+'</a>';
    }else{
      return '<a href="/#'+tabId+'">'+TemplateUtils.htmlEncode(text)+'</a>';
    }
  }

  return {
    "link": _link
  };
});