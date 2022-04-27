/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useEffect, useMemo, useCallback } from 'react'
import { Paper, debounce } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'

import { useAuth, useAuthApi } from 'client/features/Auth'
import { useUpdateUserMutation } from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'

import {
  FIELDS,
  SCHEMA,
} from 'client/containers/Settings/ConfigurationUI/schema'
import { FormWithSchema } from 'client/components/Forms'
import { jsonToXml } from 'client/models/Helper'
import { T } from 'client/constants'

/**
 * Section to change user configuration about UI.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const Settings = () => {
  const { user, settings } = useAuth()
  const { changeAuthUser } = useAuthApi()
  const { enqueueError } = useGeneralApi()
  const [updateUser] = useUpdateUserMutation()

  const { watch, handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
    defaultValues: useMemo(
      () => SCHEMA.cast(settings, { stripUnknown: true }),
      [settings]
    ),
  })

  const handleUpdateUser = useCallback(
    debounce(async (formData) => {
      try {
        if (methods?.formState?.isSubmitting) return

        const template = jsonToXml(formData)
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
      sx={{ p: '1em', maxWidth: { sm: 'auto', md: 550 } }}
    >
      <FormProvider {...methods}>
        <FormWithSchema
          cy={'settings-ui'}
          fields={FIELDS}
          legend={T.ConfigurationUI}
        />
      </FormProvider>
    </Paper>
  )
}

export default Settings
