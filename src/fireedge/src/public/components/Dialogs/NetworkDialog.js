import React from 'react';

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

const SELECT = {
  template: 'template',
  network: 'network'
};

const TYPES_NETWORKS = {
  template_id: { text: 'Create', select: SELECT.template, extra: true },
  reserve_from: { text: 'Reserve', select: SELECT.network, extra: true },
  id: { text: 'Existing', select: SELECT.network, extra: false }
};

const ID_CY = 'form-network';

const NetworkDialog = React.memo(
  ({ open, info: network, onSubmit, onCancel }) => {
    const classes = useStyles();
    const { vNetworks, vNetworksTemplates } = useOpennebula();
    const isMobile = useMediaQuery(theme => theme.breakpoints.only('xs'));

    const { register, handleSubmit, errors, control, watch } = useForm({
      reValidateMode: 'onSubmit',
      defaultValues: {
        type: Object.keys(TYPES_NETWORKS)[0],
        ...network
      },
      resolver: yupResolver(
        yup.object().shape({
          mandatory: yup.boolean().required(),
          name: yup.string().required('Name is a required field'),
          description: yup.string(),
          type: yup
            .string()
            .oneOf(Object.keys(TYPES_NETWORKS))
            .required('Type is required field'),
          id: yup
            .string()
            .when('type', {
              is: type =>
                Object.entries(TYPES_NETWORKS)?.some(
                  ([key, { select }]) =>
                    type === key && select === SELECT.network
                ),
              then: yup.string().required('Network is required field'),
              otherwise: yup
                .string()
                .required('Network template is required field')
            })
            .required(),
          extra: yup.string()
        })
      )
    });

    const { type } = watch();
    const typeSelected = TYPES_NETWORKS[type]?.select;

    const selectType =
      typeSelected === SELECT.network ? vNetworks : vNetworksTemplates;

    return (
      <Dialog fullScreen={isMobile} open={open} maxWidth="lg" scroll="paper">
        <DialogTitle id={`${ID_CY}-title`}>
          {network?.name ? 'Edit network' : 'New network'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="mandatory"
                    color="primary"
                    defaultChecked={network?.mandatory}
                    inputProps={{ 'data-cy': `${ID_CY}-mandatory` }}
                    inputRef={register}
                  />
                }
                label={Tr('Mandatory')}
                labelPlacement="end"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="name"
                label={Tr('Name')}
                inputRef={register}
                inputProps={{ 'data-cy': `${ID_CY}-name` }}
                error={errors.name}
                helperText={
                  errors.name && <ErrorHelper label={errors.name?.message} />
                }
                FormHelperTextProps={{ 'data-cy': `${ID_CY}-name-error` }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                name="description"
                label={Tr('Description')}
                inputRef={register}
                inputProps={{ 'data-cy': `${ID_CY}-description` }}
                error={errors.description}
                helperText={
                  errors.description && (
                    <ErrorHelper label={errors.description?.message} />
                  )
                }
                FormHelperTextProps={{
                  'data-cy': `${ID_CY}-description-error`
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                as={
                  <TextField
                    select
                    fullWidth
                    inputProps={{ 'data-cy': `${ID_CY}-type` }}
                    label={Tr('Select a type')}
                    error={errors.type}
                    helperText={
                      errors.type && (
                        <ErrorHelper label={errors.type?.message} />
                      )
                    }
                    FormHelperTextProps={{
                      'data-cy': `${ID_CY}-type-error`
                    }}
                  >
                    {Object.entries(TYPES_NETWORKS).map(([key, { text }]) => (
                      <MenuItem key={`type-${key}`} value={key}>
                        {text}
                      </MenuItem>
                    ))}
                  </TextField>
                }
                name="type"
                control={control}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Controller
                as={
                  <TextField
                    select
                    fullWidth
                    inputProps={{ 'data-cy': `${ID_CY}-id` }}
                    label={Tr('Select a') + SELECT[typeSelected]}
                    error={errors.id}
                    helperText={
                      errors.id && <ErrorHelper label={errors.id?.message} />
                    }
                    FormHelperTextProps={{
                      'data-cy': `${ID_CY}-id-error`
                    }}
                  >
                    {selectType?.map(({ ID, NAME }) => (
                      <MenuItem key={`${typeSelected}-${ID}`} value={ID}>
                        {NAME}
                      </MenuItem>
                    ))}
                  </TextField>
                }
                name="id"
                control={control}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                name="extra"
                label={Tr('Extra template')}
                inputRef={register}
                inputProps={{ 'data-cy': `${ID_CY}-extra` }}
                error={errors.extra}
                helperText={
                  errors.extra && <ErrorHelper label={errors.extra?.message} />
                }
                FormHelperTextProps={{
                  'data-cy': `${ID_CY}-extra-error`
                }}
              />
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
            onClick={handleSubmit(onSubmit)}
          >
            {Tr('Save')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

export default NetworkDialog;
