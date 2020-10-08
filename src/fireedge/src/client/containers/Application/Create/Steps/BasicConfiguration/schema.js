import * as yup from 'yup';
import { TYPE_INPUT } from 'client/constants';
import { getValidationFromFields } from 'client/utils/helpers';

const STRATEGIES_DEPLOY = [
  { text: 'None', value: 'none' },
  { text: 'Straight', value: 'straight' }
];

const SHUTDOWN_ACTIONS = [
  { text: 'None', value: 'none' },
  { text: 'Terminate', value: 'terminate' },
  { text: 'Terminate hard', value: 'terminate-hard' }
];

export const FORM_FIELDS = [
  {
    name: 'name',
    label: 'Name',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .min(1, 'Name field is required')
      .matches(/^[\w+\s*]+$/g, { message: 'Invalid characters' })
      .trim()
      .required('Name field is required')
      .default('')
  },
  {
    name: 'description',
    label: 'Description',
    type: TYPE_INPUT.TEXT,
    multiline: true,
    validation: yup
      .string()
      .trim()
      .default('')
  },
  {
    name: 'deployment',
    label: 'Select a strategy',
    type: TYPE_INPUT.SELECT,
    values: STRATEGIES_DEPLOY,
    validation: yup
      .string()
      .trim()
      .required('Strategy deployment field is required')
      .oneOf(STRATEGIES_DEPLOY.map(({ value }) => value))
      .default(STRATEGIES_DEPLOY[1].value)
  },
  {
    name: 'shutdown_action',
    label: 'Select a VM shutdown action',
    type: TYPE_INPUT.SELECT,
    values: SHUTDOWN_ACTIONS,
    validation: yup
      .string()
      .oneOf(SHUTDOWN_ACTIONS.map(({ value }) => value))
      .default(SHUTDOWN_ACTIONS[0].value)
  },
  {
    name: 'ready_status_gate',
    label: 'Wait for Tier Full Boot',
    tooltip:
      'Wait for VM/containers to finish their boot process to report that they are READY and allow children tiers to spawn',
    type: TYPE_INPUT.CHECKBOX,
    validation: yup.boolean().default(false)
  }
];

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
);
