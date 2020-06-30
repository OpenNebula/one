import React from 'react'
import { object, string, shape } from 'prop-types'

import { useForm, Controller } from 'react-hook-form'
import {
  TextField, Grid, Typography, Box, FormControlLabel, Checkbox
} from '@material-ui/core'

import ButtonSubmit from '../../FormControl/submitButton'
import { requestData } from '../../../utils'
import * as DEFAULTS from '../../../../config/defaults'


const getQueries = params => Object.entries(params)
  ?.filter(([, { from }]) => from === DEFAULTS.from.query)
  ?.map(([name, { default: value }]) => `${name}=${encodeURI(value)}`)
  ?.join('&')

const getResources = params => Object.values(params)
  ?.filter(({ from }) => from === DEFAULTS.from.resource)
  ?.map(({ default: value }) => value)
  ?.join('/')

const getDataBody = params => Object.entries(params)
  ?.filter(([, { from }]) => from === DEFAULTS.from.postBody)
  ?.reduce((acc, [name, { default: value }]) => (
      { ...acc, [name]: value }
    ), {})


export default function ResponseForm({
  handleChangeResponse,
  command: { name, httpMethod, params }
}) {
  const { control, handleSubmit, errors, formState } = useForm()

  const onSubmit = dataForm => {
    /* Spread 'from' values in current params */
    const reqParams = Object.entries(params)
      ?.reduce((acc, [name, { from }]) => ({
        ...acc, [name]: { from, ...dataForm[name] }
      }), {})

    const queries = getQueries(reqParams)
    const resources = getResources(reqParams)
    const data = getDataBody(reqParams)

    const url = `api/${name.replace('.', '/')}`
    
    requestData(
      `${url}/${resources}?${queries}`,
      { data, method: httpMethod, authenticate: true }
    ).then(({ id, ...res }) => {
      id === 401 && console.log('ERROR')
      id === 200 && handleChangeResponse(JSON.stringify(res, null, '\t'))
    })
  }
  
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
        {Object.entries(params)?.map(([name, { default: value }]) =>
          <Grid item xs={12} key={`param-${name}`}>
            <Controller
              as={
                typeof value === "boolean"
                ? <FormControlLabel
                    control={<Checkbox color="primary" />}
                    label={name}
                    labelPlacement={name}
                  />
                : <TextField
                  error={Boolean(errors[name])}
                  helperText={errors[name]?.message}
                  fullWidth
                  label={name}
                  variant="outlined"
                />
              }
              control={control}
              name={`${name}.default`}
              defaultValue={value}
            />
          </Grid>
        )}
        <Grid item xs={12}>
          <ButtonSubmit isSubmitting={formState.isSubmitting} />
        </Grid>
      </Grid>
    </Box>
  )
}

ResponseForm.propTypes = {
  command: shape({
    name: string.isRequired, 
    httpMethod: string.isRequired,
    schema: object,
    params: object
  }).isRequired
}

ResponseForm.defaultProps = {
  command: {
    name: '',
    httpMethod: 'GET',
    schema: {},
    params: {}
  }
}