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
  var SupportUtils = require("./utils/common");

  var RESOURCE = "official-support";
  var TAB_ID = require("./tabId");

  var majorVersion = function(version){
    var r = 0;
    if(version && version.length){
      var major = version.substring(0, version.lastIndexOf("."));
      if(major && major.length){
        r = parseFloat(major);
      }
    }
    return r;
  };

  var minorVersion = function(version){
    var r = 0;
    if(version && version.length){
      var minor = version.substring(version.lastIndexOf(".")+1);
      if(minor && minor.length){
        r = parseFloat(minor);
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
            var version = req.version;
            var remoteMajorVersion = majorVersion(version);
            var remoteMinorVersion = minorVersion(version);
            var localMajorVersion = majorVersion(localVersion);
            var localMinorVersion = minorVersion(localVersion);
            var link = $("<a/>", {href:"https://opennebula.org/software/"}).text(
              "(new version available: " + version + ")"
            );
            if(remoteMajorVersion > localMajorVersion){
              $("#latest_version").show().empty().append(link);
              return;
            }
            if(remoteMajorVersion === localMajorVersion && remoteMinorVersion > localMinorVersion){
              $("#latest_version").show().empty().append(link);
              return;
            }
          }
        }
        $("#latest_version").hide().empty();
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
