/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import {
  T,
  PROTOCOL_STRING,
  RULE_TYPE_STRING,
  ICMP_STRING,
  ICMP_V6_STRING,
} from 'client/constants'

/**
 * @typedef {object} SecurityGroupRule
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
 * Converts a security group attributes into a readable format.
 *
 * @param {SecurityGroupRule} securityGroup - Security group
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
  ...rest
}) => ({
  ID,
  NAME,
  PROTOCOL: PROTOCOL_STRING[String(protocol).toUpperCase()],
  RULE_TYPE: RULE_TYPE_STRING[String(ruleType).toUpperCase()],
  ICMP_TYPE: ICMP_STRING[+icmpType] ?? '',
  ICMPv6_TYPE: ICMP_V6_STRING[+icmpv6Type] ?? '',
  RANGE: range || T.All,
  ...rest,
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
    : securityGroups?.split(',')

  return rules.filter(({ SECURITY_GROUP_ID }) =>
    groups?.includes?.(SECURITY_GROUP_ID)
  )
}
