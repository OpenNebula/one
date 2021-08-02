/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
/* eslint-disable jsdoc/require-jsdoc */
import React, { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import {
  SCHEMA,
  FIELDS
} from 'client/components/Forms/Vm/AttachNicForm/Steps/AdvancedOptions/schema'
import { T } from 'client/constants'

export const STEP_ID = 'advanced'

const AdvancedOptions = ({ nics = [] } = {}) => ({
  id: STEP_ID,
  label: T.AdvancedOptions,
  resolver: () => SCHEMA(nics),
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => (
      <FormWithSchema
        cy='attach-nic-advanced'
        id={STEP_ID}
        fields={FIELDS(nics)}
      />
    ),
    [nics?.length, nics?.[0]?.ID]
  )
})

export default AdvancedOptions
