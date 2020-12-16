import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'

import { useProvision } from 'client/hooks'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'

import {
  STEP_ID as PROVISION_TEMPLATE_ID
} from 'client/containers/Provisions/Form/Create/Steps/Provision'
import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Provisions/Form/Create/Steps/Inputs/schema'

export const STEP_ID = 'inputs'

let inputs = []

const Inputs = () => ({
  id: STEP_ID,
  label: T.ConfigureInputs,
  resolver: () => STEP_FORM_SCHEMA(inputs),
  optionsValidate: { abortEarly: false },
  content: useCallback(() => {
    const [fields, setFields] = useState([])
    const { provisionsTemplates } = useProvision()
    const { watch, reset } = useFormContext()

    useEffect(() => {
      const {
        [PROVISION_TEMPLATE_ID]: provision,
        [STEP_ID]: currentInputs
      } = watch()
      const provisionTemplate = provisionsTemplates
        .find(({ name }) => name === provision?.[0])

      inputs = provisionTemplate?.inputs ?? []
      setFields(FORM_FIELDS(inputs))

      // set defaults inputs values when first render
      !currentInputs && reset({
        ...watch(),
        [STEP_ID]: STEP_FORM_SCHEMA(inputs).default()
      })
    }, [])

    return (fields?.length === 0) ? (
      <EmptyCard title={'✔️ There is not inputs to fill'} />
    ) : (
      <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
    )
  }, [])
})

export default Inputs
