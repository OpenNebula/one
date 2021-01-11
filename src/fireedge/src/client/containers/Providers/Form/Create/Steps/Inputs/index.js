import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'

import { useProvision } from 'client/hooks'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'

import { STEP_ID as TEMPLATE_ID } from 'client/containers/Providers/Form/Create/Steps/Template'
import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Providers/Form/Create/Steps/Inputs/schema'

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
        [TEMPLATE_ID]: templateSelected,
        [STEP_ID]: currentInputs
      } = watch()

      const { name, provision, provider } = templateSelected?.[0]
      const providerTemplate = provisionsTemplates
        ?.[provision]
        ?.providers?.[provider]
        ?.find(providerSelected => providerSelected.name === name) ?? {}

      inputs = providerTemplate?.inputs ?? []
      console.log('inputs', inputs)
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
