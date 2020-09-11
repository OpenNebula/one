import * as yup from 'yup';
import { TYPE_INPUT } from 'client/constants';
import { getValidationFromFields } from 'client/utils/helpers';

const DEFAULT_NETWORK = {
  mandatory: true,
  name: 'Public_dev',
  description: 'Public network in development mode',
  type: 'id',
  id: '0',
  extra: 'size=5'
};

export const SELECT = {
  template: 'template',
  network: 'network'
};

export const TYPES_NETWORKS = [
  { text: 'Create', value: 'template_id', select: SELECT.template },
  { text: 'Reserve', value: 'reserve_from', select: SELECT.network },
  { text: 'Existing', value: 'id', select: SELECT.network }
];

export const FORM_FIELDS = [
  {
    name: 'mandatory',
    label: 'Mandatory',
    type: TYPE_INPUT.CHECKBOX,
    validation: yup
      .boolean()
      .required()
      .default(false)
  },
  {
    name: 'name',
    label: 'Name',
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .trim()
      .required('Name is a required field')
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
    name: 'type',
    label: 'Select a type',
    type: TYPE_INPUT.SELECT,
    values: TYPES_NETWORKS,
    validation: yup
      .string()
      .oneOf(TYPES_NETWORKS.map(({ value }) => value))
      .required('Type is required field')
      .default(TYPES_NETWORKS[0].value)
  },
  {
    name: 'id',
    label: `Select a network`,
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .when('type', {
        is: type =>
          TYPES_NETWORKS.some(
            ({ value, select }) => type === value && select === SELECT.network
          ),
        then: yup
          .string()
          .trim()
          .required('Network is required field'),
        otherwise: yup
          .string()
          .trim()
          .required('Network template is required field')
      })
      .required()
      .default('')
  },
  {
    name: 'extra',
    label: 'Extra',
    multiline: true,
    type: TYPE_INPUT.TEXT,
    validation: yup
      .string()
      .trim()
      .default('')
  }
];

export const NETWORK_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
);

export const STEP_FORM_SCHEMA = yup
  .array()
  .of(NETWORK_FORM_SCHEMA)
  .min(2)
  .required()
  .default([DEFAULT_NETWORK, DEFAULT_NETWORK]);
