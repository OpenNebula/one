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
  var Sunstone = require("sunstone");
  var Notifier = require("utils/notifier");
  var OpenNebulaSupport = require("opennebula/support");
  var SupportUtils = require("../support-tab/utils/common");

  var RESOURCE = "official-support";
  var TAB_ID = require("./tabId");

  var version = function(version="", position = 0){
    var r = 0;
    if(version && version.length){
      var number = version.substring(0, version.lastIndexOf(".")+position);
      if(number && number.length){
        r = parseFloat(number);
      }
    }
    return r;
  };

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
            console.log(req.version, localVersion);
            var gitVersion = req.version;
            var splitGitVersion = gitVersion.split(".");
            var splitGitLovalVersion = localVersion.split(".");

            var major = false;
            var minor = false;

            var message = false;

            splitGitVersion.forEach(function(position, index){
              switch (index) {
                case 0:
                  if(position > localVersion[index]){
                    message = true;
                    return;
                  }
                break;
                case 1:
                  if(position > localVersion[index] && major){
                    message = true;
                    return;
                  }
                break;
                case 2:
                  if(position > localVersion[index] && major && minor){
                    message = true;
                    return;
                  }
                break;
                default:
                break;
              }
              if(position === localVersion[index]){
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
                same = true;
              }
            });

            if (message){
              var link = $("<a/>", {href:"https://opennebula.org/software/"}).text(
                "(new version available: " + version + ")"
              );
              $("#latest_version").show().empty().append(link);
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
