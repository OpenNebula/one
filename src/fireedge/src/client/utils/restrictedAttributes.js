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

/**
 * File to define functions that do something about restricted attributes
 */
import { v4 as uuidv4 } from 'uuid'

// Sections that are list of item
const listSections = [
  'DISK',
  'NIC',
  'INPUT',
  'PCI',
  'SCHED_ACTION',
  'NIC_ALIAS',
  'NIC_DEFAULT',
  'USER_INPUTS',
]

/**
 * Add temporal info (temp ids and original data) to each item of some sections.
 *
 * @param {object} dataTemplate - Data of the template with extended=false
 * @param {object} dataTemplateExtended - Data of the template with extended=true (basically add info about the images)
 */
export const addTempInfo = (dataTemplate, dataTemplateExtended) => {
  addIds(dataTemplate?.TEMPLATE?.DISK, dataTemplateExtended?.TEMPLATE?.DISK)
  // Disk is the only section that needs to add original data because the core with extended=true returns info about the images that are not on the template
  addOriginalData(
    dataTemplate?.TEMPLATE?.DISK,
    dataTemplateExtended?.TEMPLATE?.DISK
  )
  addIds(dataTemplate?.TEMPLATE?.NIC, dataTemplateExtended?.TEMPLATE?.NIC)
  addIds(dataTemplate?.TEMPLATE?.INPUT, dataTemplateExtended?.TEMPLATE?.INPUT)
  addIds(dataTemplate?.TEMPLATE?.PCI, dataTemplateExtended?.TEMPLATE?.PCI)
  addIds(
    dataTemplate?.TEMPLATE?.SCHED_ACTION,
    dataTemplateExtended?.TEMPLATE?.SCHED_ACTION
  )
}

/**
 * Delete all the temporal info of each section of a template.
 *
 * @param {object} dataTemplate - Template with data
 */
export const deleteTempInfo = (dataTemplate) => {
  deleteTempId(dataTemplate?.DISK)
  // Disk is the only section that needs to delete original data because the core with extended=true returns info about the images that are not on the template
  deleteOriginalData(dataTemplate?.DISK)
  deleteTempId(dataTemplate?.NIC)
  deleteTempId(dataTemplate?.INPUT)
  deleteTempId(dataTemplate?.PCI)
  deleteTempId(dataTemplate?.SCHED_ACTION)
}

/**
 * Add a temporal identifier to each item of a section.
 *
 * @param {object} section - Info about the template section with extended=false
 * @param {object} sectionExtended - Info about the template section with extended=true (basically add info about the images)
 */
const addIds = (section, sectionExtended) => {
  // Check if the section exists and it's an array or an attribute
  if (section && Array.isArray(section)) {
    // Iterate over each item
    section.forEach((item, index) => {
      // Create id
      const tempId = uuidv4()

      // Add id to the item of the section and the item of the extended section
      item.TEMP_ID = tempId
      if (sectionExtended) {
        sectionExtended[index].TEMP_ID = tempId
      }
    })
  } else if (section) {
    // Create id
    const tempId = uuidv4()

    // Add id to the item of the section and the item of the extended section
    if (sectionExtended) {
      sectionExtended.TEMP_ID = tempId
    }
    section.TEMP_ID = tempId
  }
}

/**
 * Add to a section extended the data of the original section.
 *
 * @param {object} section - The section like is set on the template
 * @param {object} sectionExtended - The section after use extended=true on the template
 */
const addOriginalData = (section, sectionExtended) => {
  // Check if the section exists and it's an array or an attribute
  if (section && Array.isArray(section)) {
    // Iterate over each item
    section.forEach((item, index) => {
      // Add id to the item of the section and the item of the extended section
      if (sectionExtended) {
        sectionExtended[index].ORIGINAL = item
      }
    })
  } else if (section) {
    // Add id to the item of the section and the item of the extended section
    if (sectionExtended) {
      sectionExtended.ORIGINAL = section
    }
  }
}

/**
 * Delete the temporal ide of each item of the section.
 *
 * @param {object} section - Section of a template
 */
const deleteTempId = (section) => {
  // Check if the section exists and it's an array or an attribute
  if (section && Array.isArray(section)) {
    // Iterate and delete every temporal id
    section.forEach((item) => {
      delete item.TEMP_ID
    })
  } else if (section) {
    // Delete the temporal id if it's only one object
    delete section.TEMP_ID
  }
}

/**
 * Delete original data in a section.
 *
 * @param {object} section - The section where to delete the original data
 */
const deleteOriginalData = (section) => {
  // Check if the section exists and it's an array or an attribute
  if (section && Array.isArray(section)) {
    // Iterate and delete every temporal id
    section.forEach((item) => {
      delete item.ORIGINAL
    })
  } else if (section) {
    // Delete the temporal id if it's only one object
    delete section.ORIGINAL
  }
}

/**
 * Delete the restricted attributes of a template if there are not on the original template before the user makes any modification.
 *
 * @param {object} data - Data modified by the user
 * @param {object} originalData - Data before the user modifies it
 * @param {Array} restrictedAttributes - List of restricted attributes of OpenNebula
 * @returns {object}- Data without the restricted attributes that has to be removed
 */
