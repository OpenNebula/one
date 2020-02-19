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
  var ip = require('ip');
  // var publicIp = "10.10.0.0/24";
  // var privateIp = "192.168.10.0/24";
  // var x = "192.168.10.1";
  class mapips {
    constructor(pblc, prvt) {
      this.pblc = pblc || "";
      this.prvt = prvt || "";
      this.rtn = "";
    }

    intToip(ipInt) {
      return (
        (ipInt >>> 24) +
        "." +
        ((ipInt >> 16) & 255) +
        "." +
        ((ipInt >> 8) & 255) +
        "." +
        (ipInt & 255)
      );
    }

    ipToint(ip) {
      return (
        ip.split(".").reduce(function(ipInt, octet) {
          return (ipInt << 8) + parseInt(octet, 10);
        }, 0) >>> 0
      );
    }

    mapIPprivate() {
      var dataPublic = this.pblc.split("/");
      var dataPrivate = this.prvt.split("/");
      if (
        Array.isArray(dataPrivate) &&
        Array.isArray(dataPublic) &&
        dataPublic[0] &&
        dataPublic[1] &&
        dataPrivate[0] &&
        dataPrivate[1] &&
        dataPublic[1] === dataPrivate[1]
      ) {
        var mask = ip.fromPrefixLen(dataPublic[1]);
        var networkPublic = ip.mask(dataPublic[0], mask);
        mask = ip.fromPrefixLen(dataPrivate[1]);
        var hostBytes = ip.not(mask);
        var hostsPrivate = ip.mask(dataPrivate[0], hostBytes);
        this.rtn = this.intToip(
          this.ipToint(networkPublic) + this.ipToint(hostsPrivate)
        );
      }
      return this.rtn;
    }

    renderPublicIp(nic) {
      var ipnic = nic || "";
      var rtn = '';
      if (ip.cidrSubnet(this.prvt).contains(ipnic)) {
        rtn = this.mapIPprivate();
      }
      return rtn;
    }
  }
  // var mapp = new Mapips(publicIp, privateIp);
  // console.log("->", mapp.renderPublicIp(x));
  return mapips;
});