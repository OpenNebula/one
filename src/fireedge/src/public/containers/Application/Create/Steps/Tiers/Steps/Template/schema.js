import * as yup from 'yup';
import { getValidationFromFields } from 'client/utils/helpers';

export const FORM_FIELDS = [
  {
    name: 'template',
    validation: yup.string().trim()
  },
  {
    name: 'app',
    validation: yup.string().trim()
  },
  {
    name: 'docker',
    validation: yup.string().trim()
  }
];

export const STEP_FORM_SCHEMA = yup
  .object(getValidationFromFields(FORM_FIELDS))
  .required('Template is required')
  .default(undefined);
