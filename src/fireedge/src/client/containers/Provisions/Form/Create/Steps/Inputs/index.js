import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'
import { LinearProgress } from '@material-ui/core'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import useFetch from 'client/hooks/useFetch'
import useProvision from 'client/hooks/useProvision'
import { EmptyCard } from 'client/components/Cards'

import {
  STEP_ID as PROVISION_TEMPLATE_ID
} from 'client/containers/Provisions/Form/Create/Steps/ProvisionTemplate'
import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'inputs'

let inputs = []

const Inputs = () => ({
  id: STEP_ID,
  label: 'Inputs configuration',
  resolver: () => STEP_FORM_SCHEMA(inputs),
  optionsValidate: { abortEarly: false },
  content: useCallback(() => {
    const [fields, setFields] = useState(undefined)
    const { watch, reset } = useFormContext()
    const { getProvisionTemplate } = useProvision()
    const { data, fetchRequest, loading } = useFetch(getProvisionTemplate)

    useEffect(() => {
      const {
        [PROVISION_TEMPLATE_ID]: provisionTemplate,
        [STEP_ID]: currentInputs
      } = watch()

      !currentInputs
        ? fetchRequest({ id: provisionTemplate[0] })
        : setFields(FORM_FIELDS(inputs))
    }, [])

    useEffect(() => {
      if (data) {
        inputs = data.TEMPLATE.PROVISION_BODY.inputs ?? []
        setFields(FORM_FIELDS(inputs))
        reset({ ...watch(), [STEP_ID]: STEP_FORM_SCHEMA(inputs).default() })
      }
    }, [data])

    if (!fields && loading) {
      return <LinearProgress />
    }

    return (fields?.length === 0) ? (
      <EmptyCard title={'✔️ There is not inputs to fill'} />
    ) : (
      <form>
        <FormWithSchema cy="form-provider" fields={fields ?? []} id={STEP_ID} />
      </form>
    )
  }, [])
})

export default Inputs
