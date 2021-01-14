import React, { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Providers/Form/Create/Steps/BasicConfiguration/schema'

export const STEP_ID = 'configuration'

const BasicConfiguration = ({ isUpdate }) => ({
  id: STEP_ID,
  label: T.ProviderOverview,
  resolver: () => STEP_FORM_SCHEMA({ isUpdate }),
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => <FormWithSchema cy="form-provider" fields={FORM_FIELDS({ isUpdate })} id={STEP_ID} />,
    []
  )
})

export default BasicConfiguration
