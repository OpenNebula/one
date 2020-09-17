import React, { useEffect } from 'react';
import PropTypes from 'prop-types';

import { Grid } from '@material-ui/core';
import { useFormContext } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';
import { EmptyCard } from 'client/components/Cards';

function FormListSelect({ step, data, setFormData }) {
  const { errors } = useFormContext();
  const { id, multiple, preRender, list, ItemComponent } = step;

  useEffect(() => {
    if (preRender) preRender();
  }, []);

  const handleSelect = index =>
    setFormData(prevData => ({
      ...prevData,
      [id]: multiple ? [...prevData[id], index] : [index]
    }));

  const handleUnselect = indexRemove =>
    setFormData(prevData => ({
      ...prevData,
      [id]: prevData[id]?.filter(index => index !== indexRemove)
    }));

  return (
    <Grid container spacing={3}>
      {typeof errors[id]?.message === 'string' && (
        <Grid item xs={12}>
          <ErrorHelper label={errors[id]?.message} />
        </Grid>
      )}
      {list?.length === 0 ? (
        <Grid item xs={6} sm={4} md={3} lg={1}>
          <EmptyCard name={id} />
        </Grid>
      ) : (
        list?.map((info, index) => (
          <Grid key={`${id}-${index}`} item xs={6} sm={4} md={3} lg={1}>
            <ItemComponent
              value={info}
              isSelected={data?.some(selected => selected === info?.ID)}
              handleSelect={handleSelect}
              handleUnselect={handleUnselect}
            />
          </Grid>
        ))
      )}
    </Grid>
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
