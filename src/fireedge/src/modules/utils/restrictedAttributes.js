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

/**
 * Find if an attribute is a restricted attribute.
 *
 * @param {object} attribute - The attribute
 * @param {string} section - Section of the attribute
 * @param {Array} restrictedAttributes - List of restricted attributes
 * @returns {boolean} - True if it is restricted attribute
 */
export const isRestrictedAttributes = (
  attribute,
  section = 'PARENT',
  restrictedAttributes = []
) => {
  // Create map with restricted attributes
  const mapRestrictedAttributes =
    mapRestrictedAttributesFunction(restrictedAttributes)

  // Find if there is a restricted attribute in the item
  const restricteAttribute = mapRestrictedAttributes[section]?.find(
    (restAttr) => restAttr === attribute
  )

  return !!restricteAttribute
}
