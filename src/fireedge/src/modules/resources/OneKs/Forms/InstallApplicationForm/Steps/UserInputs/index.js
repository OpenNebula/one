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
import { useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import { FormWithSchema } from '@ComponentsModule'
import { T } from '@ConstantsModule'
import { STEP_ID as APPLICATION_ID } from '@modules/resources/OneKs/Forms/InstallApplicationForm/Steps/Application'
import { FIELDS, SCHEMA } from './schema'

export const STEP_ID = 'user_inputs'

const Content = () => {
  const { control } = useFormContext()
  const application = useWatch({
    control,
    name: `${APPLICATION_ID}.DEFINITION`,
  })
  const fields = useMemo(() => FIELDS(application), [application])

  return (
    <FormWithSchema
      cy="oneks-application-user-inputs"
      id={STEP_ID}
      fields={fields}
    />
  )
}

/**
 * @returns {object} Dynamic application user-input step
 */
const UserInputs = () => ({
  id: STEP_ID,
  label: T.UserInputs,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  defaultDisabled: { condition: () => true },
  content: Content,
})

export default UserInputs
