import * as yup from 'yup';
import { TYPE_INPUT } from 'client/constants';
import { getValidationFromFields } from 'client/utils/helpers';

export const FORM_FIELDS = [
  {
    name: 'template',
    label: 'Template VM',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .min(1)
      .trim()
      .required('Template field is required')
      .default('0')
  }
];

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
);
