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
import { MEMORY_RESIZE_OPTIONS, T } from '@ConstantsModule'
import { convertToMB, scaleVcpuByCpuFactor } from '@modules/utils'
import _, { cloneDeep, get, merge } from 'lodash'

// Attributes that will be always modify with the value of the form (except Storage, Network and PCI sections)
const alwaysIncludeAttributes = {
  general: {
    AS_UID: true,
    AS_GID: true,
  },
  extra: {
    OsCpu: {
      OS: {
        BOOT: true,
        FIRMWARE: true,
      },
      MEMORY_ENCRYPTION: {
        TYPE: true,
      },
    },
    InputOutput: {
      INPUT: true,
    },
    Context: {
      INPUTS_ORDER: true,
      USER_INPUTS: true,
    },
    Placement: {
      SCHED_REQUIREMENTS: true,
    },
  },
}

// Attributes that will be always modify with the value of the form in the Pci section
const alwaysIncludePci = {
  TYPE: true,
}

// Attributes that will be always modify with the value of the form in the Nic section
const alwaysIncludeNic = {}

// Attributes that will be always modify with the value of the form in the Nic alias section
const alwaysIncludeNicAlias = {
  PARENT: true,
}

const defaultValuesCreate = {
  general: {
    HYPERVISOR: true,
  },
  extra: {
    Context: {
      CONTEXT: {
        NETWORK: true,
        SSH_PUBLIC_KEY: true,
      },
    },
    InputOutput: {
      GRAPHICS: {
        LISTEN: true,
        TYPE: true,
      },
    },
    OsCpu: {
      MEMORY_ENCRYPTION: true,
    },
    Placement: {
      SCHED_REQUIREMENTS: true,
    },
  },
}

const defaultValuesUpdate = {
  extra: {
    Context: { CONTEXT: { START_SCRIPT: true, START_SCRIPT_BASE64: true } },
    OsCpu: { MEMORY_ENCRYPTION: true },
  },
}

/**
 * Filter the data of the form data with the values that were modified by the user and not adding the ones that could be added by default. The goal is to create the most simplify template that we can.
 *
 * @param {object} formData - VM Template form data
 * @param {object} modifiedFields - Touched/Dirty fields object
 * @param {object} existingTemplate - Existing data
 * @param {object} tabFormMap - Maps formData fields to tabs
 * @param {boolean} update - If the form is being updated
 * @returns {object} - Filtered template data
 */
const filterTemplateData = (
  formData,
  modifiedFields,
  existingTemplate,
  tabFormMap,
  { update = true, instantiate = false }
) => {
  // Generate a form from the original data
  const normalizedTemplate = normalizeTemplate(existingTemplate, tabFormMap)

  const includeAttributes = !instantiate
    ? update
      ? merge({}, alwaysIncludeAttributes, defaultValuesUpdate)
      : merge({}, alwaysIncludeAttributes, defaultValuesCreate)
    : alwaysIncludeAttributes

  // Filter data of formData.general
  const newGeneral = reduceGeneral(
    formData?.general,
    modifiedFields?.general,
    normalizedTemplate?.general,
    includeAttributes
  )

  // Filter data of formData.extra
  const newExtra = reduceExtra(
    formData,
    modifiedFields,
    normalizedTemplate,
    tabFormMap,
    includeAttributes
  )

  // Add custom variables
  const newCustomVariables = {
    ...normalizedTemplate['custom-variables'],
    ...formData['custom-variables'],
  }

  const result = merge({}, newGeneral, newExtra, newCustomVariables)

  // Instantiate form could have another step called user_inputs
  if (formData.user_inputs) {
    result.CONTEXT = {
      ...formData.user_inputs,
      ...Object.entries(result?.CONTEXT)?.reduce((uiCTX, [key, value]) => {
        if (value?.startsWith('$')) {
          uiCTX[key] = formData?.user_inputs?.[value?.slice(1)]
        } else {
          uiCTX[key] = value
        }

        return uiCTX
      }, {}),
    }
  }

  // Return object with all sections
  return result
}

