/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { FormProvider, useForm } from 'react-hook-form'
import PropTypes from 'prop-types'

import { Box } from '@mui/material'
import { yupResolver } from '@hookform/resolvers/yup'

import {
  FORM_FIELDS_ISOLATION,
  FORM_SCHEMA_ISOLATION,
} from 'client/components/Tabs/Host/Numa/UpdateIsolatedCPUS/schema'

import SubmitButton from 'client/components/FormControl/SubmitButton'
import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { useUpdateHostMutation } from 'client/features/OneApi/host'
import { useGeneralApi } from 'client/features/General/hooks'

import { jsonToXml } from 'client/models/Helper'
import { cloneObject } from 'client/utils'

import { T, Host } from 'client/constants'
import { Tr } from 'client/components/HOC'

/**
 * @param {object} props - Props
 * @param {Host} props.host - Host resource
 * @returns {ReactElement} Form for updating isolated CPU
 */
const UpdateIsolatedCPUSForm = ({ host }) => {
  const { TEMPLATE } = host

  const { enqueueError } = useGeneralApi()
  const [updateUserTemplate] = useUpdateHostMutation()

  const { handleSubmit, reset, formState, ...methods } = useForm({
    reValidateMode: 'onSubmit',
    defaultValues: {
      ISOLATION: TEMPLATE.ISOLCPUS,
    },
    resolver: yupResolver(FORM_SCHEMA_ISOLATION),
  })

  const onSubmit = async (formData) => {
    try {
      const newTemplate = cloneObject(TEMPLATE)
      newTemplate.ISOLCPUS = formData.ISOLATION
      const xml = jsonToXml(newTemplate)
      await updateUserTemplate({ id: host.ID, template: xml, replace: 0 })

      // Reset either the entire form state or part of the form state
      reset(formData)
    } catch {
      enqueueError(T.SomethingWrong)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <FormProvider {...methods}>
        <Box display="flex">
          <Box sx={{ flexGrow: 1 }}>
            <FormWithSchema
              cy="numa-isolate-cpus"
              fields={FORM_FIELDS_ISOLATION}
              legend={T.ISOLCPUS}
              legendTooltip={T.TemplateToIsolateCpus}
            />
          </Box>
          <Box
            display="flex"
            alignItems="end"
            justifyContent="center"
            minWidth="7rem"
            paddingBottom="1.25rem"
          >
            <SubmitButton
              color="secondary"
              data-cy="isolate-cpus-submit-button"
              label={Tr(T.Update)}
              onClick={handleSubmit}
              disabled={!formState.isDirty}
              isSubmitting={formState.isSubmitting}
            />
          </Box>
        </Box>
      </FormProvider>
    </Box>
  )
}

UpdateIsolatedCPUSForm.propTypes = {
  host: PropTypes.object.isRequired,
}

UpdateIsolatedCPUSForm.displayName = 'UpdateIsolatedCPUSForm'

export default UpdateIsolatedCPUSForm
