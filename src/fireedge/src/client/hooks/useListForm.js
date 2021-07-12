/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback, useState, SetStateAction } from 'react'
import { set } from 'client/utils'

const NEXT_INDEX = index => index + 1
const EXISTS_INDEX = index => index !== -1

const getIndexById = (list, id) =>
  list.findIndex(({ id: itemId }) => itemId === id)

/**
 * Hook to manage a list with selectable elements in a form data.
 *
 * @param {object} props - Props
 * @param {boolean} props.multiple - If `true`, can be more than one select elements
 * @param {string} props.key - Key of list in the form
 * @param {object[]} props.list - Form data
 * @param {SetStateAction} props.setList - State action from the form
 * @param {{ id: string|number }} props.defaultValue - Default value of element
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
 * @returns {{
 * editingData: Function,
 * handleSelect: Function,
 * handleUnselect: Function,
 * handleClear: Function,
 * handleClone: Function,
 * handleRemove: Function,
 * handleSetList: Function,
 * handleSave: Function,
 * handleEdit: Function
 * }} - Functions to manage the list
 */
const useListForm = ({ multiple, key, list, setList, defaultValue }) => {
  const [editingData, setEditingData] = useState({})

  const handleSetList = useCallback(
    /**
     * Resets the list with a new value.
     *
     * @param {Array} newList - New list
     */
    newList => {
      setList(data => ({ ...set(data, key, newList) }))
    },
    [key, setList, list]
  )

  const handleSelect = useCallback(
  /**
   * Add an item to data form list.
   *
   * @param {string|number} id - Element id
   */
    id => {
      setList(prevList => ({
        ...prevList,
        [key]: multiple ? [...(prevList[key] ?? []), id] : [id]
      }))
    },
    [key, setList, multiple]
  )

  const handleUnselect = useCallback(
    /**
     * Removes an item from data form list.
     *
     * @param {string|number} id - Element id
     * @param {Function} [filter] - Filter function to remove the item.
     */
    (id, filter) => {
      setList(prevList => ({
        ...prevList,
        [key]: prevList[key]?.filter(filter ?? (item => item !== id))
      }))
    },
    [key, setList]
  )

  const handleClear = useCallback(
    /** Clear the data form list. */
    () => {
      setList(prevList => ({ ...prevList, [key]: [] }))
    },
    [key]
  )

  /**
   * Clones an item and change two attributes:
   * - id: id from default value
   * - name: same name of element cloned, with the suffix '_clone'
   *
   * @param {string|number} id - Element id
   */
  const handleClone = useCallback(
    id => {
      const itemIndex = getIndexById(list, id)
      const { id: itemId, name = itemId, ...item } = list[itemIndex]
      const cloneList = [...list]
      const cloneItem = {
        ...item,
        id: defaultValue.id,
        name: `${name}_clone`
      }

      const ZERO_DELETE_COUNT = 0
      cloneList.splice(NEXT_INDEX(itemIndex), ZERO_DELETE_COUNT, cloneItem)

      handleSetList(cloneList)
    },
    [list]
  )

  /** Removes an item from data form list. */
  const handleRemove = useCallback(handleUnselect, [key, list])

  const handleSave = useCallback(
    /**
     * Saves the data from editing state.
     *
     * @param {object} values - New element data
     * @param {string|number} [id] - Element id
     */
    (values, id = editingData?.id) => {
      const itemIndex = getIndexById(list, id)
      const index = EXISTS_INDEX(itemIndex) ? itemIndex : list.length

      const newList = set(list, index, { ...editingData, ...values })

      handleSetList(newList)
    },
    [key, list, editingData]
  )

  const handleEdit = useCallback(
  /**
   * Find the element by id and set value to editing state.
   *
   * @param {string|number} id - Element id
   */
    id => {
      const index = list.findIndex(item => item.id === id)
      const openData = list[index] ?? defaultValue

      setEditingData(openData)
    },
    [list, defaultValue]
  )

  return {
    editingData,
    handleSelect,
    handleUnselect,
    handleClear,
    handleClone,
    handleRemove,
    handleSetList,

    handleSave,
    handleEdit
  }
}

export default useListForm
