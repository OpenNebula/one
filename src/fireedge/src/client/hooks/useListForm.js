import { useCallback, useState } from 'react'

const NEXT_INDEX = index => index + 1
const EXISTS_INDEX = index => index !== -1

const getIndexById = (list, id) =>
  list.findIndex(({ id: itemId }) => itemId === id)

const useListSelect = ({ multiple, key, list, setList, defaultValue }) => {
  const [editingData, setEditingData] = useState({})

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

      setList(prevList => ({ ...prevList, [key]: cloneList }))
    },
    [list, setList]
  )

  const handleRemove = useCallback(
    id => {
      // TODO confirmation??
      setList(prevList => ({
        ...prevList,
        [key]: prevList[key]?.filter(item => item.id !== id)
      }))
    },
    [key, setList]
  )

  const handleSetList = useCallback(
    newList => {
      setList(prevList => ({ ...prevList, [key]: newList }))
    },
    [key, setList]
  )

  const handleSave = useCallback(
    (values, id = editingData.id) => {
      setList(prevList => {
        const itemIndex = getIndexById(prevList[key], id)
        const index = EXISTS_INDEX(itemIndex)
          ? itemIndex
          : prevList[key].length

        return {
          ...prevList,
          [key]: Object.assign(prevList[key], {
            [index]: { ...editingData, ...values }
          })
        }
      })
    },
    [key, setList, editingData]
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

export default useListSelect
