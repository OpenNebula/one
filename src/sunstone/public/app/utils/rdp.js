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

define(function() {
  return {
    "fileText": _fileText,
    "downloadFile": _downloadFile
  };

  function _downloadFile(ip, name, credentials) {
    var file = _fileText(ip, credentials.USERNAME, credentials.PASSWORD);
          
    var link = $("<a/>", {
      href: 'data:text/plain;charset=utf-8,' + encodeURIComponent(file),
      download: name + ".rdp",
    }).css({
      display: 'none',
    }).appendTo("body");
    
    link.get(0).click(function(e) {
      e.preventDefault();
    });

    link.remove();
  }

  function _fileText(ip, username, password) {
    let file = ""
    
    file += "screen mode id:i:2\n";
    file += "desktopwidth:i:1280\n";
    file += "desktopheight:i:960\n";
    file += "session bpp:i:32\n";
    file += "winposstr:s:2,3,1430,104,2230,704\n";
    file += "compression:i:1\n";
    file += "keyboardhook:i:2\n";
    file += "displayconnectionbar:i:1\n";
    file += "disable wallpaper:i:1\n";
    file += "disable full window drag:i:1\n";
    file += "allow desktop composition:i:0\n";
    file += "allow font smoothing:i:0\n";
    file += "disable menu anims:i:1\n";
    file += "disable themes:i:0\n";
    file += "disable cursor setting:i:0\n";
    file += "bitmapcachepersistenable:i:1\n";
    file += "full address:s:" + ip + "\n";
    if (username) { file += "username:s:" + username + "\n"; }
    if (password) { file += "password:s:" + password + "\n"; }
    file += "audiomode:i:0\n";
    file += "redirectprinters:i:1\n";
    file += "redirectcomports:i:0\n";
    file += "redirectsmartcards:i:1\n";
    file += "redirectclipboard:i:1\n";
    file += "redirectposdevices:i:0\n";
    file += "autoreconnection enabled:i:1\n";
    file += "authentication level:i:0\n";
    file += "prompt for credentials:i:0\n";
    file += "negotiate security layer:i:1\n";
    file += "remoteapplicationmode:i:0\n";
    file += "alternate shell:s:\n";
    file += "shell working directory:s:\n";
    file += "gatewayhostname:s:\n";
    file += "gatewayusagemethod:i:4\n";
    file += "gatewaycredentialssource:i:4\n";
    file += "gatewayprofileusagemethod:i:0\n";
    file += "promptcredentialonce:i:1\n";
    
    return file;
  }
});
