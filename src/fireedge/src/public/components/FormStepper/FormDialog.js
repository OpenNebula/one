import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import {
  makeStyles,
  Box,
  CardActionArea,
  CardContent,
  Card,
  Grid
} from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { useFormContext } from 'react-hook-form';

import ErrorHelper from 'client/components/FormControl/ErrorHelper';

const useStyles = makeStyles(() => ({
  cardPlus: {
    height: '100%',
    minHeight: 140,
    display: 'flex',
    textAlign: 'center'
  }
}));

function FormDialog({ step, data, setFormData }) {
  const classes = useStyles();
  const { errors } = useFormContext();
  const [dialogFormData, setDialogFormData] = useState({});
  const [showDialog, setShowDialog] = useState(false);

  const {
    id,
    addCardAction,
    preRender,
    InfoComponent,
    DialogComponent,
    DEFAULT_DATA
  } = step;

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
      <Grid container spacing={3}>
        {typeof errors[id]?.message === 'string' && (
          <Grid item xs={12}>
            <ErrorHelper label={errors[id]?.message} />
          </Grid>
        )}
        {addCardAction &&
          React.useMemo(
            () => (
              <Grid item xs={12} sm={4} md={3} lg={2}>
                <Card className={classes.cardPlus} raised>
                  <CardActionArea onClick={() => handleOpen()}>
                    <CardContent>
                      <Add />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ),
            [handleOpen, classes]
          )}
        {Array.isArray(data) &&
          data?.map((info, index) => (
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
      {showDialog && DialogComponent && (
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

FormDialog.propTypes = {
  step: PropTypes.objectOf(PropTypes.any).isRequired,
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  setFormData: PropTypes.func.isRequired
};

FormDialog.defaultProps = {
  step: {},
  data: [],
  setFormData: data => data
};

export default FormDialog;
