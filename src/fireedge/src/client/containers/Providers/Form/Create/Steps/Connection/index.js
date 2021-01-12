import React, { useCallback, useEffect, useState } from 'react'

import { useFormContext } from 'react-hook-form'

import { useProvision } from 'client/hooks'
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'

import { STEP_ID as TEMPLATE_ID } from 'client/containers/Providers/Form/Create/Steps/Template'
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
    const { provisionsTemplates } = useProvision()
    const { watch, reset } = useFormContext()

    useEffect(() => {
      const {
        [TEMPLATE_ID]: templateSelected,
        [STEP_ID]: currentConnections
      } = watch()

      const { name, provision, provider } = templateSelected?.[0] ?? {}
      const providerTemplate = provisionsTemplates
        ?.[provision]
        ?.providers?.[provider]
        ?.find(providerSelected => providerSelected.name === name) ?? {}

      const {
        location_key: locationKey = '',
        connection: { [locationKey]: _, ...connectionEditable } = {}
      } = providerTemplate

      connection = connectionEditable ?? {}
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
