import * as React from 'react'
import { string, func, shape, object } from 'prop-types'

import { useForm, Controller } from 'react-hook-form'
import {
  TextField,
  Grid,
  Typography,
  FormControlLabel,
  Checkbox
} from '@material-ui/core'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import { requestData, requestParams } from 'client/utils'

const ResponseForm = ({
  handleChangeResponse,
  command: { name, httpMethod, params }
}) => {
  const { control, handleSubmit, errors, formState } = useForm()

  const onSubmit = dataForm => {
    const { url, options } = requestParams(dataForm, {
      name,
      httpMethod,
      params
    })

    requestData(url, options).then(({ id, ...res }) => {
      id === 401 && console.log('ERROR')
      id === 200 && handleChangeResponse(JSON.stringify(res, null, '\t'))
    })
  }

  return (
    <>
      <Typography
        color='textPrimary'
        component='h2'
        variant='h2'
        style={{ padding: '16px 0' }}
      >
        {name || 'Request'}
      </Typography>
      <Grid
        container
        spacing={3}
        justify='flex-start'
        component='form'
        onSubmit={handleSubmit(onSubmit)}
        autoComplete='off'
      >
        {Object.entries(params)?.map(([nameCommand, { default: value }]) => (
          <Grid item xs={12} key={`param-${nameCommand}`}>
            <Controller
              as={
                typeof value === 'boolean' ? (
                  <FormControlLabel
                    control={<Checkbox color='primary' />}
                    label={nameCommand}
                    labelPlacement={nameCommand}
                  />
                ) : (
                  <TextField
                    error={Boolean(errors[name])}
                    helperText={errors[name]?.message}
                    fullWidth
                    label={nameCommand}
                    color='secondary'
                    variant='outlined'
                  />
                )
              }
              control={control}
              name={`${nameCommand}`}
              defaultValue={String(value)}
            />
          </Grid>
        ))}
        <Grid item xs={12}>
          <SubmitButton isSubmitting={formState.isSubmitting} />
        </Grid>
      </Grid>
    </>
  )
}

ResponseForm.propTypes = {
  command: shape({
    name: string.isRequired,
    httpMethod: string.isRequired,
    params: object.isRequired
  }).isRequired,
  handleChangeResponse: func.isRequired
}

ResponseForm.defaultProps = {
  command: {
    name: '',
    httpMethod: 'GET',
    params: {}
  },
  handleChangeResponse: () => undefined
}
export default ResponseForm
