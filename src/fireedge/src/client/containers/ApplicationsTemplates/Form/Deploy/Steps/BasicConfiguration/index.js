/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import { FORM_FIELDS, STEP_FORM_SCHEMA } from './schema'
import { T } from 'client/constants'

export const STEP_ID = 'application'

const BasicConfiguration = () => ({
  id: STEP_ID,
  label: T.ApplicationOverview,
  resolver: STEP_FORM_SCHEMA,
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => <FormWithSchema cy="form-flow" fields={FORM_FIELDS} id={STEP_ID} />,
    []
  ),
})

export default BasicConfiguration
