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

// File to functions about ACL

import { ACL_TYPE_ID, ACL_RIGHTS, T, ACL_USERS } from 'client/constants'
import { parseAcl } from 'client/utils'

import { Tr } from 'client/components/HOC'
const _ = require('lodash')

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

  let userString = ''
  let resourcesString = ''
  const resourcesIdentifierString = ''
  let rightsString = ''
  let zoneString

  // User: Type of user identifier plus the user identifier, e.g. @105
  if (userType) {
    if (userType === ACL_TYPE_ID.ALL) {
      userString += userType
    } else if (
      userType === ACL_TYPE_ID.INDIVIDUAL ||
      userType === ACL_TYPE_ID.GROUP
    )
      userString += userType + (userId ?? '')
  }

  // Resources: List of resources separated by '+' plus the resources ID definition, e.g. VM+NET+IMAGE+TEMPLATE/#104
  resources?.forEach((resource, index) => {
    if (index < resources.length - 1) resourcesString += resource.name + '+'
    else resourcesString += resource.name + '/'
  })

  if (resourcesIdType) {
    if (resourcesIdType === ACL_TYPE_ID.ALL) {
      resourcesString += resourcesIdType
    } else if (
      resourcesIdType === ACL_TYPE_ID.INDIVIDUAL ||
      resourcesIdType === ACL_TYPE_ID.GROUP ||
      resourcesIdType === ACL_TYPE_ID.CLUSTER
    ) {
      resourcesString += resourcesIdType + (resourcesId ?? '')
    }
  }

  // Rights: List of rights separated by '+', e.g. CREATE+USE
  rights?.forEach((right, index) => {
    if (index < rights.length - 1) rightsString += ACL_RIGHTS[right].name + '+'
    else rightsString += ACL_RIGHTS[right].name
  })

  // Zone: Type of zone identifier plus the zone identifier, e.g. #44
  if (zoneType) {
    zoneString = zoneType + (zoneId ?? '')
  }

  // Return the ACL string
  return (
    userString +
    ' ' +
    resourcesString +
    resourcesIdentifierString +
    ' ' +
    rightsString +
    (zoneString ? ' ' + zoneString : '')
  )
}

/**
 * Check if a ACL string has the correct format.
 *
 * @param {string} rule - ACL rule
 * @returns {boolean} - If the rule it's ok or not
 */
