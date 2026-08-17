/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
  ACL_RESOURCES,
  ACL_RIGHTS,
  ACL_TYPE_ID,
  ACL_USERS,
  GROUP_PERMISSION_RESOURCES,
} from '@ConstantsModule'
import {
  aclFromString,
  createAclObjectFromString,
  createStringACL,
} from '@modules/models/ACL/general'

const GROUP_PERMISSION_TYPES = {
  CREATE: 'create',
  VIEW: 'view',
}

const supportedResources = new Set(GROUP_PERMISSION_RESOURCES)

const areSetsEqual = (first, second) =>
  first.size === second.size && [...first].every((value) => second.has(value))

const getSelectedResources = (permissions, type) =>
  new Set(
    (permissions?.[type] ?? [])
      .map(({ name }) => name)
      .filter((name) => supportedResources.has(name))
  )

const getCurrentResources = (rules) =>
  new Set(
    rules.flatMap(({ resources }) =>
      resources.filter((resource) => supportedResources.has(resource))
    )
  )

const getRuleType = (acl, groupId) => {
  const isGroupRule =
    acl?.USER?.type === ACL_USERS.GROUP.type &&
    String(acl?.USER?.id) === String(groupId)

  if (!isGroupRule || acl?.RIGHTS?.rights?.length !== 1) return undefined

  const [right] = acl.RIGHTS.rights
  const resourceIdentifier = acl?.RESOURCE?.identifier

  if (
    right === ACL_RIGHTS.CREATE.name &&
    resourceIdentifier?.type === ACL_USERS.ALL.type
  ) {
    return GROUP_PERMISSION_TYPES.CREATE
  }

  if (
    right === ACL_RIGHTS.USE.name &&
    resourceIdentifier?.type === ACL_USERS.GROUP.type &&
    String(resourceIdentifier?.id) === String(groupId)
  ) {
    return GROUP_PERMISSION_TYPES.VIEW
  }

  return undefined
}

/**
 * Returns only the standard CREATE and VIEW ACL rules managed by the Group
 * permissions form. Rules with additional rights or a different scope are
 * intentionally ignored.
 *
 * @param {object[]} acls - ACL pool
 * @param {string|number} groupId - Group ID
 * @returns {{create: object[], view: object[]}} Managed rules by type
 */
export const getGroupPermissionRules = (acls = [], groupId) =>
  acls.reduce(
    (rules, acl) => {
      if (!acl?.STRING) return rules

      const parsedAcl = { ...acl, ...aclFromString(acl.STRING) }
      const type = getRuleType(parsedAcl, groupId)

      if (type) {
        rules[type].push({
          id: acl.ID,
          resources: parsedAcl?.RESOURCE?.resources ?? [],
          zone: parsedAcl?.ZONE?.string,
        })
      }

      return rules
    },
    { create: [], view: [] }
  )

/**
 * Converts the current group ACL rules into explicit form values. All fields
 * are initialized to avoid applying the defaults used by the creation form.
 *
 * @param {object[]} acls - ACL pool
 * @param {string|number} groupId - Group ID
 * @returns {{create: object, view: object}} Group permission form values
 */
export const getGroupPermissionFormValues = (acls = [], groupId) => {
  const rules = getGroupPermissionRules(acls, groupId)
  const values = {
    create: Object.fromEntries(
      GROUP_PERMISSION_RESOURCES.map((resource) => [resource, false])
    ),
    view: Object.fromEntries(
      GROUP_PERMISSION_RESOURCES.map((resource) => [resource, false])
    ),
  }

  Object.entries(rules).forEach(([type, typeRules]) => {
    typeRules.forEach(({ resources }) => {
      resources.forEach((resource) => {
        if (supportedResources.has(resource)) values[type][resource] = true
      })
    })
  })

  return values
}

const getZoneParts = (zone) => {
  if (zone === ACL_TYPE_ID.ALL) {
    return { zoneType: ACL_TYPE_ID.ALL, zoneId: undefined }
  }

  if (zone?.startsWith(ACL_TYPE_ID.INDIVIDUAL)) {
    return {
      zoneType: ACL_TYPE_ID.INDIVIDUAL,
      zoneId: zone.substring(1),
    }
  }

  return { zoneType: undefined, zoneId: undefined }
}

const buildAcl = (groupId, type, resources, zone) => {
  const isCreate = type === GROUP_PERMISSION_TYPES.CREATE
  const { zoneType, zoneId } = getZoneParts(zone)
  const rule = createStringACL(
    ACL_TYPE_ID.GROUP,
    groupId,
    resources.map((resource) => ACL_RESOURCES[resource]).filter(Boolean),
    isCreate ? ACL_TYPE_ID.ALL : ACL_TYPE_ID.GROUP,
    isCreate ? undefined : groupId,
    [isCreate ? ACL_RIGHTS.CREATE.name : ACL_RIGHTS.USE.name],
    zoneType,
    zoneId
  )

  return createAclObjectFromString(rule)
}

const getChangesByType = (rules, groupId, type, permissions) => {
  const selected = getSelectedResources(permissions, type)
  const current = getCurrentResources(rules)

  if (areSetsEqual(selected, current)) {
    return { allocations: [], removals: [] }
  }

  if (rules.length === 0) {
    return {
      allocations:
        selected.size > 0
          ? [buildAcl(groupId, type, [...selected], undefined)]
          : [],
      removals: [],
    }
  }

  const rulesByZone = rules.reduce((rulesByZoneValue, rule) => {
    const zone = rule.zone ?? ''

    rulesByZoneValue[zone] ??= []
    rulesByZoneValue[zone].push(rule)

    return rulesByZoneValue
  }, {})

  return Object.entries(rulesByZone).reduce(
    (changes, [zone, zoneRules]) => {
      const preservedResources = new Set(
        zoneRules.flatMap(({ resources }) =>
          resources.filter((resource) => !supportedResources.has(resource))
        )
      )
      const desiredResources = new Set([...selected, ...preservedResources])
      const reusableRule = zoneRules.find(({ resources }) =>
        areSetsEqual(new Set(resources), desiredResources)
      )

      if (desiredResources.size > 0 && !reusableRule) {
        changes.allocations.push(
          buildAcl(groupId, type, [...desiredResources], zone || undefined)
        )
      }

      changes.removals.push(
        ...zoneRules
          .filter(({ id }) => id !== reusableRule?.id)
          .map(({ id }) => id)
      )

      return changes
    },
    { allocations: [], removals: [] }
  )
}

/**
 * Calculates the ACL mutations needed to reconcile the Group permissions form
 * with the current ACL pool.
 *
 * @param {object[]} acls - ACL pool
 * @param {string|number} groupId - Group ID
 * @param {{create: object[], view: object[]}} permissions - Submitted values
 * @returns {{allocations: object[], removals: (string|number)[]}} ACL changes
 */
export const getGroupPermissionChanges = (
  acls = [],
  groupId,
  permissions = {}
) => {
  const rules = getGroupPermissionRules(acls, groupId)

  return Object.values(GROUP_PERMISSION_TYPES).reduce(
    (changes, type) => {
      const typeChanges = getChangesByType(
        rules[type],
        groupId,
        type,
        permissions
      )

      changes.allocations.push(...typeChanges.allocations)
      changes.removals.push(...typeChanges.removals)

      return changes
    },
    { allocations: [], removals: [] }
  )
}
