import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { Box } from '@material-ui/core';
import { useFormContext } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';

function FormList({ step, data, setFormData }) {
  const { errors } = useFormContext();
  const [dialogFormData, setDialogFormData] = useState({});
  const [showDialog, setShowDialog] = useState(false);

  const { id, preRender, ListComponent, DialogComponent, DEFAULT_DATA } = step;

  useEffect(() => {
    preRender && preRender();
  }, []);

  const handleSubmit = values => {
    setFormData(prevData => ({
      ...prevData,
      [id]: Object.assign(prevData[id], {
        [dialogFormData.index]: values
      })
    }));

    setShowDialog(false);
  };

  const handleOpen = (index = data?.length) => {
    const openData = data[index] ?? DEFAULT_DATA;

    setDialogFormData({ index, data: openData });
    setShowDialog(true);
  };

  const handleClone = index => {
    const item = data[index];
    const cloneItem = { ...item, name: `${item?.name}_clone` };
    const cloneData = [...data];
    cloneData.splice(index + 1, 0, cloneItem);

    setFormData(prevData => ({ ...prevData, [id]: cloneData }));
  };

  const handleRemove = indexRemove => {
    // TODO confirmation??
    setFormData(prevData => ({
      ...prevData,
      [id]: prevData[id]?.filter((_, index) => index !== indexRemove)
    }));
  };

  const handleClose = () => setShowDialog(false);

  return (
    <Box component="form">
      {typeof errors[id]?.message === 'string' && (
        <ErrorHelper label={errors[id]?.message} />
      )}
      <ListComponent
        list={data}
        addCardClick={() => handleOpen()}
        itemsProps={({ index }) => ({
          handleEdit: () => handleOpen(index),
          handleClone: () => handleClone(index),
          handleRemove: () => handleRemove(index)
        })}
      />
      {showDialog && DialogComponent && (
        <DialogComponent
          open={showDialog}
          values={dialogFormData?.data}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      )}
    </Box>
  );
}

FormList.propTypes = {
  step: PropTypes.objectOf(PropTypes.any).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  setFormData: PropTypes.func.isRequired
};

FormList.defaultProps = {
  step: {},
  data: [],
  setFormData: data => data
};

export default FormList;
