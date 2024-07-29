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
  var Config = require('sunstone-config');
  var UtilsConnection = require("utils/info-connection/utils");
  var Notifier = require("utils/notifier");

  return {
    "downloadWFile": _downloadWFile,
    "downloadRdpFile": _downloadRdpFile,
    "downloadImage": _downloadImage,
  };

  function _downloadRdpFile(ip, name = "vm_name", credentials = {}) {
    var file = _rdpFile(ip, credentials.USERNAME, credentials.PASSWORD);
    _download(name, ".rdp", 'data:text/plain;charset=utf-8,' + encodeURIComponent(file));
  }

  function _downloadWFile(response, vm_host, graphics_type, graphics_port) {
    var protocol = window.location.protocol;
    var proxy_host = window.location.hostname;
    var proxy_port = Config.vncProxyPort;

    var info_decode = UtilsConnection.decodeInfoConnection(response["info"]);
    var filename = info_decode["name"];

    var token = response["token"];
    var password = response["password"];

    if ($.inArray(graphics_type, ['spice', 'vnc']) < 0) {
      Notifier.notifyError(Locale.tr("Type graphics supported: vnc, spice"));
      return;
    }

    if (!graphics_type || !graphics_port) {
      Notifier.notifyError(Locale.tr("Must specify type and port in graphics options"));
      return;
    }

    if (!proxy_host || !proxy_port) {
      Notifier.notifyError(Locale.tr("Must specify proxy host and port in config"));
      return;
    }

    var proxy = protocol + "//" + proxy_host + ":" + proxy_port + "?token=" + token;
    
    var file = _wFile(graphics_type, filename, vm_host, graphics_port, proxy, password);
    _download(filename, ".vv", 'data:text/plain;charset=utf-8,' + encodeURIComponent(file));
  }

  function _downloadImage(name, image) {
    _download(name, '.png', image.toDataURL('image/png'))
  }

  function _download(name, extension, file) {
    var link = $("<a/>", {
      href: file,
      download: String(name).concat(extension),
    }).css({
      display: 'none',
    }).appendTo("body");
    
    link.get(0).click(function(e) {
      e.preventDefault();
    });

    link.remove();
  }

  function _wFile(type, title, host, port, proxy, password) {
    let file = "";

    file += "[virt-viewer]\n";
    if (type) { file += "type=" + type + "\n"; }
    if (title) { file += "title=" + title + "\n"; }
    if (host) { file += "host=" + host + "\n"; }
    if (port) { file += "port=" + port + "\n"; }
    if (proxy) { file += "proxy=" + proxy + "\n"; }
    if (password) { file += "password=" + password + "\n"; }
    file += "fullscreen=0\n";
    file += "toggle-fullscreen=shift+f11\n";
    file += "release-cursor=shift+f12\n";
    file += "secure-attention=ctrl+alt+end\n";
    file += "delete-this-file=1\n";
    
    return file;
  }

  function _rdpFile(ip, username, password) {
    let file = "";
    
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
