/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

// File to functions about ACL

import { ACL_TYPE_ID, ACL_RIGHTS } from 'client/constants'
import { parseAcl } from 'client/utils'

/**
 * Create an ACL object to send to the API.
 *
 * @param {string} user - The user value in hex value
 * @param {string} resource - The resource value in hex value
 * @param {string} rights - The rights value in hex value
 * @param {string} zone - The zone value in hex value
 * @returns {object} - The object to send to the API
 */
export const createAclObject = (user, resource, rights, zone) => {
  // Create response
  const response = {
    user: user,
    resource: resource,
    right: rights,
  }

  // Add zone if exists
  if (zone) {
    response.zone = zone
  }

  // Return response
  return response
}

/**
 * Create an ACL object to sent to the API from a string rule like #5 HOST+VM/@12 INFO+CREATE+DELETE *.
 *
 * @param {string} rule - String rule
 * @returns {object} - The object to send to the API
 */
export const createAclObjectFromString = (rule) => {
  // Parse the rule to get values
  const ret = parseAcl(rule)

  // Create response
  const response = {
    user: ret[0],
    resource: ret[1],
    right: ret[2],
  }

  // Add zone if exists
  if (ret.length === 4) {
    response.zone = ret[3]
  }

  // Return response
  return response
}

/**
 * Create a string rule using the values from a form.
 *
 * @param {string} userType - Type of user, e.g. "#"
 * @param {number} userId - The id of the user, e.g. 4
 * @param {Array} resources - List of resources, e.g. ["VM,"TEMPLATE",IMAGE"]
 * @param {string} resourcesIdType - The type of the resources identifier, e.g. "#"
 * @param {number} resourcesId - The id user of the resources, e.g. 4
 * @param {Array} rights - List of rights, e.g. ["CREATE","USE"]
 * @param {string} zoneType - Type of the zone, e.g. "#"
 * @param {number} zoneId - The id of the user zone, e.g. 3
 * @returns {string} - ACL string rule
 */
export const createStringACL = (
  userType,
  userId,
  resources,
  resourcesIdType,
  resourcesId,
  rights,
  zoneType,
  zoneId
) => {
  // Define the string as empty string
  let acl = ''

  // User: Type of user identifier plus the user identifier, e.g. @105
  acl += userType === ACL_TYPE_ID.ALL ? userType + ' ' : userType + userId + ' '

  // Resources: List of resources separated by '+' plus the resources ID definition, e.g. VM+NET+IMAGE+TEMPLATE/#104
  resources.forEach((resource, index) => {
    if (index < resources.length - 1) acl += resource.name + '+'
    else acl += resource.name + '/'
  })

  acl +=
    resourcesIdType === ACL_TYPE_ID.ALL
      ? resourcesIdType + ' '
      : resourcesIdType + resourcesId + ' '

  // Rights: List of rights separated by '+', e.g. CREATE+USE
  rights.forEach((right, index) => {
    if (index < rights.length - 1) acl += ACL_RIGHTS[right].name + '+'
    else
      acl +=
        zoneType && zoneId
          ? ACL_RIGHTS[right].name + ' '
          : ACL_RIGHTS[right].name
  })

  // Zone: Type of zone identifier plus the zone identifier, e.g. #44
  if (zoneType && zoneId) {
    acl += zoneType + zoneId
  }

  // Return the ACL string
  return acl
}
