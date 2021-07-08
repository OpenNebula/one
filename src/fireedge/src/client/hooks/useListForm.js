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
import { useCallback, useState } from 'react'
import { set } from 'client/utils'

const NEXT_INDEX = index => index + 1
const EXISTS_INDEX = index => index !== -1

const getIndexById = (list, id) =>
  list.findIndex(({ id: itemId }) => itemId === id)

const useListForm = ({ multiple, key, list, setList, defaultValue }) => {
  const [editingData, setEditingData] = useState({})

  const handleSetList = useCallback(
    newList => setList(data => ({ ...set(data, key, newList) })),
    [key, setList, list]
  )

  const handleSelect = useCallback(
    id =>
      setList(prevList => ({
        ...prevList,
        [key]: multiple ? [...(prevList[key] ?? []), id] : [id]
      })),
    [key, setList, multiple]
  )

  const handleUnselect = useCallback(
    (id, filter = item => item !== id) =>
      setList(prevList => ({
        ...prevList,
        [key]: prevList[key]?.filter(filter)
      })),
    [key, setList]
  )

  const handleClear = useCallback(
    () => setList(prevList => ({ ...prevList, [key]: [] })), [key]
  )

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

  const handleRemove = useCallback(
    id => {
      const newList = list?.filter(item => item.id !== id)

      handleSetList(newList)
    },
    [key, list]
  )

  const handleSave = useCallback(
    (values, id = editingData?.id) => {
      const itemIndex = getIndexById(list, id)
      const index = EXISTS_INDEX(itemIndex) ? itemIndex : list.length

      const newList = set(list, index, { ...editingData, ...values })

      handleSetList(newList)
    },
    [key, list, editingData]
  )

  const handleEdit = useCallback(
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
