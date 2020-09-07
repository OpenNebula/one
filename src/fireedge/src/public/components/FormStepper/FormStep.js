import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { useFormContext } from 'react-hook-form';
import {
  makeStyles,
  Box,
  CardActionArea,
  CardContent,
  Card,
  Grid
} from '@material-ui/core';
import { Add } from '@material-ui/icons';

const useStyles = makeStyles(() => ({
  cardPlus: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    textAlign: 'center'
  }
}));

function FormStep({ step, data, setFormData }) {
  const classes = useStyles();
  const [dialogFormData, setDialogFormData] = useState({});
  const [showDialog, setShowDialog] = useState(false);
  const { reset } = useFormContext();

  const { id, addAction, InfoComponent, DialogComponent, DEFAULT_DATA } = step;
  const { [id]: stepData } = data;

  useEffect(() => {
    reset({ ...data }, { errors: true });
  }, [id, data]);

  const handleSubmit = values => {
    setFormData(prevData => ({
      ...prevData,
      [id]: Object.assign(prevData[id], {
        [dialogFormData.index]: values
      })
    }));

    setShowDialog(false);
  };

  const handleOpen = (index = stepData?.length) => {
    const openData = stepData[index] ?? DEFAULT_DATA;

    setDialogFormData({ index, data: openData });
    setShowDialog(true);
  };

  const handleClone = index => {
    const cloneData = { ...stepData[index], name: 'clone' };

    setFormData(prevData => {
      prevData[id].splice(index + 1, 0, cloneData);
      return prevData;
    });
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
      <Grid container spacing={3}>
        {addAction && (
          <Grid item xs={12} sm={4} md={3} lg={2}>
            <Card className={classes.cardPlus} raised>
              <CardActionArea onClick={() => handleOpen()}>
                <CardContent>
                  <Add />
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        )}
        {Array.isArray(stepData) &&
          stepData?.map((info, index) => (
            <Grid key={`${id}-${index}`} item xs={12} sm={4} md={3} lg={2}>
              <InfoComponent
                info={info}
                handleEdit={() => handleOpen(index)}
                handleClone={() => handleClone(index)}
                handleRemove={() => handleRemove(index)}
              />
            </Grid>
          ))}
      </Grid>
      {showDialog && (
        <DialogComponent
          open={showDialog}
          info={dialogFormData?.data}
          onSubmit={handleSubmit}
          onCancel={handleClose}
        />
      )}
    </Box>
  );
}

FormStep.propTypes = {
  step: PropTypes.objectOf(PropTypes.object).isRequired,
  data: PropTypes.objectOf(PropTypes.object).isRequired,
  setFormData: PropTypes.func
};

FormStep.defaultProps = {
  step: {},
  data: {},
  setFormData: data => data
};

export default FormStep;
