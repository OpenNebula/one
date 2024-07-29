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
  var OpenNebulaSupport = require("opennebula/support");
  var SupportUtils = require("../support-tab/utils/common");

  var RESOURCE = "official-support";
  var TAB_ID = require("./tabId");

  var _actions = {
    "Support.check":{
      type: "list",
      call: OpenNebulaSupport.check,
      callback: function(req, lst, res){
        SupportUtils.showSupportConnect();
      },
      error: function(request){
        if (request && request.status && request.status >= 400) {
          SupportUtils.stopIntervalRefresh();
        }
        SupportUtils.hideSupportConnect();
      }
    },
    "Support.checkversion":{
      type: "list",
      call: OpenNebulaSupport.checkversion,
      callback: function(req, lst, res){
        if($("#footer>a").length){
          var localVersion = $("#footer>a").text().replace("OpenNebula ", "");
          if(req && req.version && req.version!=="0" && localVersion.length){
            var gitVersion = req.version;
            var splitGitVersion = gitVersion.split(".");
            var splitGitLocalVersion = localVersion.split(".");

            var major = false;
            var minor = false;
            var message = false;

            splitGitVersion.forEach(function(position, index){
              var numberPosition = parseInt(position);
              var numberLocalPosition = parseInt(splitGitLocalVersion[index]);

              switch (index) {
                case 0:
                  if(numberPosition > numberLocalPosition){
                    message = true;
                    return;
                  }
                break;
                case 1:
                  if(numberPosition > numberLocalPosition && major){
                    message = true;
                    return;
                  }
                break;
                case 2:
                  if(numberPosition > numberLocalPosition && major && minor){
                    message = true;
                    return;
                  }
                break;
                default:
                break;
              }

              if(numberPosition === numberLocalPosition){
                switch (index) {
                  case 0:
                    major = true;
                  break;
                  case 1:
                    minor = true;
                  break;
                  default:
                  break;
                }
              }

            });

            if (message){
              var link = $("<a/>", {href:"https://opennebula.io/use/"}).text(
                "(new version available: " + gitVersion + ")"
              );
              $("#latest_version").show().empty().append(link);
              $("#li_upgrade-top-tab").show();
              return;
            }

          }
        }

      },
      error: function(request){
        if (request && request.status && request.status >= 400) {
          SupportUtils.stopIntervalRefresh();
        }
        $("#latest_version").hide().empty();
      }
    }
  };
  return _actions;
});