/**
 * Generates a formData format object with the original data before the user modifies anything.
 *
 * @param {object} existingTemplate - Original data before user's modifications in the same format as formData
 * @param {string} tabFormMap - Map with the attributes (for the XML request) that will contain the section
 * @returns {object} - A form data object with the original data
 */
const normalizeTemplate = (existingTemplate, tabFormMap) => {
  const categoryLookup = Object.entries(tabFormMap).reduce(
    (acc, [category, keys]) => {
      keys.forEach((key) => (acc[key] = category))

      return acc
    },
    {}
  )

  const normalized = { general: {}, extra: {} }

  Object.entries(existingTemplate).forEach(([key, value]) => {
    if (categoryLookup[key]) {
      normalized.extra[key] = value
    } else {
      normalized.general[key] = value
    }
  })

  if ('custom-variables' in existingTemplate) {
    normalized['custom-variables'] = existingTemplate['custom-variables']
  }

  return normalized
}

/**
 * Filter the formData.general section to only add modifications of the user.
 *
 * @param {object} formData - The data from the form (the one that the user could be modify)
 * @param {object} itemModifications - Map with the fields that will be touched and modified by the user or deleted (in array case) by the user
 * @param {object} existingTemplate - Original data before user's modifications in the same format as formData
 * @param {object} alwaysInclude - Include this field always as modified
 * @returns {object} - The general section with the final data to submit
 */
const reduceGeneral = (
  formData,
  itemModifications,
  existingTemplate,
  alwaysInclude
) => {
  const newGeneral = { ...existingTemplate }

  // Add always include
  const correctionMap = merge({}, itemModifications, alwaysInclude?.general)

  Object.entries(correctionMap || {}).forEach(([key, correction]) => {
    if (correction && typeof correction === 'object' && correction.__delete__) {
      delete newGeneral[key]
    } else if (correction) {
      // If the correction is boolean, means that the user changed this value that is a simple value
      // If the correction is an object with an attribute delete means that is a hidden field that was deleted because the user change the value of its parent
      // If the correction is an object without an attribute delete means that is a field with an object instead a simple value and the user changed its value
      if (typeof correction === 'boolean' && correction) {
        newGeneral[key] = formData[key]
      } else if (typeof correction === 'object') {
        // In object case, call the same function to iterate over each key of the object
        const newChildren = reduceGeneral(
          formData[key],
          correction,
          _.get(existingTemplate, key)
        )
        newGeneral[key] = newChildren
      }
    }
  })

  return newGeneral
}

/**
 * Filter the formData.extra section to only add modifications of the user.
 *
 * @param {object} formData - The data from the form (the one that the user could be modify)
 * @param {object} itemModifications - Map with the fields that will be touched and modified by the user or deleted (in array case) by the user
 * @param {object} existingTemplate - Original data before user's modifications in the same format as formData
 * @param {string} tabFormMap - Map with the attributes (for the XML request) that will contain the section
 * @param {object} alwaysInclude - Include this field always as modified
 * @returns {object} - The extra section with the final data to submit
 */
