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
import {
  T,
  PROTOCOL_STRING,
  RULE_TYPE_STRING,
  ICMP_STRING,
  ICMP_V6_STRING,
  SecurityGroupRule,
  PrettySecurityGroupRule,
} from 'client/constants'

/**
 * Converts a security group attributes into a readable format.
 *
 * @param {SecurityGroupRule} securityGroup - Security group
 * @returns {PrettySecurityGroupRule} Readable attributes
 */
export const prettySecurityGroup = ({
  SECURITY_GROUP_ID: ID,
  SECURITY_GROUP_NAME: NAME,
  PROTOCOL: protocol,
  RULE_TYPE: ruleType,
  ICMP_TYPE: icmpType,
  ICMPv6_TYPE: icmpv6Type,
  RANGE: range,
  NETWORK_ID: networkId,
  ...rest
}) => ({
  ID,
  NAME,
  PROTOCOL: PROTOCOL_STRING[String(protocol).toUpperCase()],
  RULE_TYPE: RULE_TYPE_STRING[String(ruleType).toUpperCase()],
  ICMP_TYPE: ICMP_STRING[+icmpType] ?? '',
  ICMPv6_TYPE: ICMP_V6_STRING[+icmpv6Type] ?? '',
  RANGE: range || T.All,
  NETWORK_ID: networkId ?? T.Any,
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
