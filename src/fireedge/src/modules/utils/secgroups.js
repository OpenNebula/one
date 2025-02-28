/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
/**
 * Unbind security group from VNET.
 *
 * @param {object} vnet - VNET.
 * @param {object} secgroup - Security group.
 * @returns {object} - Object from wich XML will be created.
 */
export const unbindSecGroupTemplate = (vnet, secgroup) => {
  const splittedSecGroups = vnet?.TEMPLATE.SECURITY_GROUPS?.split(',') ?? []
  const currentSecGroups = [splittedSecGroups].flat().map((sgId) => +sgId)

  const secGroupsUpdated = currentSecGroups.filter((id) => id !== +secgroup.ID)

  return { ...vnet.TEMPLATE, SECURITY_GROUPS: secGroupsUpdated.join(',') }
}

/**
 * Bind security group to VNET.
 *
 * @param {object} vnet - VNET.
 * @param {object} secgroups - Security group.
 * @returns {object} - Object from wich XML will be created.
 */
export const bindSecGroupTemplate = (vnet, secgroups) => {
  const newSecGroup = secgroups.map((secGroup) => +secGroup)

  const splittedSecGroups = vnet?.TEMPLATE.SECURITY_GROUPS?.split(',') ?? []
  const currentSecGroups = [splittedSecGroups].flat().map((sgId) => +sgId)

  newSecGroup.forEach((newSec) => {
    !currentSecGroups.includes(newSec) && currentSecGroups.push(newSec)
  })

  return { ...vnet.TEMPLATE, SECURITY_GROUPS: currentSecGroups.join(',') }
}
