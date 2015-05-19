define(function(require) {
  /*
    Common functions for Security Groups
   */

  /*
    DEPENDENCIES
   */

  var Locale = require('utils/locale');

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
      text["ICMP_TYPE"] = icmp_to_st(rule.ICMP_TYPE);
    } else {
      text["ICMP_TYPE"] = "";
    }

    if(rule.RANGE != undefined && rule.RANGE != ""){
      text["RANGE"] = rule.RANGE;
    } else {
      text["RANGE"] = Locale.tr("All");
    }

    var network = "";

    if(rule.NETWORK_ID != undefined && rule.NETWORK_ID != ""){
      network += (Locale.tr("Virtual Network") + " " + rule.NETWORK_ID);
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
