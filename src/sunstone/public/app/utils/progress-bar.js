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
  var _quotaBarHtml = function(usage, limit, info_str, className="" ) {
    info_str = info_str || (usage + ' / ' + ((limit >= 0) ? limit : '-'));

    var value = "0";
    var max = "0";

    if (limit > 0 || (limit == 0 && usage > 0)){
      value = usage;
      max = limit;
    }

    html = $("<span/>",{'class':'progress-text right', 'style':'font-size: 12px'}).text(
      info_str
    ).add(
      $("<br/>")
    ).add(
      $("<progress/>",{'class':className, 'value':value,'max':limit})
    );
    return $("<div/>").append(html).html();
  }

  return {
    'html': _quotaBarHtml
  }
})
