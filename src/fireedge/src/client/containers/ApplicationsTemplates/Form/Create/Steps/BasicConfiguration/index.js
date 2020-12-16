import React, { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'
import { T } from 'client/constants'

export const STEP_ID = 'application'

const BasicConfiguration = () => ({
  id: STEP_ID,
  label: T.ApplicationOverview,
  resolver: STEP_FORM_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => <FormWithSchema cy="form-flow" fields={FORM_FIELDS} id={STEP_ID} />,
    []
  )
})

export default BasicConfiguration
