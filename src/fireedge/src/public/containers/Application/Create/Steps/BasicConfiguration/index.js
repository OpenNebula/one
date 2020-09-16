import React from 'react';

import FormStep from 'client/components/FormStepper/FormStep';
import FormWithSchema from 'client/components/Forms/FormWithSchema';

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema';

const BasicConfiguration = () => {
  const STEP_ID = 'application';

  return {
    id: STEP_ID,
    label: 'Application Overview',
    content: FormStep,
    resolver: STEP_FORM_SCHEMA,
    FormComponent: () => (
      <FormWithSchema cy="form-flow" fields={FORM_FIELDS} id={STEP_ID} />
    )
  };
};

export default BasicConfiguration;
