import React, { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'

export const STEP_ID = 'tier'

const BasicConfiguration = () => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: STEP_FORM_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => <FormWithSchema cy="form-tier" fields={FORM_FIELDS} id={STEP_ID} />,
    []
  )
})

export default BasicConfiguration
