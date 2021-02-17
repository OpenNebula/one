import React, { useCallback, useEffect, useState } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { EmptyCard } from 'client/components/Cards'
import { T } from 'client/constants'

import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Providers/Form/Create/Steps/Connection/schema'

export const STEP_ID = 'connection'

let connection = {}

const Connection = () => ({
  id: STEP_ID,
  label: T.ConfigureConnection,
  resolver: () => STEP_FORM_SCHEMA(connection),
  optionsValidate: { abortEarly: false },
  content: useCallback(({ data }) => {
    const [fields, setFields] = useState([])

    useEffect(() => {
      connection = data
      setFields(FORM_FIELDS(connection))
    }, [data])

    return (fields?.length === 0) ? (
      <EmptyCard title={'✔️ There is not connections to fill'} />
    ) : (
      <FormWithSchema cy="form-provider" fields={fields} id={STEP_ID} />
    )
  }, [])
})

export default Connection
