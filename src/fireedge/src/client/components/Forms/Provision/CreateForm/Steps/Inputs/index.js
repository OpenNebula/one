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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'
import { LinearProgress } from '@mui/material'

import { useGeneralApi } from 'client/features/General'
import { useLazyGetProviderQuery } from 'client/features/OneApi/provider'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'
import { deepmerge } from 'client/utils'

import { STEP_ID as PROVIDER_ID } from 'client/components/Forms/Provision/CreateForm/Steps/Provider'
import { STEP_ID as TEMPLATE_ID } from 'client/components/Forms/Provision/CreateForm/Steps/Template'
import {
  FORM_FIELDS,
  STEP_FORM_SCHEMA,
} from 'client/components/Forms/Provision/CreateForm/Steps/Inputs/schema'

export const STEP_ID = 'inputs'

let inputs = []

const Inputs = () => ({
  id: STEP_ID,
  label: T.ConfigureInputs,
  resolver: () => STEP_FORM_SCHEMA(inputs),
  optionsValidate: { abortEarly: false },
  content: () => {
    const [fields, setFields] = useState(undefined)
    const { watch, reset } = useFormContext()
    const { changeLoading } = useGeneralApi()
    const [getProvider, { data: fetchData }] = useLazyGetProviderQuery()

    useEffect(() => {
      const { [PROVIDER_ID]: providerSelected = [], [STEP_ID]: currentInputs } =
        watch()

      if (!currentInputs) {
        changeLoading(true) // disable finish button until provider is fetched
        getProvider(providerSelected[0]?.ID)
      } else {
        setFields(FORM_FIELDS(inputs))
      }
    }, [])

    useEffect(() => {
      if (fetchData) {
        const { [TEMPLATE_ID]: provisionTemplateSelected = [] } = watch()
        const { TEMPLATE: { PROVISION_BODY } = {} } = fetchData

        const templateInputs = provisionTemplateSelected?.[0]?.inputs ?? []

        // MERGE INPUTS provision template + PROVISION_BODY.inputs (provider fetch)
        inputs = templateInputs.map((templateInput) => {
          const providerInput = PROVISION_BODY.inputs?.find(
            (input) => input.name === templateInput.name
          )

          return deepmerge(templateInput, providerInput ?? {})
        })

        setFields(FORM_FIELDS(inputs))
        reset({ ...watch(), [STEP_ID]: STEP_FORM_SCHEMA(inputs).default() })
      }
    }, [fetchData])

    if (!fields) {
      return <LinearProgress color="secondary" />
    }

    return fields?.length === 0 ? (
      <EmptyCard title={'✔️ There is not inputs to fill'} />
    ) : (
      <FormWithSchema cy="form-provision" fields={fields} id={STEP_ID} />
    )
  },
})

export default Inputs
