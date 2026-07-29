/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'
import { Stack, Box } from '@mui/material'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { useGeneralApi, HostAPI } from '@FeaturesModule'

import {
  FORM_FIELDS_NUMA,
  FORM_SCHEMA_NUMA,
} from '@modules/resources/resources/Host/Tabs/Numa/UpdateNuma/schema'
import { FormWithSchema, SubmitButton } from '@ComponentsV2Module'
import { T, Host } from '@ConstantsModule'

import { jsonToXml } from '@UtilsModule'

/**
 * @param {object} props - Props
 * @param {Host} props.host - Host resource
 * @returns {ReactElement} Form for updating pin policy
 */
export const UpdateNumaForm = ({ host }) => {
  const { TEMPLATE } = host

  const { enqueueError, enqueueSuccess } = useGeneralApi()
  const [updateUserTemplate] = HostAPI.useUpdateHostMutation()

  const { watch, handleSubmit, reset, formState, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: {
      PIN_POLICY: TEMPLATE?.PIN_POLICY,
      ISOLATION: TEMPLATE?.ISOLCPUS,
    },
    resolver: yupResolver(FORM_SCHEMA_NUMA),
  })

  const onSubmit = async (formData) => {
    try {
      const data = {
        ISOLCPUS: formData.ISOLATION,
        PIN_POLICY: formData.PIN_POLICY,
      }

      const xml = jsonToXml(data)
      await updateUserTemplate({ id: host.ID, template: xml, replace: 1 })

      // Reset either the entire form state or part of the form state
      reset(formData)

      // Succesful message
      enqueueSuccess(T.HostConfigUpdated)
    } catch {
      enqueueError(T.SomethingWrong)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <FormProvider {...methods}>
        <Stack direction="row" alignItems="center">
          <FormWithSchema cy="update-numa" fields={FORM_FIELDS_NUMA} />
          <SubmitButton
            data-cy="isolate-cpus-submit-button"
            label={T.Update}
            onClick={handleSubmit}
            disabled={!formState.isDirty}
            isSubmitting={formState.isSubmitting}
          />
        </Stack>
      </FormProvider>
    </Box>
  )
}

UpdateNumaForm.propTypes = {
  host: PropTypes.object.isRequired,
}
UpdateNumaForm.displayName = 'UpdateNumaForm'
