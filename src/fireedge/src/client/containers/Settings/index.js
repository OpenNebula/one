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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect } from 'react'

import { Container, Paper, Box, Typography } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import SubmitButton from 'client/components/FormControl/SubmitButton'

import { useAuth, useAuthApi } from 'client/features/Auth'
import { useUserApi } from 'client/features/One'
import { useGeneralApi } from 'client/features/General'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

import { FORM_FIELDS, FORM_SCHEMA } from 'client/containers/Settings/schema'
import { mapUserInputs } from 'client/utils'
import * as Helper from 'client/models/Helper'

const useStyles = makeStyles(theme => ({
  header: {
    paddingTop: '1rem'
  },
  title: {
    flexGrow: 1,
    letterSpacing: 0.1,
    fontWeight: 500
  },
  wrapper: {
    backgroundColor: theme.palette.background.default,
    maxWidth: 550,
    padding: '1rem'
  },
  subheader: {
    marginBottom: '1rem'
  },
  actions: {
    padding: '1rem 0',
    textAlign: 'end'
  }
}))

const Settings = () => {
  const classes = useStyles()
  const { user, settings } = useAuth()
  const { getAuthUser } = useAuthApi()
  const { updateUser } = useUserApi()
  const { enqueueError } = useGeneralApi()

  const { handleSubmit, setError, reset, formState, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: settings,
    resolver: yupResolver(FORM_SCHEMA)
  })

  useEffect(() => {
    reset(
      FORM_SCHEMA.cast(settings),
      { isSubmitted: false, error: false }
    )
  }, [settings])

  const onSubmit = async dataForm => {
    try {
      const inputs = mapUserInputs(dataForm)
      const template = Helper.jsonToXml({ FIREEDGE: inputs })

      await updateUser(user.ID, { template }).then(getAuthUser)
    } catch {
      enqueueError(Tr(T.SomethingWrong))
    }
  }

  return (
    <Container disableGutters>
      <div className={classes.header}>
        <Typography variant='h5' className={classes.title}>
          {Tr(T.Settings)}
        </Typography>
      </div>

      <hr />

      <Paper className={classes.wrapper} variant='outlined'>
        <Typography variant='overline' component='div' className={classes.subheader}>
          {`${Tr(T.Configuration)} UI`}
        </Typography>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <FormProvider {...methods}>
            <FormWithSchema cy='settings' fields={FORM_FIELDS} />
          </FormProvider>
          <div className={classes.actions}>
            <SubmitButton
              color='secondary'
              data-cy='settings-submit-button'
              label={Tr(T.Save)}
              onClick={handleSubmit}
              disabled={!formState.isDirty}
              isSubmitting={formState.isSubmitting}
            />
          </div>
        </Box>
      </Paper>
    </Container>
  )
}

export default Settings
