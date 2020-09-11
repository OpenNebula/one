import React from 'react';

import FormStep from 'client/components/FormStepper/FormStep';

import { STEP_FORM_SCHEMA } from './schema';

const Template = () => {
  const STEP_ID = 'template';

  return {
    id: STEP_ID,
    label: 'Template VM',
    content: FormStep,
    resolver: STEP_FORM_SCHEMA,
    FormComponent: () => <h1>Screen with options</h1>
  };
};

export default Template;