const reduceExtra = (
  formData,
  itemModifications,
  existingTemplate,
  tabFormMap,
  alwaysInclude
) => {
  const newExtra = { ...existingTemplate.extra }

  // Ensure NIC array
  if (newExtra?.NIC)
    newExtra.NIC = Array.isArray(newExtra.NIC) ? newExtra.NIC : [newExtra.NIC]

  if (newExtra?.NIC_ALIAS)
    newExtra.NIC_ALIAS = Array.isArray(newExtra.NIC_ALIAS)
      ? newExtra.NIC_ALIAS
      : [newExtra.NIC_ALIAS]

  if (newExtra?.PCI)
    newExtra.PCI = Array.isArray(newExtra.PCI) ? newExtra.PCI : [newExtra.PCI]

  const originalData = cloneDeep(newExtra)

  // Add always include
  const correctionMap = merge({}, itemModifications, alwaysInclude)

  Object.entries(correctionMap.extra || {}).forEach(
    ([section, sectionData]) => {
      if (section === 'Network') {
        Object.entries(correctionMap.extra[section]).forEach(([subSection]) => {
          if (subSection === 'NIC') {
            handleNetwork(
              formData,
              correctionMap?.extra?.Network,
              newExtra,
              subSection,
              'NIC',
              originalData,
              alwaysIncludeNic
            )
          } else if (subSection === 'NIC_ALIAS') {
            handleNetwork(
              formData,
              correctionMap?.extra?.Network,
              newExtra,
              subSection,
              'NIC_ALIAS',
              originalData,
              alwaysIncludeNicAlias
            )
          } else if (subSection === 'NIC_DEFAULT') {
            filterSingleSection(
              formData,
              correctionMap,
              'Network',
              newExtra,
              'NIC_DEFAULT'
            )
          }
        })
      } else if (section === 'Storage') {
        handleStorage(formData, correctionMap, newExtra, section, [
          'DISK',
          'TM_MAD_SYSTEM',
        ])
      } else {
        handleOtherSections(
          formData,
          correctionMap,
          section,
          newExtra,
          tabFormMap,
          originalData
        )
      }
    }
  )

  const hasMemoryEncryptionField = Object.hasOwn(
    formData?.extra ?? {},
    'MEMORY_ENCRYPTION'
  )
  const memoryEncryptionTouched =
    hasMemoryEncryptionField ||
    Boolean(correctionMap?.extra?.OsCpu?.MEMORY_ENCRYPTION)

  // Check if TYPE is actually set (not empty, undefined, or null)
  const encryptionTypeValue = formData?.extra?.MEMORY_ENCRYPTION?.TYPE
  const hasEncryptionType =
    encryptionTypeValue &&
    encryptionTypeValue !== '' &&
    encryptionTypeValue !== 'undefined'

  // If MEMORY_ENCRYPTION was touched but TYPE is cleared/empty, remove the entire block
  if (memoryEncryptionTouched && !hasEncryptionType) {
    delete newExtra.MEMORY_ENCRYPTION
  }

  // Omitting values that are empty
  // But keep MEMORY_ENCRYPTION if TYPE is set
  const filtered = _.omitBy(newExtra, (value, key) => {
    if (key === 'MEMORY_ENCRYPTION' && value?.TYPE) {
      return false // Don't omit MEMORY_ENCRYPTION if TYPE is set
    }

    return _.isEmpty(value)
  })

  // Clean up MEMORY_ENCRYPTION: remove undefined/empty fields but keep the section if TYPE exists
  if (filtered.MEMORY_ENCRYPTION) {
    filtered.MEMORY_ENCRYPTION = _.omitBy(
      filtered.MEMORY_ENCRYPTION,
      (v) => v === undefined || v === null || v === ''
    )

    // If after cleanup there's no TYPE, remove the whole section
    if (!filtered.MEMORY_ENCRYPTION?.TYPE) {
      delete filtered.MEMORY_ENCRYPTION
    }
  }

  return filtered
}

/**
 * Delete the items that were deleted by the user in the original data.
 *
 * @param {object} existingData - The original data
 * @param {object} correctionMapSection - Map to get the delete items
 * @returns {object} - An array with the original data but without the deleted items
 */
const deleteItemsOnExistingData = (
  existingData = {},
  correctionMapSection = []
) =>
  // The items will be deleted if the section exists on the correction map and the index exists and has the delete flag
  existingData.filter(
    (data, index) =>
      !correctionMapSection ||
      index >= correctionMapSection.length ||
      !correctionMapSection[index].__delete__
  )

