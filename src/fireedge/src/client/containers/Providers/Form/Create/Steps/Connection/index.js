import React, { useCallback, useEffect, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { capitalize } from 'client/utils'
import { T } from 'client/constants'
import * as ProviderTemplateModel from 'client/models/ProviderTemplate'

import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Providers/Form/Create/Steps/Connection/schema'

import {
  STEP_ID as TEMPLATE_ID
} from 'client/containers/Providers/Form/Create/Steps/Template'

export const STEP_ID = 'connection'

let connection = {}
let providerType

const Connection = ({ isUpdate }) => ({
  id: STEP_ID,
  label: T.ConfigureConnection,
  resolver: () => STEP_FORM_SCHEMA({ connection, providerType }),
  optionsValidate: { abortEarly: false },
  content: useCallback(({ data }) => {
    const [fields, setFields] = useState([])
    const { watch } = useFormContext()

    useEffect(() => {
      const { [TEMPLATE_ID]: templateSelected, [STEP_ID]: currentConnection } = watch()

      const { provider, ...template } = templateSelected?.[0]

      providerType = provider

      connection = isUpdate
        // when is updating, connections have the name as input label
        ? Object.keys(currentConnection)
          .reduce((res, name) => ({ ...res, [name]: capitalize(name) }), {})
        // set connections from template, to take value as input labels
        : ProviderTemplateModel.getConnectionEditable(template)

      setFields(FORM_FIELDS({ connection, providerType }))
    }, [data])

    return (fields?.length === 0) ? (
      <EmptyCard title={"✔️ There aren't connections to fill"} />
    ) : (
      <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
    )
  }, [])
})

export * from 'client/containers/Providers/Form/Create/Steps/Connection/schema'
export default Connection
