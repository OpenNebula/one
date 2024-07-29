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
  /*
    Common functions for Security Groups
   */

  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');
  var Navigation = require('utils/navigation');

  /*
  @param {Object} rule Object representing the rule as returned by OpenNebula
  Returns an object with the human readable attributes of the rule. List of attributes:
    PROTOCOL
    RULE_TYPE
    ICMP_TYPE
    RANGE
    NETWORK
  */
  function _sgRuleToSt(rule){
    var text = {};

    if(rule.PROTOCOL != undefined){
      switch(rule.PROTOCOL.toUpperCase()){
      case "TCP":
        text["PROTOCOL"] = Locale.tr("TCP");
        break;
      case "UDP":
        text["PROTOCOL"] = Locale.tr("UDP");
        break;
      case "ICMP":
        text["PROTOCOL"] = Locale.tr("ICMP");
        break;
      case "ICMPV6":
        text["PROTOCOL"] = Locale.tr("ICMPv6")
        break;
      case "IPSEC":
        text["PROTOCOL"] = Locale.tr("IPsec");
        break;
      case "ALL":
        text["PROTOCOL"] = Locale.tr("All");
        break;
      default:
        text["PROTOCOL"] = "";
      }
    } else {
      text["PROTOCOL"] = "";
    }

    if(rule.RULE_TYPE != undefined){
      switch(rule.RULE_TYPE.toUpperCase()){
      case "OUTBOUND":
        text["RULE_TYPE"] = Locale.tr("Outbound");
        break;
      case "INBOUND":
        text["RULE_TYPE"] = Locale.tr("Inbound");
        break;
      default:
        text["RULE_TYPE"] = "";
      }
    } else {
      text["RULE_TYPE"] = "";
    }

    if(rule.ICMP_TYPE != undefined){
      text["ICMP_TYPE"] = _icmpToSt(rule.ICMP_TYPE);
    } else {
      text["ICMP_TYPE"] = "";
    }

    if(rule.ICMPv6_TYPE != undefined){
      text["ICMPv6_TYPE"] = _icmpv6ToSt(rule.ICMPv6_TYPE);
    } else {
      text["ICMPv6_TYPE"] = "";
    }

    if(rule.RANGE != undefined && rule.RANGE != ""){
      text["RANGE"] = rule.RANGE;
    } else {
      text["RANGE"] = Locale.tr("All");
    }

    var network = "";

    if(rule.NETWORK_ID != undefined && rule.NETWORK_ID != ""){
      network += Navigation.link(Locale.tr("Virtual Network") + " " + rule.NETWORK_ID, "vnets-tab", rule.NETWORK_ID);
    }

    if(rule.SIZE != undefined && rule.SIZE != ""){
      if(network != ""){
        network += ":<br>";
      }

      if(rule.IP != undefined && rule.IP != ""){
        network += Locale.tr("Start") + ": " + rule.IP + ", ";
      } else if(rule.MAC != undefined && rule.MAC != ""){
        network += Locale.tr("Start") + ": " + rule.MAC + ", ";
      }

      network += Locale.tr("Size") + ": " + rule.SIZE;
    }

    if(network == ""){
      network = Locale.tr("Any");
    }

    text["NETWORK"] = network;

    return text;
  }

  function _icmpToSt(icmp_type){
    switch( icmp_type ){
      case "":    return Locale.tr("All");
      case "0":   return "0: Echo Reply";
      case "3":   return "3: Destination Unreachable";
      case "4":   return "4: Source Quench";
      case "5":   return "5: Redirect";
      case "6":   return "6: Alternate Host Address";
      case "8":   return "8: Echo";
      case "9":   return "9: Router Advertisement";
      case "10":  return "10: Router Solicitation";
      case "11":  return "11: Time Exceeded";
      case "12":  return "12: Parameter Problem";
      case "13":  return "13: Timestamp";
      case "14":  return "14: Timestamp Reply";
      case "15":  return "15: Information Request";
      case "16":  return "16: Information Reply";
      case "17":  return "17: Address Mask Request";
      case "18":  return "18: Address Mask Reply";
      case "30":  return "30: Traceroute";
      case "31":  return "31: Datagram Conversion Error";
      case "32":  return "32: Mobile Host Redirect";
      case "33":  return "33: IPv6 Where-Are-You";
      case "34":  return "34: IPv6 I-Am-Here";
      case "35":  return "35: Mobile Registration Request";
      case "36":  return "36: Mobile Registration Reply";
      case "37":  return "37: Domain Name Request";
      case "38":  return "38: Domain Name Reply";
      case "39":  return "39: SKIP";
      case "40":  return "40: Photuris";
      case "41":  return "41: ICMP messages utilized by experimental mobility protocols such as Seamoby";
      case "253": return "253: RFC3692-style Experiment 1";
      case "254": return "254: RFC3692-style Experiment 2";
      default:  return "" + icmp_type;
    }
  }

  function _icmpv6ToSt(icmpv6_type){
    switch( icmpv6_type){
      case "": return Locale.tr("All");
      case "1": return "1: Destination Unreachable";
      case "2": return "2/0: Packet too long";
      case "3": return "3: Time exceeded";
      case "4": return "4: Parameter problem";
      case "128": return "128/0: Echo request (ping)";
      case "129": return "129/0: Echo reply (pong)";
      default: return "" + icmpv6_type;
    }
  }

  /*
    @param {Object} info Object representing the Security Group as returned by OpenNebula
   */
  function _getRules(info){
    var rules = info.TEMPLATE.RULE;

    if (!rules){ //empty
      rules = [];
    } else if (rules.constructor != Array) { //>1 rule
      rules = [rules];
    }

    return rules;
  }

  return {
    'sgRuleToSt': _sgRuleToSt,
    'getRules': _getRules
  };
});
