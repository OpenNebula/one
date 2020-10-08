import * as yup from 'yup';

export const STEP_FORM_SCHEMA = yup.array(yup.string().trim()).default([]);
