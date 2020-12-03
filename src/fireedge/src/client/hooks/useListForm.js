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
    id =>
      setList(prevList => ({
        ...prevList,
        [key]: prevList[key]?.filter(item => item !== id)
      })),
    [key, list]
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
    (id) => {
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
    handleClone,
    handleRemove,
    handleSetList,

    handleSave,
    handleEdit
  }
}

export default useListForm
