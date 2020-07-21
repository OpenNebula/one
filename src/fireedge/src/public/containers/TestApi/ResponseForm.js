import React from 'react';
import { object, string, shape, func } from 'prop-types';

import { useForm, Controller } from 'react-hook-form';
import {
  TextField,
  Grid,
  Typography,
  Box,
  FormControlLabel,
  Checkbox
} from '@material-ui/core';

import ButtonSubmit from 'client/components/FormControl/SubmitButton';
import { requestData } from 'client/utils';
import { from as resourceFrom } from 'server/utils/constants/defaults';

const getQueries = params =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === resourceFrom.query)
    ?.map(([name, { default: value }]) => `${name}=${encodeURI(value)}`)
    ?.join('&');

const getResources = params =>
  Object.values(params)
    ?.filter(({ from }) => from === resourceFrom.resource)
    ?.map(({ default: value }) => value)
    ?.join('/');

const getDataBody = params =>
  Object.entries(params)
    ?.filter(([, { from }]) => from === resourceFrom.postBody)
    ?.reduce(
      (acc, [name, { default: value }]) => ({ ...acc, [name]: value }),
      {}
    );

const ResponseForm = ({
  handleChangeResponse,
  command: { name, httpMethod, params }
}) => {
  const { control, handleSubmit, errors, formState } = useForm();

  const onSubmit = dataForm => {
    /* Spread 'from' values in current params */
    const reqParams = Object.entries(params)?.reduce(
      (acc, [param, { from }]) => ({
        ...acc,
        [param]: { from, ...dataForm[param] }
      }),
      {}
    );

    const queries = getQueries(reqParams);
    const resources = getResources(reqParams);
    const data = getDataBody(reqParams);

    const url = `api/${name.replace('.', '/')}`;

    requestData(`${url}/${resources}?${queries}`, {
      data,
      method: httpMethod,
      authenticate: true
    }).then(({ id, ...res }) => {
      id === 401 && console.log('ERROR');
      id === 200 && handleChangeResponse(JSON.stringify(res, null, '\t'));
    });
  };

  return (
    <Box width="100%">
      <Typography component="h2" variant="h2" style={{ padding: '16px 0' }}>
        {name || 'Request'}
      </Typography>
      <Grid
        container
        spacing={3}
        justify="flex-start"
        style={{ height: '100%' }}
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        autoComplete="off"
      >
        {Object.entries(params)?.map(([nameCommand, { default: value }]) => (
          <Grid item xs={12} key={`param-${nameCommand}`}>
            <Controller
              as={
                typeof value === 'boolean' ? (
                  <FormControlLabel
                    control={<Checkbox color="primary" />}
                    label={nameCommand}
                    labelPlacement={nameCommand}
                  />
                ) : (
                  <TextField
                    error={Boolean(errors[name])}
                    helperText={errors[name]?.message}
                    fullWidth
                    label={nameCommand}
                    variant="outlined"
                  />
                )
              }
              control={control}
              name={`${nameCommand}.default`}
              defaultValue={value}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <ButtonSubmit isSubmitting={formState.isSubmitting} />
        </Grid>
      </Grid>
    </Box>
  );
};

ResponseForm.propTypes = {
  command: shape({
    name: string.isRequired,
    httpMethod: string.isRequired,
    schema: object,
    params: object
  }).isRequired,
  handleChangeResponse: func
};

ResponseForm.defaultProps = {
  command: {
    name: '',
    httpMethod: 'GET',
    schema: {},
    params: {}
  },
  handleChangeResponse: () => undefined
};
export default ResponseForm;
