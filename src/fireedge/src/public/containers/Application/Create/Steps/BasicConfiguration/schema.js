import * as yup from 'yup';
import { TYPE_INPUT } from 'client/constants';
import { getValidationFromFields } from 'client/utils/helpers';

export const STRATEGIES_DEPLOY = [
  { text: 'None', value: 'none' },
  { text: 'Straight', value: 'straight' }
];

export const SHUTDOWN_ACTIONS = [
  { text: 'None', value: 'none' },
  { text: 'Terminate', value: 'shutdown' },
  { text: 'Terminate hard', value: 'shutdown-hard' }
];

export const FORM_FIELDS = [
  {
    name: 'name',
    label: 'Name',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .min(5)
      .trim()
      .required('Name field is required')
      .default('One_service')
  },
  {
    name: 'description',
    label: 'Description',
    type: TYPE_INPUT.TEXT,
    multiline: true,
    validation: yup
      .string()
      .trim()
      .default('OpenNebula is so cool!')
  },
  {
    name: 'deployment',
    label: 'Select a strategy',
    type: TYPE_INPUT.SELECT,
    values: STRATEGIES_DEPLOY,
    validation: yup
      .string()
      .required()
      .oneOf(STRATEGIES_DEPLOY.map(({ value }) => value))
      .default(STRATEGIES_DEPLOY[0].value)
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
    label:
      'Wait for VMs to report that they are READY via OneGate to consider them running',
    type: TYPE_INPUT.CHECKBOX,
    validation: yup.boolean().default(false)
  }
];

export const STEP_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
);
