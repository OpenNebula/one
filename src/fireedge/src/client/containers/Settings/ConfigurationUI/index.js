/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { Box, Link, Paper, debounce } from '@mui/material'
import { ReactElement, useCallback, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

import { useAuth, useAuthApi, useViews } from 'client/features/Auth'

import makeStyles from '@mui/styles/makeStyles'
import { useGeneralApi } from 'client/features/General'
import { useUpdateUserMutation } from 'client/features/OneApi/user'
import { useGetZonesQuery } from 'client/features/OneApi/zone'

import { PATH } from 'client/apps/sunstone/routesOne'
import { FormWithSchema } from 'client/components/Forms'
import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'
import {
  FIELDS,
  SCHEMA,
} from 'client/containers/Settings/ConfigurationUI/schema'
import { jsonToXml } from 'client/models/Helper'
import { Link as RouterLink, generatePath } from 'react-router-dom'

const useStyles = makeStyles((theme) => ({
  content: {
    textAlign: 'right',
  },
}))

/**
 * Section to change user configuration about UI.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const Settings = () => {
  const { user, settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { data: zones = [], isLoading } = useGetZonesQuery()

  const { changeAuthUser } = useAuthApi()
  const { enqueueError } = useGeneralApi()
  const [updateUser] = useUpdateUserMutation()
  const { views, view: userView } = useViews()

  const classes = useStyles()
  const { watch, handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
    defaultValues: useMemo(
      () =>
        SCHEMA({ views, userView, zones }).cast(fireedge, {
          stripUnknown: true,
        }),
      [fireedge, zones]
    ),
  })

  const handleUpdateUser = useCallback(
    debounce(async (formData) => {
      try {
        if (methods?.formState?.isSubmitting) return
        const template = jsonToXml({ FIREEDGE: formData })
        await updateUser({ id: user.ID, template, replace: 1 })
      } catch {
        enqueueError(T.SomethingWrong)
      }
    }, 1000),
    [updateUser]
  )

  useEffect(() => {
    const subscription = watch((formData) => {
      // update user settings before submit
      const newSettings = { TEMPLATE: { ...user.TEMPLATE, ...formData } }
      changeAuthUser({ ...user, ...newSettings })

      handleSubmit(handleUpdateUser)()
    })

    return () => subscription.unsubscribe()
  }, [watch])

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit(handleUpdateUser)}
      variant="outlined"
      sx={{ p: '1em' }}
    >
      {!isLoading && (
        <FormProvider {...methods}>
          <FormWithSchema
            cy={'settings-ui'}
            fields={FIELDS({ views, userView, zones })}
            legend={T.ConfigurationUI}
          />
        </FormProvider>
      )}
      <Box className={classes.content}>
        <Link
          color="secondary"
          component={RouterLink}
          to={generatePath(PATH.SYSTEM.USERS.DETAIL, { id: user.ID })}
        >
          <Translate word={T.LinkOtherConfigurationsUser} values={user.ID} />
        </Link>
      </Box>
    </Paper>
  )
}

export default Settings
