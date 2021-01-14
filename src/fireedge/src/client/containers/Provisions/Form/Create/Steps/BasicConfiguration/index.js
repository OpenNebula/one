import React, { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/containers/Provisions/Form/Create/Steps/BasicConfiguration/schema'

export const STEP_ID = 'configuration'

const BasicConfiguration = () => ({
  id: STEP_ID,
  label: T.ProvisionOverview,
  resolver: () => STEP_FORM_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => <FormWithSchema cy="form-provision" fields={FORM_FIELDS} id={STEP_ID} />,
    []
  )
})

export default BasicConfiguration
