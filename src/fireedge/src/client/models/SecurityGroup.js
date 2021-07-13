/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
import { T } from 'client/constants'

/**
 * ICMP Codes for each ICMP type as in:
 * http://www.iana.org/assignments/icmp-parameters/
 *
 * @enum {string} Security group ICMP type
 */
const ICMP_STRING = {
  '': 'All',
  0: '0: Echo Reply',
  3: '3: Destination Unreachable',
  4: '4: Source Quench', // Deprecated
  5: '5: Redirect',
  6: '6: Alternate Host Address', // Deprecated
  8: '8: Echo',
  9: '9: Router Advertisement',
  10: '10: Router Selection',
  11: '11: Time Exceeded',
  12: '12: Parameter Problem',
  13: '13: Timestamp',
  14: '14: Timestamp Reply',
  15: '15: Information Request', // Deprecated
  16: '16: Information Reply', // Deprecated
  17: '17: Address Mask Request', // Deprecated
  18: '18: Address Mask Reply', // Deprecated
  30: '30: Traceroute', // Deprecated
  31: '31: Datagram Conversion Error', // Deprecated
  32: '32: Mobile Host Redirect', // Deprecated
  33: '33: IPv6 Where-Are-You', // Deprecated
  34: '34: IPv6 I-Am-Here', // Deprecated
  35: '35: Mobile Registration Request', // Deprecated
  36: '36: Mobile Registration Reply', // Deprecated
  37: '37: Domain Name Request', // Deprecated
  38: '38: Domain Name Reply', // Deprecated
  39: '39: SKIP', // Deprecated
  40: '40: Photuris',
  41: '41: ICMP messages utilized by experimental mobility protocols such as Seamoby',
  253: '253: RFC3692-style Experiment 1',
  254: '254: RFC3692-style Experiment 2'
}

/**
 * ICMPv6 Codes for each ICMPv6 type as in:
 * http://www.iana.org/assignments/icmpv6-parameters/
 *
 * @enum {string} Security group ICMP v6 type
 */
const ICMP_V6_STRING = {
  '': 'All',
  1: '1: Destination Unreachable',
  2: '2/0: Packet too big',
  3: '3: Time exceeded',
  4: '4: Parameter problem',
  128: '128/0: Echo request',
  129: '129/0: Echo reply'
}

/** @enum {string} Security group protocol */
const PROTOCOL_STRING = {
  TCP: T.TCP,
  UDP: T.UDP,
  ICMP: T.ICMP,
  ICMPV6: T.ICMPV6,
  IPSEC: T.IPSEC,
  ALL: T.All
}

/** @enum {string} Security group rule type */
const RULE_TYPE_STRING = {
  OUTBOUND: T.Outbound,
  INBOUND: T.Inbound
}

/**
 * Converts a security group attributes into a readable format.
 *
 * @param {object} securityGroup - Security group
 * @param {number|string} securityGroup.SECURITY_GROUP_ID - Id
 * @param {string} securityGroup.SECURITY_GROUP_NAME - Name
 * @param {string} securityGroup.PROTOCOL - Protocol
 * @param {string} securityGroup.RULE_TYPE - Rule type
 * @param {number|string} securityGroup.ICMP_TYPE - ICMP type
 * @param {number|string} securityGroup.ICMPv6_TYPE - ICMP v6 type
 * @param {number|string} securityGroup.RANGE - Range
 * @param {number|string} securityGroup.NETWORK_ID - Network id
 * @param {number|string} securityGroup.SIZE - Network size
 * @param {string} securityGroup.IP - Network IP
 * @param {string} securityGroup.MAC - Network MAC
 * @returns {{
 * SECURITY_GROUP_ID: number|string,
 * SECURITY_GROUP_NAME: string,
 * PROTOCOL: PROTOCOL_STRING,
 * RULE_TYPE: RULE_TYPE_STRING,
 * ICMP_TYPE: ICMP_STRING,
 * ICMPv6_TYPE: ICMP_V6_STRING,
 * RANGE: string,
 * NETWORK_ID: number|string,
 * SIZE: number|string,
 * IP: string,
 * MAC: string
 * }} Readable attributes
 */
export const prettySecurityGroup = ({
  SECURITY_GROUP_ID: ID,
  SECURITY_GROUP_NAME: NAME,
  PROTOCOL: protocol,
  RULE_TYPE: ruleType,
  ICMP_TYPE: icmpType,
  ICMPv6_TYPE: icmpv6Type,
  RANGE: range,
  NETWORK_ID,
  SIZE,
  IP,
  MAC
}) => ({
  ID,
  NAME,
  PROTOCOL: PROTOCOL_STRING[String(protocol).toUpperCase()],
  RULE_TYPE: RULE_TYPE_STRING[String(ruleType).toUpperCase()],
  ICMP_TYPE: ICMP_STRING[+icmpType] ?? '',
  ICMPv6_TYPE: ICMP_V6_STRING[+icmpv6Type] ?? '',
  RANGE: range || T.All,
  NETWORK_ID,
  SIZE,
  IP,
  MAC
})

/**
 * Selects security groups from OpenNebula resource.
 *
 * @param {object} resource - OpenNebula resource
 * @param {string|string[]} securityGroups - List of security group
 * @returns {object[]} List of security groups
 */
export const getSecurityGroupsFromResource = (resource, securityGroups) => {
  const rules = [resource?.TEMPLATE?.SECURITY_GROUP_RULE ?? []].flat()

  const groups = Array.isArray(securityGroups)
    ? securityGroups
    : securityGroups.split(',')

  return rules.filter(({ SECURITY_GROUP_ID }) => groups.includes?.(SECURITY_GROUP_ID))
}
