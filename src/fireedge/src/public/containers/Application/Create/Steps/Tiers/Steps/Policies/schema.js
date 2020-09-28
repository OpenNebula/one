import * as yup from 'yup';
import { TYPE_INPUT } from 'client/constants';
import { getValidationFromFields } from 'client/utils/helpers';

export const FORM_FIELDS = [
  {
    name: 'elasticity',
    label: 'Elasticity',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .trim()
      .default('')
  },
  {
    name: 'scheduled',
    label: 'Scheduled',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .trim()
      .default('')
  }
];

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
);
