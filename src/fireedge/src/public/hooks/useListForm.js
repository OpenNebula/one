import { useCallback, useState } from 'react';

const useListSelect = ({ multiple, key, list, setList, defaultValue }) => {
  const [editingData, setEditingData] = useState({});

  const handleSelect = useCallback(
    index =>
      setList(prevData => ({
        ...prevData,
        [key]: multiple ? [...(prevData[key] ?? []), index] : [index]
      })),
    [key, list, multiple]
  );

  const handleUnselect = useCallback(
    indexRemove =>
      setList(prevData => ({
        ...prevData,
        [key]: prevData[key]?.filter(index => index !== indexRemove)
      })),
    [key, list]
  );

  const handleSave = useCallback(
    values => {
      setList(prevData => ({
        ...prevData,
        [key]: Object.assign(prevData[key], {
          [editingData.index]: values
        })
      }));
    },
    [key, list, editingData]
  );

  const handleEdit = useCallback(
    (index = list?.length) => {
      const openData = list[index] ?? defaultValue;

      setEditingData({ index, data: openData });
    },
    [list, defaultValue]
  );

  const handleClone = useCallback(
    index => {
      const item = list[index];
      const cloneItem = { ...item, name: `${item?.name}_clone` };
      const cloneData = [...list];
      cloneData.splice(index + 1, 0, cloneItem);

      setList(prevData => ({ ...prevData, [key]: cloneData }));
    },
    [list]
  );

  const handleRemove = useCallback(
    indexRemove => {
      // TODO confirmation??
      setList(prevData => ({
        ...prevData,
        [key]: prevData[key]?.filter((_, index) => index !== indexRemove)
      }));
    },
    [key, list]
  );

  return {
    editingData,
    handleSelect,
    handleUnselect,
    handleSave,
    handleEdit,
    handleClone,
    handleRemove
  };
};

export default useListSelect;
