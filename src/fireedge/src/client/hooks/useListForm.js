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
import { useCallback, useState, SetStateAction, useRef, useEffect } from 'react'
import { useGeneralApi } from 'client/features/General'
import { v4 as uuidv4 } from 'uuid'
import { set } from 'client/utils'

// ----------------------------------------------------------
// Types
// ----------------------------------------------------------

/** @callback NoParamsCallback */

/**
 * @callback SimpleCallback
 * @param {string|number} id - Item id
 */

/**
 * @callback NewListCallback
 * @param {object[]} newList - New list
 */

/**
 * @callback FilterCallback
 * @param {object} item - Item from list
 * @returns {boolean} Filter condition
 */

/**
 * @callback DeleteCallback ------------------
 * @param {string|number} id - Item id
 * @param {FilterCallback} [filter] - Filter function to remove the item
 */

/**
 * @callback SaveCallback ------------------
 * @param {object} newValues - New item values
 * @param {string|number} [id] - Default uuid4
 */

/**
 * @typedef {object} HookListForm
 * @property {object[]} list - Form list
 * @property {object} editingData - Current editing data
 * @property {NoParamsCallback} handleClear - Clear the data form list
 * @property {NewListCallback} handleSetList - Resets the list with a new value
 * @property {DeleteCallback} handleUnselect - Removes an item from data form list
 * @property {DeleteCallback} handleRemove - Removes an item from data form list
 * @property {SimpleCallback} handleSelect - Add an item to data form list
 * @property {SimpleCallback} handleClone - Clones an item and change two attributes
 * @property {SimpleCallback} handleEdit - Find the element by id and set value to editing state
 * @property {SaveCallback} handleSave - Saves the data from editing state
 */

// ----------------------------------------------------------
// Constants
// ----------------------------------------------------------

const ZERO_DELETE_COUNT = 0
const NEXT_INDEX = (index) => index + 1
const EXISTS_INDEX = (index) => index !== -1

// parent ? [parent.id, index].join('.')
const defaultGetItemId = (item) =>
  typeof item === 'object' ? item?.id ?? item?.ID : item
const defaultAddItemId = (item, id) => ({ ...item, id })

// ----------------------------------------------------------
// Hook function
// ----------------------------------------------------------

/**
 * Hook to manage a list with selectable elements in a form data.
 *
 * @param {object} props - Props
 * @param {boolean} props.multiple - If `true`, can be more than one select elements
 * @param {string} props.parent - Key of parent in the form
 * @param {string} props.key - Key of list in the form
 * @param {object[]} props.list - Form data
 * @param {SetStateAction} props.setList - State action from the form
 * @param {object} props.defaultValue - Default value of element
 * @param {function(object, number):string|number} props.getItemId - Function to change how detects unique item
 * @param {function(object, string|number, number):object} props.addItemId - Function to add ID
 * @param {object} props.modifiedFields - Array of field names to set as modified on select/unselect
 * @param {string} props.fieldKey - Key under which to save modified fields.
 * @example <caption>Example usage.</caption>
 * // const INITIAL_STATE = { listKey: [{ id: 'item1' }, { id: 'item2' }] }
 * // const [formData, setFormData] = useState(INITIAL_STATE)
 * //
 * // const listFunctions = useListForm({
 * //   key: 'listKey',
 * //   list: formData,
 * //   setList: setFormData
 * //   defaultValue: { id: 'default' }
 * // })
 * @returns {HookListForm} - Functions to manage the list
 */
const useListForm = ({
  multiple,
  key,
  parent,
  list,
  setList,
  defaultValue,
  getItemId = defaultGetItemId,
  addItemId = defaultAddItemId,
  modifiedFields,
  fieldKey,
}) => {
  const { setModifiedFields } = useGeneralApi()
  const selectedRef = useRef(false)

  const [editingData, setEditingData] = useState(() => undefined)

  const getIndexById = useCallback(
    (listToFind, searchId = -1) =>
      listToFind?.findIndex((item, idx) => getItemId(item, idx) === searchId),
    []
  )

  const handleSetList = useCallback(
    (newList) =>
      setList((data) => {
        const path = parent ? [parent, key].join('.') : key
        const newData = set({ ...data }, path, newList)

        return parent ? { ...data, [parent]: newData } : { ...data, ...newData }
      }),
    [key, parent, setList]
  )

  const handleSelect = useCallback((id) => {
    setList((prevList) => ({
      ...prevList,
      [key]: multiple ? [...(prevList[key] ?? []), id] : [id],
    }))
    selectedRef.current = true
  })

  const handleUnselect = useCallback(
    (id) => {
      const newList = [...list]?.filter(
        (item, idx) => getItemId(item, idx) !== id
      )

      handleSetList(newList)
      selectedRef.current = false
    },
    [list, setList]
  )

  const handleClear = useCallback(() => {
    setList((prevList) => ({ ...prevList, [key]: [] }))
  }, [key])

  const handleClone = useCallback(
    (id) => {
      const itemIndex = getIndexById(list, id)
      const cloneItem = addItemId(list[itemIndex], undefined, itemIndex)
      const cloneList = [...list]

      cloneList.splice(NEXT_INDEX(itemIndex), ZERO_DELETE_COUNT, cloneItem)

      handleSetList(cloneList)
    },
    [list, defaultValue]
  )

  const handleRemove = handleUnselect

  const handleSave = useCallback(
    (values, id = getItemId(values) ?? uuidv4()) => {
      const itemIndex = getIndexById(list, id)
      const index = EXISTS_INDEX(itemIndex) ? itemIndex : list.length

      const newList = Object.assign([], [...list], {
        [index]: getItemId(values) ? values : addItemId(values, id, index),
      })

      handleSetList(newList)
    },
    [list]
  )

  const handleEdit = useCallback(
    (id) => {
      const index = getIndexById(list, id)
      const openData = list[index] ?? defaultValue

      setEditingData(openData)
    },
    [list, defaultValue]
  )

  useEffect(
    () => () => {
      if (selectedRef?.current && !!modifiedFields?.length) {
        const mergedFields = modifiedFields.reduce((acc, field) => {
          if (fieldKey) {
            acc[fieldKey] = { ...acc[fieldKey], [field]: true }
          } else {
            acc[field] = true
          }

          return acc
        }, {})
        setModifiedFields(mergedFields, { batch: true })
      }
    },
    []
  )

  return {
    list,
    editingData,
    handleSelect,
    handleUnselect,
    handleClear,
    handleClone,
    handleRemove,
    handleSetList,

    handleSave,
    handleEdit,
  }
}

export default useListForm
