import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'

import useProvision from 'client/hooks/useProvision'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'

import {
  STEP_ID as PROVIDER_ID
} from 'client/containers/Providers/Form/Create/Steps/Provider'
import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'connection'

let connection = {}

const Connection = () => ({
  id: STEP_ID,
  label: 'Connection configuration',
  resolver: () => STEP_FORM_SCHEMA(connection),
  optionsValidate: { abortEarly: false },
  content: useCallback(() => {
    const [fields, setFields] = useState([])
    const { providersTemplates } = useProvision()
    const { watch } = useFormContext()

    useEffect(() => {
      const { [PROVIDER_ID]: provider } = watch()
      const providerTemplate = providersTemplates
        .find(({ name }) => name === provider?.[0])

      connection = providerTemplate?.connection ?? {}
      setFields(FORM_FIELDS(connection))
    }, [])

    return (fields?.length === 0) ? (
      <EmptyCard title={'✔️ There is not connections to fill'} />
    ) : (
      <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
    )
  }, [])
})

export default Connection