/**
 * Handle the network section to add modified fields.
 *
 * @param {object} formData - The data from the form (the one that the user could be modify)
 * @param {object} correctionMap - Map with the fields that will be touched and modified by the user
 * @param {object} newExtra - The extra section of the form.
 * @param {string} section - Section of the form (this function will have always Network)
 * @param {string} type - Section type inside network section
 * @param {object} originalData - Form data before the user makes any changes
 * @param {object} alwaysInclude - Include this field always as modified
 */
const handleNetwork = (
  formData,
  correctionMap,
  newExtra,
  section,
  type,
  originalData,
  alwaysInclude = {}
) => {
  if (!formData.extra[type]) return

  const existingData = _.cloneDeep(newExtra[type])

  // Create an array if there is only one element and delete the items that were deleted by the user.
  const wrappedExistingData = existingData
    ? deleteItemsOnExistingData(
        Array.isArray(existingData) ? existingData : [existingData],
        get(correctionMap, section, [])
      )
    : {}

  // Delete the items that were deleted by the user to get the correct indexes.
  const sectionModifications = deleteItemsOnExistingData(
    get(correctionMap, section, []),
    get(correctionMap, section, [])
  )

  if (type === 'NIC') {
    sectionModifications.forEach((value, index) => {
      const indexAlias = value.__aliasIndex__
      if (indexAlias !== undefined)
        wrappedExistingData[index] = { ...originalData.NIC_ALIAS[indexAlias] }

      const indexPci = value.__aliasPci__
      if (indexPci !== undefined)
        wrappedExistingData[index] = { ...originalData.PCI[indexPci] }
    })
  } else if (type === 'NIC_ALIAS') {
    sectionModifications.forEach((value, index) => {
      const indexNic = value.__nicIndex__
      if (indexNic !== undefined)
        wrappedExistingData[index] = { ...originalData.NIC[indexNic] }
      const indexPci = value.__aliasPci__
      if (indexPci !== undefined)
        wrappedExistingData[index] = { ...originalData.PCI[indexPci] }
    })
  } else if (type === 'PCI') {
    sectionModifications.forEach((value, index) => {
      const indexNic = value.__nicIndex__
      if (indexNic !== undefined)
        wrappedExistingData[index] = { ...originalData.NIC[indexNic] }
      const indexAlias = value.__aliasIndex__
      if (indexAlias !== undefined)
        wrappedExistingData[index] = { ...originalData.NIC_ALIAS[indexAlias] }
    })
  }

  // Iterate over the final data
  const modifiedData = formData.extra[type].map((item, index) => {
    // Check if the index of the item it's on the modifications map and has value
    if (
      index < sectionModifications.length &&
      sectionModifications[index] !== null
    ) {
      let itemModifications = {}

      // If the type is PCI and not has a TYPE attribute, the pci is from the inputOutput section. In other case, is from network section. So in the second case, we have to get the attribute from advanced step, and not in the first case.
      if (type === 'PCI' && !item?.TYPE) {
        // Get the fields where the modifications were done
        itemModifications = {
          ...sectionModifications[index],
          ...alwaysInclude,
        }
      } else {
        // Get the fields where the modifications were done
        itemModifications = Object.keys(sectionModifications[index])?.reduce(
          (acc, key) => ({
            ...acc,
            ...sectionModifications[index][key],
            ...alwaysInclude,
          }),
          {}
        )
      }

      // Delete keys on existing data that are marked to delete and not exists on formData or are marked to update and not exists on formData
      if (wrappedExistingData && wrappedExistingData[index])
        Object.entries(itemModifications)
          .filter(
            ([key, value]) =>
              (value.__delete__ && !item[key]) || (value && !item[key])
          )
          .forEach(
            ([key, value]) =>
              wrappedExistingData[index][key] &&
              delete wrappedExistingData[index][key]
          )

      // Iterate over each field of the item and, if it is one of the field that was modified, add the modification to the new data
      return Object.keys(item).reduce((acc, key) => {
        if (
          typeof itemModifications[key] === 'boolean' &&
          itemModifications[key]
        ) {
          acc[key] = item[key]
        } else if (
          typeof itemModifications[key] === 'object' &&
          itemModifications[key].__delete__
        ) {
          delete acc[key]
        }

        return acc
      }, wrappedExistingData?.[index] || {})
    }

    return item
  })

  newExtra[type] = modifiedData
}

