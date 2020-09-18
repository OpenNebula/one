import { useState } from 'react';

const useListSelect = ({ multiple, key, list, setList, defaultValue }) => {
  const [editingData, setEditingData] = useState({});

  const handleSelect = index =>
    setList(prevData => ({
      ...prevData,
      [key]: multiple ? [...prevData[key], index] : [index]
    }));

  const handleUnselect = indexRemove =>
    setList(prevData => ({
      ...prevData,
      [key]: prevData[key]?.filter(index => index !== indexRemove)
    }));

  const handleSave = values => {
    setList(prevData => ({
      ...prevData,
      [key]: Object.assign(prevData[key], {
        [editingData.index]: values
      })
    }));
  };

  const handleEdit = (index = list?.length) => {
    const openData = list[index] ?? defaultValue;

    setEditingData({ index, data: openData });
  };

  const handleClone = index => {
    const item = list[index];
    const cloneItem = { ...item, name: `${item?.name}_clone` };
    const cloneData = [...list];
    cloneData.splice(index + 1, 0, cloneItem);

    setList(prevData => ({ ...prevData, [key]: cloneData }));
  };

  const handleRemove = indexRemove => {
    // TODO confirmation??
    setList(prevData => ({
      ...prevData,
      [key]: prevData[key]?.filter((_, index) => index !== indexRemove)
    }));
  };

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
