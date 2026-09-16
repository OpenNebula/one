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
import { object } from 'yup'

import { FormWithSchema } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { Step, getValidationFromFields } from '@UtilsModule'
import { FIELDS } from '@modules/resources/SecurityGroups/Forms/ChangeForm/schema'

export const STEP_ID = 'security-groups'

const fields = FIELDS().map((field) => ({
  ...field,
  name: 'SECURITY_GROUPS',
  validation: field.validation.default(() => []),
}))

const Content = () => (
  <FormWithSchema id={STEP_ID} cy={STEP_ID} fields={fields} saveState />
)

/**
 * @param {object} props - NIC form props
 * @returns {Step} Security groups step
 */
const SecurityGroups = (props) => ({
  id: STEP_ID,
  label: T.SecurityGroups,
  resolver: object(getValidationFromFields(fields)),
  content: Content,
  defaultDisabled: {
    condition: () =>
      props?.defaultData?.NETWORK_MODE?.toLowerCase?.() === 'dummy',
  },
})

export default SecurityGroups
