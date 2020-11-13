import * as yup from 'yup'
import { v4 as uuidv4 } from 'uuid'
import { INPUT_TYPES } from 'client/constants'
import { getValidationFromFields } from 'client/utils/helpers'
import useOpennebula from 'client/hooks/useOpennebula'

const SELECT = {
  template: 'template',
  network: 'network'
}

const TYPES_NETWORKS = [
  { text: 'Create', value: 'template_id', select: SELECT.template },
  { text: 'Reserve', value: 'reserve_from', select: SELECT.network },
  { text: 'Existing', value: 'id', select: SELECT.network, extra: false }
]

const needExtraValue = type => TYPES_NETWORKS.some(
  ({ value, extra }) => value === type && extra === false
)

const isNetworkSelector = type => TYPES_NETWORKS.some(
  ({ value, select }) => value === type && select === SELECT.network
)

const ID = {
  name: 'id',
  label: 'ID',
  type: INPUT_TYPES.TEXT,
  htmlType: INPUT_TYPES.HIDDEN,
  validation: yup
    .string()
    .uuid()
    .required()
    .default(uuidv4)
}

const MANDATORY = {
  name: 'mandatory',
  label: 'Mandatory',
  type: INPUT_TYPES.CHECKBOX,
  validation: yup
    .boolean()
    .required('Mandatory field is required')
    .default(false),
  grid: { md: 12 }
}

const NAME = {
  name: 'name',
  label: 'Name',
  type: INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .matches(/^[\w+\s*]*$/g, { message: 'Invalid characters' })
    .required('Name field is required')
    .default('')
}

const DESCRIPTION = {
  name: 'description',
  label: 'Description',
  type: INPUT_TYPES.TEXT,
  multiline: true,
  validation: yup
    .string()
    .trim()
    .default('')
}

const TYPE = {
  name: 'type',
  label: 'Select a type',
  type: INPUT_TYPES.SELECT,
  values: TYPES_NETWORKS,
  validation: yup
    .string()
    .oneOf(TYPES_NETWORKS.map(({ value }) => value))
    .required('Type field is required')
    .default(TYPES_NETWORKS[0].value)
}

const ID_VNET = {
  name: 'idVnet',
  label: 'Select a network',
  type: INPUT_TYPES.AUTOCOMPLETE,
  dependOf: TYPE.name,
  values: dependValue => {
    const { vNetworks, vNetworksTemplates } = useOpennebula()

    const values = isNetworkSelector(dependValue) ? vNetworks : vNetworksTemplates

    return values
      .map(({ ID: value, NAME: text }) => ({ text, value }))
      .sort((a, b) => a.value - b.value)
  },
  validation: yup
    .string()
    .trim()
    .when(TYPE.name, (type, schema) =>
      isNetworkSelector(type)
        ? schema.required('Network field is required')
        : schema.required('Network template field is required')
    )
    .default(undefined)
}

const EXTRA = {
  name: 'extra',
  label: 'Extra',
  multiline: true,
  type: INPUT_TYPES.TEXT,
  dependOf: TYPE.name,
  htmlType: dependValue => needExtraValue(dependValue) ? INPUT_TYPES.HIDDEN : INPUT_TYPES.TEXT,
  validation: yup
    .string()
    .trim()
    .when(TYPE.name, (type, schema) => needExtraValue(type) ? schema.strip() : schema)
    .default('')
}

export const FORM_FIELDS = [
  ID,
  MANDATORY,
  NAME,
  DESCRIPTION,
  TYPE,
  ID_VNET,
  EXTRA
]

export const NETWORK_FORM_SCHEMA = yup.object(
  getValidationFromFields(FORM_FIELDS)
)

export const STEP_FORM_SCHEMA = yup
  .array(NETWORK_FORM_SCHEMA)
  .default([])
