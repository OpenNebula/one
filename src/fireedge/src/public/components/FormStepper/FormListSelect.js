import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Box, Grid } from '@material-ui/core';
import { useFormContext } from 'react-hook-form';

import ErrorHelper from '../FormControl/ErrorHelper';

function FormListSelect({ step, data, setFormData }) {
  const { errors } = useFormContext();
  const { id, onlyOneSelect, preRender, list, InfoComponent } = step;

  useEffect(() => {
    preRender && preRender();
  }, []);

  const handleSelect = index =>
    setFormData(prevData => ({
      ...prevData,
      [id]: onlyOneSelect ? [index] : [...prevData[id], index]
    }));

  const handleUnselect = indexRemove =>
    setFormData(prevData => ({
      ...prevData,
      [id]: prevData[id]?.filter(index => index !== indexRemove)
    }));

  return (
    <Box component="form">
      <Grid container spacing={3}>
        {typeof errors[id]?.message === 'string' && (
          <Grid item xs={12}>
            <ErrorHelper label={errors[id]?.message} />
          </Grid>
        )}
        {Array.isArray(list) &&
          list?.map((info, index) => (
            <Grid key={`${id}-${index}`} item xs={6} sm={4} md={3} lg={1}>
              <InfoComponent
                info={info}
                isSelected={data?.some(selected => selected === info?.ID)}
                handleSelect={handleSelect}
                handleUnselect={handleUnselect}
              />
            </Grid>
          ))}
      </Grid>
    </Box>
  );
}

FormListSelect.propTypes = {
  step: PropTypes.objectOf(PropTypes.any).isRequired,
  data: PropTypes.arrayOf(PropTypes.any).isRequired,
  setFormData: PropTypes.func.isRequired
};

FormListSelect.defaultProps = {
  step: {},
  data: [],
  setFormData: data => data
};

export default FormListSelect;