/**
 * Handle the storage section to add modified fields.
 *
 * @param {object} formData - The data from the form (the one that the user could be modify)
 * @param {object} correctionMap - Map with the fields that will be touched and modified by the user
 * @param {object} newExtra - The extra section of the form.
 * @param {string} section - Section of the form (this function will have always Storage)
 * @param {Array} types - Array of section types inside storage section
 */
const handleStorage = (formData, correctionMap, newExtra, section, types) => {
  for (const type of types) {
    if (
      typeof formData?.extra?.[type] === 'string' &&
      type === 'TM_MAD_SYSTEM'
    ) {
      newExtra[type] = formData?.extra[type]
    }

    if (!formData.extra[type]) return

    // const sectionModifications = correctionMap.extra[section] || []
    const existingData = _.cloneDeep(newExtra[type])

    // Delete the items that were deleted by the user to get the correct indexes.
    const wrappedExistingData = deleteItemsOnExistingData(
      Array.isArray(existingData) ? existingData : [existingData],
      correctionMap.extra[section]
    )

    // Delete the items that were deleted by the user to get the correct indexes.
    const sectionModifications = deleteItemsOnExistingData(
      correctionMap.extra[section],
      correctionMap.extra[section]
    )

    // Iterate over the final data
    if (Array.isArray(formData?.extra[type])) {
      const modifiedData = formData.extra[type].map((disk, index) => {
        // Check if the index of the item it's on the modifications map and has value
        if (
          index < sectionModifications.length &&
          sectionModifications[index] !== null
        ) {
          // Get the fields where the modifications were done
          const diskModifications = Object.keys(
            sectionModifications[index]
          )?.reduce(
            (acc, key) => ({ ...acc, ...sectionModifications[index][key] }),
            {}
          )

          // Iterate over each field of the item and, if it is one of the field that was modified, add the modification to the new data
          return Object.keys(disk).reduce((acc, key) => {
            if (
              typeof diskModifications[key] === 'boolean' &&
              diskModifications[key]
            ) {
              acc[key] = disk[key]
            } else if (
              typeof diskModifications[key] === 'object' &&
              diskModifications[key].__delete__
            ) {
              delete acc[key]
            } else if (key === 'SIZE' && diskModifications.SIZEUNIT) {
              acc[key] = disk[key]
            }

            return acc
          }, wrappedExistingData?.[index] || {})
        }

        return disk
      })

      newExtra[type] = modifiedData
    }
  }
}

/**
 * Handle others section (that not are Storage or Network) to add modified fields.
 *
 * @param {object} formData - The data from the form (the one that the user could be modify)
 * @param {object} correctionMap - Map with the fields that will be touched and modified by the user
 * @param {string} section - Section of the form
 * @param {object} newExtra - The extra section of the form.
 * @param {string} tabFormMap - Map with the attributes (for the XML request) that will contain the section
 * @param {object} originalData - Form data before the user makes any changes
 */
