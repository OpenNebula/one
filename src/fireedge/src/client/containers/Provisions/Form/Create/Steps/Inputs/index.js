import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'
import { LinearProgress } from '@material-ui/core'

import { useProvision, useFetch, useGeneral } from 'client/hooks'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'
import { deepmerge } from 'client/utils/merge'

import { STEP_ID as PROVIDER_ID } from 'client/containers/Provisions/Form/Create/Steps/Provider'
import { STEP_ID as TEMPLATE_ID } from 'client/containers/Provisions/Form/Create/Steps/Template'
import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Provisions/Form/Create/Steps/Inputs/schema'
import { console } from 'window-or-global'

export const STEP_ID = 'inputs'

let inputs = []

const Inputs = () => ({
  id: STEP_ID,
  label: T.ConfigureInputs,
  resolver: () => STEP_FORM_SCHEMA(inputs),
  optionsValidate: { abortEarly: false },
  content: useCallback(() => {
    const [fields, setFields] = useState(undefined)
    const { changeLoading } = useGeneral()
    const { provisionsTemplates, getProvider } = useProvision()
    const { data: fetchData, fetchRequest, loading } = useFetch(getProvider)
    const { watch, reset } = useFormContext()

    const getProvisionTemplateByDir = ({ provision, provider, name }) =>
      provisionsTemplates
        ?.[provision]
        ?.provisions
        ?.[provider]
        ?.find(provisionTemplate => provisionTemplate.name === name)

    useEffect(() => {
      const { [PROVIDER_ID]: providerSelected, [STEP_ID]: currentInputs } = watch()

      if (!currentInputs) {
        changeLoading(true) // disable finish button until provider is fetched
        fetchRequest({ id: providerSelected[0] })
      } else {
        setFields(FORM_FIELDS(inputs))
      }
    }, [])

    useEffect(() => {
      if (fetchData) {
        const { [TEMPLATE_ID]: provisionTemplateSelected = [] } = watch()
        const { TEMPLATE: { PROVISION_BODY } = {} } = fetchData

        const provisionTemplate = getProvisionTemplateByDir(provisionTemplateSelected?.[0])

        // MERGE INPUTS provision template + PROVISION_BODY.inputs (provider fetch)
        inputs = provisionTemplate.inputs.map(templateInput =>
          PROVISION_BODY.inputs.find(
            providerInput => providerInput.name === templateInput.name
          ) || templateInput
        ) ?? []

        setFields(FORM_FIELDS(inputs))
        reset({ ...watch(), [STEP_ID]: STEP_FORM_SCHEMA(inputs).default() })
      }
    }, [fetchData])

    if (!fields && loading) {
      return <LinearProgress color='secondary' />
    }

    return (fields?.length === 0) ? (
      <EmptyCard title={'✔️ There is not inputs to fill'} />
    ) : (
      <FormWithSchema cy="form-provision" fields={fields} id={STEP_ID} />
    )
  }, [])
})

export default Inputs
