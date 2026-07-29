/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */

import { ResourceActionConfirmation } from '@ComponentsV2Module'
import { INPUT_TYPES, T } from '@ConstantsModule'
import { getValidationFromFields } from '@UtilsModule'
import PropTypes from 'prop-types'
import { number, object } from 'yup'

const optionalPositiveInteger = () =>
  number()
    .transform((value, originalValue) =>
      originalValue === '' || originalValue === null ? undefined : value
    )
    .integer()
    .positive()
    .notRequired()

const ROLE_ACTION_FIELDS = [
  {
    name: 'period',
    label: `${T.Period} (${T.Seconds})`,
    tooltip: 'Seconds between each group of actions.',
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    fieldProps: { min: 1, placeholder: 'Seconds between groups' },
    grid: { xs: 12, md: 12 },
    validation: optionalPositiveInteger(),
  },
  {
    name: 'number',
    label: T.NumberOfVms,
    tooltip: 'VMs to apply the action to each period.',
    type: INPUT_TYPES.TEXT,
    htmlType: 'number',
    fieldProps: { min: 1, placeholder: 'VMs per period' },
    grid: { xs: 12, md: 12 },
    validation: optionalPositiveInteger(),
  },
]

const ROLE_ACTION_SCHEMA = object(getValidationFromFields(ROLE_ACTION_FIELDS))

/**
 * @param {object[]} resources - Resources affected by the action
 * @returns {*} Confirmation content
 */
const getRoleActionDescription = (resources) => (
  <ResourceActionConfirmation
    description={T['resource.action.confirmation']}
    resources={resources}
    resourceType={T.Roles}
  />
)

const roleActionFormProps = {
  children: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
}

/**
 * @param {object[]} resources - Resources affected by the action
 * @returns {*} Form component for the modal host
 */
export const getRoleActionForm = (resources) => {
  const RoleActionForm = ({ children, onSubmit }) =>
    children({
      defaultValues: ROLE_ACTION_SCHEMA.default(),
      resolver: () => ROLE_ACTION_SCHEMA,
      description: getRoleActionDescription(resources),
      fields: ROLE_ACTION_FIELDS,
      onSubmit,
    })

  RoleActionForm.propTypes = roleActionFormProps
  RoleActionForm.displayName = 'RoleActionForm'

  return RoleActionForm
}

/**
 * @param {object} params - Submitted action params
 * @param {number} [params.period] - Seconds between each group of actions
 * @param {number} [params.number] - VMs to apply the action to each period
 * @returns {object} Params ready for the role action API
 */
export const getRoleActionParams = ({
  period,
  number: roleActionNumber,
  ...params
} = {}) => ({
  ...params,
  ...(period !== undefined && { period }),
  ...(roleActionNumber !== undefined && { number: roleActionNumber }),
})