const handleOtherSections = (
  formData,
  correctionMap,
  section,
  newExtra,
  tabFormMap,
  originalData
) => {
  // Check each section of the templates form
  if (tabFormMap[section]) {
    tabFormMap[section].forEach((key) => {
      // Scheduled actions special case
      if (key === 'SCHED_ACTION') {
        newExtra[key] = formData?.extra[key]
      } else if (key === 'PCI') {
        handleNetwork(
          formData,
          correctionMap?.extra?.PciDevices,
          newExtra,
          'PCI',
          'PCI',
          originalData,
          alwaysIncludePci
        )
      } else if (key === 'MEMORY_ENCRYPTION') {
        // Special handling for MEMORY_ENCRYPTION: replace entirely with form values when present
        if (formData?.extra?.MEMORY_ENCRYPTION) {
          newExtra[key] = { ...formData.extra[key] }
        }
        // If form doesn't have MEMORY_ENCRYPTION but corrections do, process normally
        else if (correctionMap.extra[section]?.[key]) {
          filterSingleSection(formData, correctionMap, section, newExtra, key)
        }
      } else {
        filterSingleSection(formData, correctionMap, section, newExtra, key)

        // Special cases for Context.USER_INPUTS
        if (
          section === 'Context' &&
          key === 'USER_INPUTS' &&
          correctionMap.extra.Context.USER_INPUTS
        ) {
          // Keep CONTEXT.INPUTS_ORDER because it's not a form by himself, depends on CONTEXT.USER_INPUTS
          newExtra.INPUTS_ORDER = formData.extra.INPUTS_ORDER
        }
      }
    })
  }
}

/**
 * Filter one section that is not Storage, Network or Schedule Actions.
 *
 * @param {object} formData - The data from the form (the one that the user could be modify)
 * @param {object} itemsModifications - Map with the fields that will be touched and modified by the user
 * @param {string} section - Section of the form
 * @param {object} newExtra - The extra section of the form.
 * @param {string} key - Section on the formData
 */
const filterSingleSection = (
  formData,
  itemsModifications,
  section,
  newExtra,
  key
) => {
  // Check if attribute has changes on the correction map
  if (
    (key in formData.extra || key in itemsModifications.extra[section]) &&
    itemsModifications.extra[section]?.[key]
  ) {
    // Get value and copy the section
    const value = formData.extra[key]
    const newOtherSection = { ...newExtra[key] }

    // Arrays and single values replace the whole value
    if (
      Array.isArray(value) ||
      key === 'USER_INPUTS' ||
      !(typeof value === 'object')
    ) {
      newExtra[key] = value
    } else {
      // Objects iterate over each key to check if the key was changed by the user
      Object.entries(itemsModifications.extra[section]?.[key] || {}).forEach(
        ([childrenKey, correction]) => {
          // If the correction is boolean, means that the user changed this value that is a simple value
          // If the correction is an object with an attribute delete means that is a hidden field that was deleted because the user change the value of its parent
          // If the correction is an object without an attribute delete means that is a field with an object instead a simple value and the user changed its value
          if (
            correction &&
            typeof correction === 'object' &&
            correction.__delete__
          ) {
            delete newOtherSection[childrenKey]
          } else if (
            correction &&
            typeof correction === 'boolean' &&
            childrenKey in formData.extra[key] &&
            (!_.isEmpty(formData.extra[key][childrenKey]) ||
              formData.extra[key][childrenKey] !== null)
          ) {
            newOtherSection[childrenKey] = formData.extra[key][childrenKey]
          } else if (
            correction &&
            typeof correction === 'boolean' &&
            !(childrenKey in formData.extra[key])
          ) {
            delete newOtherSection[childrenKey]
          }
        }
      )

      // Add section with changes
      newExtra[key] = newOtherSection
    }
  }
}

/**
 * Execute any needed action on create or update template after filter the template.
 *
 * @param {object} template - Template with data
 */
const transformActionsCreate = (template) => {
  transformActionsCommon(template)

  if (template.RAW) {
    // Clone template.RAW to ensure its mutable
    template.RAW = { ...template.RAW }

    if (template.RAW.DATA) {
      // DATA exists, so we add TYPE and transform DATA
      template.RAW.TYPE = template.HYPERVISOR
    } else {
      // DATA doesn't exist, remove RAW from template
      delete template.RAW
    }
  }
}

