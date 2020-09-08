import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Box, Grid } from '@material-ui/core';

function FormListSelect({ step, data, setFormData }) {
  const { id, onlyOneSelect, preRender, list, InfoComponent } = step;

  useEffect(() => {
    preRender && preRender();
  }, []);

  const handleSelect = index => {
    // select index => add select to data form
    setFormData(prevData => ({
      ...prevData,
      [id]: onlyOneSelect ? [index] : [...prevData[id], index]
    }));
  };

  const handleUnselect = indexRemove => {
    // unselect index => remove selected from data form
    setFormData(prevData => ({
      ...prevData,
      [id]: prevData[id]?.filter(index => index !== indexRemove)
    }));
  };

  return (
    <Box component="form">
      <Grid container spacing={3}>
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
