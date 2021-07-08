/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
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

import { SubmitButton } from 'client/components/FormControl'
import { RestClient, requestParams } from 'client/utils'

const ResponseForm = ({
  handleChangeResponse,
  command: { name, httpMethod, params }
}) => {
  const { control, handleSubmit, errors, formState } = useForm()

  const onSubmit = dataForm => {
    const command = { name, httpMethod, params }
    const { url, options: { method, data } } = requestParams(dataForm, command)

    RestClient[method.toLowerCase()](url, data).then(({ id, ...res }) => {
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