/**
 * Execute any needed action on instantiate template after filter the template.
 *
 * @param {object} template - Template with data
 * @param {object} original - Initial values of the template
 * @param {object} features - Features from the user's view
 */
const transformActionsInstantiate = (template, original, features) => {
  transformActionsCommon(template)

  // Calculate CPU is needed
  if (template?.VCPU && features?.cpu_factor) {
    template.CPU = scaleVcpuByCpuFactor(template.VCPU, features.cpu_factor)
  }

  original?.TEMPLATE?.OS &&
    template?.OS &&
    (template.OS = {
      ...original?.TEMPLATE?.OS,
      ...template?.OS,
    })

  if (original.TEMPLATE.NIC && (!template.NIC || template.NIC.length === 0)) {
    template.NIC = '![CDATA[]]'
  }

  if (
    original.TEMPLATE.DISK &&
    (!template.DISK || template.DISK.length === 0)
  ) {
    template.DISK = '![CDATA[]]'
  }

  if (
    original.TEMPLATE.SCHED_ACTION &&
    (!template.SCHED_ACTION || template.SCHED_ACTION.length === 0)
  ) {
    template.SCHED_ACTION = '![CDATA[]]'
  }

  // CONTEXT SECTION: if `original` param has template variables that must
  // be taken into account to instantiate the `template` param, it's necessary
  // to include them in the `template`
  const templateCtx = template.CONTEXT || {}
  const originalCtx = original.TEMPLATE?.CONTEXT || {}

  const mergedCtx = { ...templateCtx }

  for (const key of Object.keys(templateCtx)) {
    const value = templateCtx[key]
    if (value === undefined || value === null || value === '') {
      if (key in originalCtx) {
        mergedCtx[key] = originalCtx[key]
      }
    }
  }

  template.CONTEXT = mergedCtx
}

/**
 * Execute actions on the filtered template (common to instantiate and create/update).
 *
 * @param {object} template - Template with data
 */
const transformActionsCommon = (template) => {
  const newContext = template.CONTEXT ? { ...template.CONTEXT } : {}

  // Add user inputs to context
  if (template?.USER_INPUTS) {
    Object.keys(template?.USER_INPUTS).forEach((name) => {
      const isCapacity = ['MEMORY', 'CPU', 'VCPU'].includes(name)
      const upperName = String(name).toUpperCase()
      const notPopulated = !Object.hasOwn(newContext, upperName)

      const shouldAdd = !isCapacity && notPopulated

      shouldAdd && (newContext[upperName] = `$${upperName}`)
    })
  }

  template.CONTEXT = newContext

  // Delete MEMORY_SLOTS if the MEMORY_RESIZE_MODE is not Hotplug
  if (template?.MEMORY_RESIZE_MODE !== MEMORY_RESIZE_OPTIONS[T.Hotplug]) {
    delete template.MEMORY_SLOTS
  }

  // ISSUE#6136: Convert size to MB (because XML API uses only MB) and delete sizeunit field (no needed on XML API)
  template.MEMORY = convertToMB(template.MEMORY, template.MEMORYUNIT)
  delete template.MEMORYUNIT

  // cast CPU_MODEL/FEATURES
  if (Array.isArray(template?.CPU_MODEL?.FEATURES)) {
    template.CPU_MODEL.FEATURES = template.CPU_MODEL.FEATURES.join(', ')
  }

  // Delete Schedule action NAME
  if (template.SCHED_ACTION) {
    const ensuredSched = template.SCHED_ACTION
      ? Array.isArray(template.SCHED_ACTION)
        ? template.SCHED_ACTION
        : [template.SCHED_ACTION]
      : []
    template.SCHED_ACTION = ensuredSched.map((action) => {
      delete action.NAME

      return action
    })
  }
}

export {
  filterTemplateData,
  transformActionsCreate,
  transformActionsInstantiate,
}
