import React, { useMemo, useEffect } from 'react';

import {
  makeStyles,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  FormControlLabel,
  Checkbox,
  TextField,
  MenuItem
} from '@material-ui/core';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers';
import * as yup from 'yup';

import useOpennebula from 'client/hooks/useOpennebula';
import ErrorHelper from 'client/components/FormControl/ErrorHelper';
import { Tr } from 'client/components/HOC';

const useStyles = makeStyles(theme => ({}));

const ID_CY = 'form-role';

const NetworkDialog = React.memo(({ open, info: role, onSubmit, onCancel }) => {
  // const classes = useStyles();
  const { templates } = useOpennebula();
  const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'));

  const { register, handleSubmit, errors, control } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: role
    // resolver: yupResolver(yup.object().shape({}))
  });

  return (
    <Dialog fullScreen={isMobile} open={open} maxWidth="lg" scroll="paper">
      <DialogTitle id={`${ID_CY}-title`}>
        {role?.name ? 'Edit role' : 'New role'}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {'ROLE FORM'}
            {/*  <Controller
              as={
                <TextField
                  select
                  fullWidth
                  inputProps={{ 'data-cy': `${ID_CY}-id` }}
                  label={Tr('Select a vm')}
                  error={errors.template}
                  helperText={
                    errors.template && (
                      <ErrorHelper label={errors.template?.message} />
                    )
                  }
                  FormHelperTextProps={{
                    'data-cy': `${ID_CY}-id-error`
                  }}
                >
                  {templates?.map(({ ID, NAME }) => (
                    <MenuItem key={`template-${ID}`} value={ID}>
                      {NAME}
                    </MenuItem>
                  ))}
                </TextField>
              }
              name="template"
              control={control}
            /> */}
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          {Tr('Cancel')}
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          onClick={handleSubmit(() => onSubmit(role))}
        >
          {Tr('Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

export default NetworkDialog;