export const deleteRestrictedAttributes = (
  data,
  originalData,
  restrictedAttributes
) => {
  // If there is no restricted attributes, do nothing
  if (!restrictedAttributes) return data

  // Create a map with the restricted attributes (using as key the parent, for example, DISK/SIZE will create DISK=["SIZE"])
  const mapRestrictedAttributes =
    mapRestrictedAttributesFunction(restrictedAttributes)

  // Iterates over each key of the map of restricted attributes
  Object.keys(mapRestrictedAttributes).forEach((key) => {
    // Get all the restricted attributes for a key
    const value = mapRestrictedAttributes[key]

    // 1. If the attribute is a parent template attribute (like "NAME") delete it if it's not on the original template
    // 2. If the attribute is one of the sections that could has lists (like DISK), iterate over each item and delete restricted attributes if there are not on the original template
    // 3. If the attribute is a template attribute that is not a list (like "TOPOLOGY") delete it if it's not on the original template
    if (key === 'PARENT') {
      value
        .filter((attribute) => !originalData[attribute])
        .forEach((attribute) => delete data[attribute])
    } else if (listSections.find((itemSection) => itemSection === key)) {
      deleteRestrictedAttributesOnArraySection(
        data,
        originalData,
        key,
        restrictedAttributes
      )
    } else {
      value
        .filter(
          (attribute) =>
            (originalData[key] && data[key] && !originalData[key][attribute]) ||
            (data[key] && !originalData[key])
        )
        .forEach((attribute) => delete data[key][attribute])
    }
  })

  return data
}

/**
 * Create a map of restricted attributes, where the key it's the left part if the attribute is splitted with "/" character and the child the righ part. For example, "DISK/SIZE" creates a key with "DISK" that has an array with one element "SIZE".
 *
 * @param {Array} restrictedAttributesArray - List of attributes
 * @returns {object} - The map with the restricted attributes
 */
const mapRestrictedAttributesFunction = (restrictedAttributesArray) => {
  // Creates the PARENT key
  const restrictedAttributes = { PARENT: [] }

  // Iterate over each attribute
  restrictedAttributesArray.forEach((attribute) => {
    // Get parent and child
    const [parent, child] = attribute.split('/')

    // Create the array if the key does not exist
    if (child && !restrictedAttributes[parent]) {
      restrictedAttributes[parent] = []
    }

    // Add to the array
    if (child) {
      restrictedAttributes[parent].push(child)
    } else {
      restrictedAttributes.PARENT.push(parent)
    }
  })

  return restrictedAttributes
}

/**
 * Delete restricted attributes for disks if there are not on the original data (#6154).
 *
 * @param {object} data - Data of the disks
 * @param {object} originalData - Data of the disks before the user makes any changes
 * @param {boolean} section - The section of the template
 * @param {Array} restrictedAttributes - List of restricted attributes for DISK form
 * @returns {object} - Data without disk restricted attributes that are not on the original data
 */
export const deleteRestrictedAttributesOnArraySection = (
  data,
  originalData,
  section,
  restrictedAttributes = []
) => {
  // If there is no data of the section, return and exit the function
  if (!data[section]) return data

  // Check if the section it is an element on an array and create an array of one or more elements
  const dataSection = Array.isArray(data[section])
    ? data[section]
    : [data[section]]

  // Check if the original section it is an element on an array and create an array of one or more elements
  const originalDataSection =
    originalData && originalData[section]
      ? Array.isArray(originalData[section])
        ? originalData[section]
        : [originalData[section]]
      : undefined

  // Iterate over each item of the section
  data[section] = dataSection.map((item) => {
    // Find if the item it's on the original data
    const originalItemSection = originalDataSection
      ? originalDataSection.find(
          (originalItem) => originalItem.TEMP_ID === item.TEMP_ID
        )
      : undefined

    // Iterate over each key of the item to check if it's a restricted attribute and delete it if it's not on the original data or it's a new item (an user cannot add a restricted attribute because it's read only field, so if there is an restricted attribute, or this attribute it's on the original data or we have to delete it because it wasn't set by the user)
    Object.keys(item).forEach((key) => {
      // Special case on ORIGINAL_SIZE attribute. It's no needed but in older templates could be, so if exists, copy with the original value (it's no used)
      if (key === 'ORIGINAL_SIZE') {
        item[key] = originalItemSection[key]
      }

      if (restrictedAttributes.find((attr) => attr === section + '/' + key)) {
        if (!originalItemSection) delete item[key]
        else if (originalItemSection && !originalItemSection[key])
          delete item[key]
      }
    })

    return item
  })

  return data
}

/**
 * Find if a item has restricted attributes.
 *
 * @param {object} item - The item where to find the attribute
 * @param {string} section - Section of the item
 * @param {Array} restrictedAttributes - List of restricted attributes
 * @returns {boolean} - True if any restricted attribute is found on the item
 */
export const hasRestrictedAttributes = (
  item,
  section,
  restrictedAttributes = []
) => {
  // Create map with restricted attributes
  const mapRestrictedAttributes =
    mapRestrictedAttributesFunction(restrictedAttributes)

  // Find if there is a restricted attribute in the item
  const restricteAttribute = mapRestrictedAttributes[section]?.find(
    (attribute) => item && item[attribute]
  )

  return !!restricteAttribute
}
