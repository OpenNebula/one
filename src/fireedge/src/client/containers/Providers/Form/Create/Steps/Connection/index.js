import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'
import useProvision from 'client/hooks/useProvision'
import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { STEP_ID as PROVIDER_ID } from 'client/containers/Providers/Form/Create/Steps/Provider'
import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'connection'

let ff = {}

const Connection = () => {
  return {
    id: STEP_ID,
    label: 'Connection configuration',
    resolver: () => STEP_FORM_SCHEMA(ff),
    optionsValidate: { abortEarly: false },
    content: useCallback(({ data, setFormData }) => {
      const [fields, setFields] = useState([])
      const { providersTemplates } = useProvision()
      const { watch } = useFormContext()

      useEffect(() => {
        const { [PROVIDER_ID]: provider } = watch()
        const providerTemplate = providersTemplates
          .find(({ name }) => name === provider?.[0])

        setFields(FORM_FIELDS(providerTemplate?.connection ?? {}))
        ff = providerTemplate?.connection ?? {}

        return () => {
          const connection = watch(STEP_ID)
          setFormData(prev => ({ ...prev, [STEP_ID]: connection }))
        }
      }, [])

      return (
        <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
      )
    }, [])
  }
}

export default Connection
