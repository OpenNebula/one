import * as yup from 'yup';

export const STEP_FORM_SCHEMA = yup
  .array()
  .of(yup.string().trim())
  .default(undefined);
