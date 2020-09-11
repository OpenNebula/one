import * as yup from 'yup';
import { TYPE_INPUT } from 'client/constants';
import { getValidationFromFields } from 'client/utils/helpers';

export const FORM_FIELDS = [
  {
    name: 'name',
    label: 'Name',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .min(1)
      .trim()
      .required('Name field is required')
      .default('Main')
  },
  {
    name: 'cardinality',
    label: 'Cardinality',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .number()
      .min(1)
      .required()
      .default(1)
  }
];

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
);