export const validACL = (rule) => {
  // Regular expression for user component
  const userRegex = /([#@]\d+|[*])/

  // Regular expression for resources component
  const resourceTypePattern =
    /(VM|HOST|NET|IMAGE|USER|TEMPLATE|GROUP|DATASTORE|CLUSTER|DOCUMENT|ZONE|SECGROUP|VDC|VROUTER|MARKETPLACE|MARKETPLACEAPP|VMGROUP|VNTEMPLATE|BACKUPJOB)/
  const otherResourcesTypePattern = new RegExp(
    `(\\+${resourceTypePattern.source})*`
  )
  const resourcesUserRegex = /([#@%]\d+|[*])/
  const resourcesRegex = new RegExp(
    `${resourceTypePattern.source}${otherResourcesTypePattern.source}\\/${resourcesUserRegex.source}`
  )

  // Regular expression for rights component
  const rightsTypePattern = /(USE|MANAGE|ADMIN|CREATE)/
  const otherRightsTypePattern = new RegExp(`(\\+${rightsTypePattern.source})*`)
  const rightsRegex = new RegExp(
    `${rightsTypePattern.source}${otherRightsTypePattern.source}`
  )

  // Regular expression for zone component
  const zoneRegex = /(\*|#\d+)/

  // ACL regular expression
  const aclRuleRegex = new RegExp(
    `^${userRegex.source}\\s${resourcesRegex.source}\\s${rightsRegex.source}(\\s${zoneRegex.source})?$`
  )

  // Check rule
  return aclRuleRegex.test(rule)
}

/**
 * Create a human readable message with the meaning of the rule.
 *
 * @param {string} rule - The ACL sring rule
 * @param {Array} users - List of users
 * @param {Array} groups - List of groups
 * @param {Array} clusters - List of clusters
 * @param {Array} zones - List of zones
 * @returns {string} - The meaning of the rule
 */
export const translateACL = (rule, users, groups, clusters, zones) => {
  // Create a readable object from the string rule
  const acl = aclFromString(rule, users, groups, clusters, zones)

  // Define the message
  let message = Tr(T['acls.translate.rule']) + ' '

  // User info
  if (
    acl.USER?.type &&
    acl.USER.type === ACL_USERS.INDIVIDUAL.type &&
    acl.USER?.id
  ) {
    message += Tr(T['acls.translate.user.id']) + ' '
    if (acl.USER.id) {
      message += acl.USER.id + ' '
    }
    if (acl.USER.name) {
      message += ' (' + acl.USER.name + ') '
    }
  } else if (
    acl.USER?.type &&
    acl.USER.type === ACL_USERS.GROUP.type &&
    acl.USER?.id
  ) {
    message += Tr(T['acls.translate.user.group']) + ' ' + acl.USER.id + ' '
    if (acl.USER.name) {
      message += ' (' + acl.USER.name + ') '
    }
  } else if (acl.USER?.type && acl.USER.type === ACL_USERS.ALL.type) {
    message += Tr(T['acls.translate.user.all']) + ' '
  }

  // Rights info
  message += Tr(T['acls.translate.rights']) + ' '

  const rights = acl.RIGHTS?.rights

  rights?.forEach((right, index) => {
    if (index === rights.length - 1) {
      message += right
    } else {
      message += right + ' ' + Tr(T['acls.translate.and']) + ' '
    }
  })

  if (rights?.length > 1) {
    message += ' ' + Tr(T['acls.translate.operations']) + ' '
  } else {
    message += ' ' + Tr(T['acls.translate.operation']) + ' '
  }

  // Resources info
  if (
    acl.RESOURCE?.identifier.type &&
    acl.RESOURCE.identifier.type === ACL_USERS.INDIVIDUAL.type
  ) {
    message += Tr(T['acls.translate.overall']) + ' '
  } else {
    message += Tr(T['acls.translate.over']) + ' '
  }

  acl.RESOURCE?.resources.forEach((resource, index) => {
    if (index === acl.RESOURCE.resources.length - 1) {
      message += resource
    } else {
      message += resource + ' ' + Tr(T['acls.translate.and']) + ' '
    }
  })

  // Resources identifier info
  if (
    acl.RESOURCE?.identifier.type &&
    acl.RESOURCE.identifier.type === ACL_USERS.INDIVIDUAL.type &&
    acl.RESOURCE?.identifier.id
  ) {
    message +=
      ' ' +
      Tr(T['acls.translate.resource.id']) +
      ' ' +
      acl.RESOURCE.identifier.id
  } else if (
    acl.RESOURCE?.identifier.type &&
    acl.RESOURCE.identifier.type === ACL_USERS.GROUP.type &&
    acl.RESOURCE?.identifier.id
  ) {
    message +=
      ' ' +
      Tr(T['acls.translate.resource.group']) +
      ' ' +
      acl.RESOURCE.identifier.id
    if (acl.RESOURCE.identifier.name) {
      message += ' (' + acl.RESOURCE.identifier.name + ')'
    }
  } else if (
    acl.RESOURCE?.identifier.type &&
    acl.RESOURCE.identifier.type === ACL_USERS.CLUSTER.type &&
    acl.RESOURCE?.identifier.id
  ) {
    message +=
      ' ' +
      Tr(T['acls.translate.resource.cluster']) +
      ' ' +
      acl.RESOURCE.identifier.id
    if (acl.RESOURCE.identifier.name) {
      message += ' (' + acl.RESOURCE.identifier.name + ')'
    }
  }

  // Zone info
  if (acl.ZONE?.type && acl.ZONE?.type === ACL_USERS.INDIVIDUAL.type) {
    message += ' ' + Tr(T['acls.translate.zone.id']) + ' ' + acl.ZONE.id
    if (acl.ZONE.name) {
      message += ' (' + acl.ZONE.name + ')'
    }
  } else if (acl.ZONE?.type === ACL_USERS.ALL.type) {
    message += ' ' + Tr(T['acls.translate.zone.all'])
  }

  // Return message
  return message
}

/**
 * Create a readable object from an acl rule.
 *
 * @param {string} rule - ACL rule
 * @param {Array} users - List of users
 * @param {Array} groups - List of groups
 * @param {Array} clusters - List of clusters
 * @param {Array} zones - List of zones
 * @returns {object} The ACL rule in a readable object
 */
export const aclFromString = (rule, users, groups, clusters, zones) => {
  // Create object
  const acl = {
    STRING: rule,
  }

  // Split rule
  const aclComponents = acl.STRING.split(' ')

  // User
  if (aclComponents[0]) {
    // Get user info
    const user = aclComponents[0]

    // Set user values
    const userType = _.find(ACL_USERS, { id: user.charAt(0) })?.type
    const userId = user.length > 1 ? user.substring(1) : undefined
    let username
    if (userType === ACL_USERS.INDIVIDUAL.type && users) {
      username = _.find(users, { ID: userId })?.NAME
    } else if (userType === ACL_USERS.GROUP.type && groups) {
      username = _.find(groups, { ID: userId })?.NAME
    }

    // Create user object
    acl.USER = {
      type: userType,
      id: userId,
      string: aclComponents[0],
      name: username,
    }
  }

  // Resources
  if (aclComponents[1]) {
    // Get resources info
    const resourcesComponents = aclComponents[1].split('/')
    const resources = resourcesComponents[0].split('+')
    const resourcesIdentifier = resourcesComponents[1]

    // Set resource user values
    const resourceUserType = _.find(ACL_USERS, {
      id: resourcesIdentifier.charAt(0),
    })?.type
    const resourceId =
      resourcesIdentifier.length > 1
        ? resourcesIdentifier.substring(1)
        : undefined
    let resourceUsername
    if (resourceUserType === ACL_USERS.GROUP.type && groups) {
      resourceUsername = _.find(groups, {
        ID: resourceId,
      })?.NAME
    } else if (resourceUserType === ACL_USERS.CLUSTER.type && clusters) {
      resourceUsername = _.find(clusters, {
        ID: resourceId,
      })?.NAME
    }

    // Create resource object
    acl.RESOURCE = {
      resources: resources,
      identifier: {
        type: resourceUserType,
        id: resourceId,
        string: resourcesIdentifier,
        name: resourceUsername,
      },
      string: resourcesComponents,
    }
  }

  // Rights
  if (aclComponents[2]) {
    // Get rights info
    const rights = aclComponents[2].split('+')
    acl.RIGHTS = {
      rights: rights,
      string: aclComponents[2],
    }
  }

  // Zone
  if (aclComponents[3]) {
    // Create rights object
    const zone = aclComponents[3]

    if (zone) {
      // Set zone values
      const zoneType = _.find(ACL_USERS, { id: zone.charAt(0) }).type
      const zoneId = zone.length > 1 ? zone.substring(1) : undefined

      let zonename
      if (zoneType === ACL_USERS.INDIVIDUAL.type && zones) {
        zonename = _.find(zones, { ID: zoneId })?.NAME
      }

      if (zone) {
        acl.ZONE = {
          type: zoneType,
          id: zoneId,
          string: zone,
          name: zonename,
        }
      }
    }
  }

  // Return acl
  return acl
}
