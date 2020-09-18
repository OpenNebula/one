import React, { useCallback } from 'react';

import FormWithSchema from 'client/components/Forms/FormWithSchema';

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema';

export const STEP_ID = 'role';

const BasicConfiguration = () => ({
  id: STEP_ID,
  label: 'Configuration',
  resolver: STEP_FORM_SCHEMA,
  content: useCallback(
    () => <FormWithSchema cy="form-tier" fields={FORM_FIELDS} id={STEP_ID} />,
    []
  )
});

export default BasicConfiguration;
