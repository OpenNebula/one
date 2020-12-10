import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'

import { useProvision } from 'client/hooks'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'

import {
  STEP_ID as PROVIDER_ID
} from 'client/containers/Providers/Form/Create/Steps/Provider'
import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'connection'

let connection = {}

const Connection = () => ({
  id: STEP_ID,
  label: T.ConfigureConnection,
  resolver: () => STEP_FORM_SCHEMA(connection),
  optionsValidate: { abortEarly: false },
  content: useCallback(() => {
    const [fields, setFields] = useState([])
    const { providersTemplates } = useProvision()
    const { watch, reset } = useFormContext()

    useEffect(() => {
      const {
        [PROVIDER_ID]: provider,
        [STEP_ID]: currentConnections
      } = watch()
      const providerTemplate = providersTemplates
        .find(({ name }) => name === provider?.[0])

      connection = providerTemplate?.connection ?? {}
      setFields(FORM_FIELDS(connection))

      // set defaults connection values when first render
      !currentConnections && reset({
        ...watch(),
        [STEP_ID]: STEP_FORM_SCHEMA(connection).default()
      })
    }, [])

    return (fields?.length === 0) ? (
      <EmptyCard title={'✔️ There is not connections to fill'} />
    ) : (
      <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
    )
  }, [])
})

export default Connection
