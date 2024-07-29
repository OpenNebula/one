/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import * as ACTIONS from 'client/constants/actions'

/**
 * @typedef SecurityGroupRule
 * @property {number|string} SECURITY_GROUP_ID - ID
 * @property {string} SECURITY_GROUP_NAME - Name
 * @property {string} PROTOCOL - Protocol
 * @property {string} RULE_TYPE - Rule type
 * @property {number|string} ICMP_TYPE - ICMP type
 * @property {number|string} [ICMPv6_TYPE] - ICMP v6 type
 * @property {number|string} [RANGE] - Range
 * @property {number|string} [NETWORK_ID] - Network id
 * @property {number|string} [SIZE] - Network size
 * @property {string} [IP] - Network IP
 * @property {string} [MAC] - Network MAC
 */

/**
 * @typedef PrettySecurityGroupRule
 * @property {string} ID - ID
 * @property {string} NAME - Name
 * @property {PROTOCOL_STRING} PROTOCOL - Protocol
 * @property {RULE_TYPE_STRING} RULE_TYPE - Rule type
 * @property {ICMP_STRING} ICMP_TYPE - ICMP type
 * @property {ICMP_V6_STRING} [ICMPv6_TYPE] - ICMP v6 type
 * @property {string|'All'} [RANGE] - Range
 * @property {string} [NETWORK_ID] - Network id
 * @property {string} [SIZE] - Network size
 * @property {string} [IP] - Network IP
 * @property {string} [MAC] - Network MAC
 */

/**
 * ICMP Codes for each ICMP type as in:
 * http://www.iana.org/assignments/icmp-parameters/
 *
 * @enum {string} Security group ICMP type
 */
export const ICMP_STRING = {
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
  254: '254: RFC3692-style Experiment 2',
}

/**
 * ICMPv6 Codes for each ICMPv6 type as in:
 * http://www.iana.org/assignments/icmpv6-parameters/
 *
 * @enum {string} Security group ICMP v6 type
 */
export const ICMP_V6_STRING = {
  '': 'All',
  1: '1: Destination Unreachable',
  2: '2/0: Packet too big',
  3: '3: Time exceeded',
  4: '4: Parameter problem',
  128: '128/0: Echo request',
  129: '129/0: Echo reply',
}

/** @enum {string} Security group protocol */
export const PROTOCOL_STRING = {
  TCP: T.TCP,
  UDP: T.UDP,
  ICMP: T.ICMP,
  ICMPV6: T.ICMPV6,
  IPSEC: T.IPSEC,
  ALL: T.All,
}

/** @enum {string} Security group rule type */
export const RULE_TYPE_STRING = {
  OUTBOUND: T.Outbound,
  INBOUND: T.Inbound,
}

/** @enum {string} Image actions */
export const SEC_GROUP_ACTIONS = {
  CREATE_DIALOG: 'create_dialog',
  UPDATE_DIALOG: 'update_dialog',
  DELETE: 'delete',
  COMMIT: 'commit',
  CLONE: 'clone',

  // INFORMATION
  RENAME: ACTIONS.RENAME,
  CHANGE_OWNER: ACTIONS.CHANGE_OWNER,
  CHANGE_GROUP: ACTIONS.CHANGE_GROUP,
  CHANGE_TYPE: 'chtype',
}
