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
import { useCallback } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { T } from 'client/constants'

import {
  FORM_FIELDS, STEP_FORM_SCHEMA
} from 'client/components/Forms/Provider/CreateForm/Steps/BasicConfiguration/schema'

export const STEP_ID = 'configuration'

const BasicConfiguration = ({ isUpdate }) => ({
  id: STEP_ID,
  label: T.ProviderOverview,
  resolver: () => STEP_FORM_SCHEMA({ isUpdate }),
  optionsValidate: { abortEarly: false },
  content: useCallback(
    () => <FormWithSchema cy="form-provider" fields={FORM_FIELDS({ isUpdate })} id={STEP_ID} />,
    []
  )
})

export default BasicConfiguration
