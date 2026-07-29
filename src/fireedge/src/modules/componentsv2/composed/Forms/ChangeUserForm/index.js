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
import PropTypes from 'prop-types'
import { useCallback, useMemo } from 'react'

import { createForm } from '@UtilsModule'
import {
  SCHEMA,
  FIELDS,
} from '@modules/componentsv2/composed/Forms/ChangeUserForm/schema'

const ChangeUserFormConfig = createForm(SCHEMA, FIELDS)

/**
 * Renders the change owner form config inside a modal form host.
 *
 * @param {object} root0 - Form props
 * @param {object} root0.initialValues - Initial form values
 * @param {object} root0.stepProps - Extra form props
 * @param {Function} root0.onSubmit - Submit handler
 * @param {Function} root0.children - Render callback
 * @returns {*} Change user form
 */
export const ChangeUserForm = ({
  initialValues,
  stepProps,
  onSubmit,
  children,
}) => {
  const { transformBeforeSubmit, ...formConfig } = useMemo(
    () => ChangeUserFormConfig(stepProps, initialValues),
    [initialValues, stepProps]
  )

  const handleSubmit = useCallback(
    (data) => {
      const processedData =
        transformBeforeSubmit?.(data, initialValues, stepProps) ?? data

      return onSubmit?.(processedData)
    },
    [initialValues, onSubmit, stepProps, transformBeforeSubmit]
  )

  return children?.({ ...formConfig, onSubmit: handleSubmit }) ?? null
}

ChangeUserForm.propTypes = {
  initialValues: PropTypes.object,
  stepProps: PropTypes.object,
  onSubmit: PropTypes.func,
  children: PropTypes.func,
}

/**
 * Returns a modal-ready ChangeUserForm component.
 *
 * @param {object} configProps - Form configuration props
 * @returns {Function} Wrapped form component
 */
export const getChangeUserForm = (configProps = {}) => {
  /**
   * @param {object} rootProps - Modal form props
   * @returns {*} Wrapped change user form
   */
  const WrappedChangeUserForm = (rootProps) => (
    <ChangeUserForm {...configProps} {...rootProps} />
  )

  WrappedChangeUserForm.displayName = 'ChangeUserForm'

  return WrappedChangeUserForm
}

export { SCHEMA, FIELDS }

export default ChangeUserFormConfig
