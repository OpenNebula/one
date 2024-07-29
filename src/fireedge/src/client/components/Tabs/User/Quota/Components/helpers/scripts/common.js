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

/**
 * @param {Array} values - Array of values
 * @param {Array} globalIds - Global ids array
 * @param {Array} markedForDeletion - Array of ids to delete
 * @returns {string} - Display value string
 */
export const getConcatenatedValues = (values, globalIds, markedForDeletion) =>
  globalIds
    .map((id) => (markedForDeletion.includes(id) ? 'Delete' : values[id]) || '')
    .filter((value) => value !== '')
    .join(', ')

/**
 * @param {number} resourceId - Resource id
 * @param {string} identifier - Quota identifier
 * @param {string} selectedType - Selected quota type
 * @param {Array} existingData - Existing resource data
 * @returns {object} Resource data
 */
export const getExistingValue = (
  resourceId,
  identifier,
  selectedType,
  existingData = []
) => {
  if (selectedType === 'VM') {
    const vmQuotaObject = existingData[0]

    return vmQuotaObject ? vmQuotaObject[identifier] : ''
  } else {
    const resourceData = existingData.find((data) => data.ID === resourceId)

    return resourceData ? resourceData[identifier] : ''
  }
}

const findIdByName = (nameMaps, selectedType, resourceNameOrId) => {
  if (!isNaN(parseInt(resourceNameOrId, 10))) {
    return resourceNameOrId
  }

  const typeMap = nameMaps[selectedType] || {}
  const foundEntry = Object.entries(typeMap).find(
    ([id, name]) => name === resourceNameOrId
  )

  return foundEntry ? foundEntry[0] : resourceNameOrId
}

/**
 * @param {object} state - The current state object containing the quota information.
 * @param {object} existingTemplate - The existing quota template data to compare against.
 * @param {string} selectedType - The type of quota selected (e.g., 'VM', 'DATASTORE').
 * @param {object} actions - An object containing reducer actions for updating state.
 * @param {number|string} userId - The ID of the user whose quota is being updated.
 * @param {Function} updateUserQuota - The mutation function to call for updating the quota.
 * @param {Function} enqueueError - Function to enqueue an error notification.
 * @param {Function} enqueueSuccess - Function to enqueue a success notification.
 * @param {object} nameMaps - Object containing the mappings of resource IDs to their names.
 * @returns {Promise<void>} A promise that resolves when the operation is complete.
 */
export const handleApplyGlobalQuotas = async (
  state,
  existingTemplate,
  selectedType,
  actions,
  userId,
  updateUserQuota,
  enqueueError,
  enqueueSuccess,
  nameMaps
) => {
  if (!state.isValid) return

  const getExistingQuota = (quotaType, resourceId, existingTemplateData) => {
    const quotaKey = `${quotaType}_QUOTA`
    const quotaData = existingTemplateData[quotaKey]

    if (!Array.isArray(quotaData) && quotaType === 'VM') {
      return quotaData || {}
    } else if (Array.isArray(quotaData)) {
      return (
        quotaData?.find((q) => q?.ID?.toString() === resourceId.toString()) ||
        {}
      )
    }

    return (
      [quotaData]?.find((q) => q?.ID?.toString() === resourceId.toString()) ||
      {}
    )
  }

  const applyQuotaChange = async (resourceIdOrName, value) => {
    try {
      const actualId =
        findIdByName(nameMaps, selectedType, resourceIdOrName) ||
        resourceIdOrName

      const quota = { [state.selectedIdentifier]: value }
      const existingQuota = getExistingQuota(
        selectedType,
        actualId,
        existingTemplate?.data
      )

      const xmlData = quotasToXml(selectedType, actualId, {
        ...existingQuota,
        ...quota,
      })
      const result = await updateUserQuota({ id: userId, template: xmlData })

      if (result.error) {
        throw new Error(result.error.message)
      }
      enqueueSuccess(T.SuccessQuotaUpdated, actualId)
    } catch (error) {
      enqueueError(T.ErrorQuotaUpdated, [resourceIdOrName, error.message])
    }
  }

  if (selectedType === 'VM') {
    const vmValue = state.globalValue || ''
    await applyQuotaChange(0, vmValue)
  } else {
    for (const resourceId of state.globalIds) {
      const isMarkedForDeletion = state.markedForDeletion.includes(resourceId)
      const value = isMarkedForDeletion ? null : state.values[resourceId]
      if (value !== undefined && value !== '') {
        await applyQuotaChange(resourceId, value)
      } else {
        enqueueError(T.ErrorQuotaNoValueSpecified, resourceId)
      }
    }
  }

  // Clear state after all updates are attempted
  actions.setGlobalIds([])
  actions.setGlobalValue('')
  actions.setValues({})
  state?.markedForDeletion?.forEach((id) => actions.setUnmarkForDeletion(id))
}

/**
 * Converts an array of resources or a single resource object
 * into an object mapping IDs to names.
 *
 * @param {object | Array} dataPool - The resource data pool from the API response.
 * @returns {object} - An object mapping resource IDs to their names.
 */
export const nameMapper = (dataPool) => {
  if (dataPool?.isSuccess) {
    const resources = Array.isArray(dataPool.data)
      ? dataPool.data
      : [dataPool.data]

    return resources.reduce((map, resource) => {
      if (resource.ID && resource.NAME) {
        map[resource.ID] = resource.NAME
      }

      return map
    }, {})
  }

  return {}
}

/**
 * Convert quota data to XML format.
 *
 * @param {string} type - Quota type.
 * @param {string} resourceId - Resource ID
 * @param {object} quota - Quota data.
 * @returns {string} XML representation of the quota.
 */
const quotasToXml = (type, resourceId, quota) => {
  let innerXml = ''

  for (const [key, value] of Object.entries(quota)) {
    innerXml += `<${key.toUpperCase()}>${value}</${key.toUpperCase()}>`
  }

  const finalXml = `<TEMPLATE><${type}><ID>${resourceId}</ID>${innerXml}</${type}></TEMPLATE>`

  return finalXml
}

export const quotaIdentifiers = {
  VM: [
    { id: 'VMS', displayName: T.VirtualMachines },
    { id: 'RUNNING_VMS', displayName: T.RunningVMs },
    { id: 'MEMORY', displayName: T.Memory },
    { id: 'RUNNING_MEMORY', displayName: T.RunningMemory },
    { id: 'CPU', displayName: T.CPU },
    { id: 'RUNNING_CPU', displayName: T.RunningCPU },
    { id: 'SYSTEM_DISK_SIZE', displayName: T.SystemDiskSize },
  ],
  DATASTORE: [
    { id: 'SIZE', displayName: T.Size },
    { id: 'IMAGES', displayName: T.Images },
  ],
  NETWORK: [{ id: 'LEASES', displayName: T.Leases }],
  IMAGE: [{ id: 'RVMS', displayName: T.RunningVMs }],
}
