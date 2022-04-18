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
import { ReactElement, useEffect, useMemo, useRef } from 'react'
import { Paper, Stack, CircularProgress } from '@mui/material'
import { useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useAuth } from 'client/features/Auth'
import { useUpdateUserMutation } from 'client/features/OneApi/user'
import { useGeneralApi } from 'client/features/General'

import {
  FIELDS,
  SCHEMA,
} from 'client/containers/Settings/ConfigurationUI/schema'
import { FormWithSchema } from 'client/components/Forms'
import { Translate } from 'client/components/HOC'
import { jsonToXml } from 'client/models/Helper'
import { T } from 'client/constants'

/** @returns {ReactElement} Settings configuration UI */
const Settings = () => {
  const fieldsetRef = useRef([])
  const { user, settings } = useAuth()
  const [updateUser, { isLoading }] = useUpdateUserMutation()
  const { enqueueError } = useGeneralApi()

  const { watch, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: useMemo(() => SCHEMA.cast(settings), [settings]),
    resolver: yupResolver(SCHEMA),
  })

  useEffect(() => {
    watch((formData) => {
      try {
        if (isLoading) return

        const castedData = SCHEMA.cast(formData, { isSubmit: true })
        const template = jsonToXml(castedData)

        updateUser({ id: user.ID, template })
      } catch {
        enqueueError(T.SomethingWrong)
      }
    })
  }, [watch])

  useEffect(() => {
    fieldsetRef.current.disabled = isLoading
  }, [isLoading])

  return (
    <Paper
      variant="outlined"
      sx={{ p: '1em', maxWidth: { sm: 'auto', md: 550 } }}
    >
      <FormProvider {...methods}>
        <FormWithSchema
          cy={'settings-ui'}
          fields={FIELDS}
          rootProps={{ ref: fieldsetRef }}
          legend={
            <Stack direction="row" alignItems="center" gap="1em">
              <Translate word={T.ConfigurationUI} />
              {isLoading && <CircularProgress size={20} color="secondary" />}
            </Stack>
          }
        />
      </FormProvider>
    </Paper>
  )
}

export default Settings
