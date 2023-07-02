/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import { array, object } from 'yup'

import RulesSection from './rulesSection'

import { SCHEMA } from 'client/components/Forms/SecurityGroups/CreateForm/Steps/Rules/schema'
import { T } from 'client/constants'

export const STEP_ID = 'rules'

const Content = () => <RulesSection stepId={STEP_ID} />

/**
 * Rules configuration about Security Groups.
 *
 * @returns {object} Rules configuration step
 */
const Rules = () => ({
  id: STEP_ID,
  label: T.Rules,
  resolver: object({
    RULES: array(SCHEMA),
  }),
  optionsValidate: { abortEarly: false },
  content: Content,
})

export default Rules
