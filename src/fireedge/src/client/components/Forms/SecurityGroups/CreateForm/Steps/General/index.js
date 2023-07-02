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

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import {
  SCHEMA,
  FIELDS,
} from 'client/components/Forms/SecurityGroups/CreateForm/Steps/General/schema'
import { T } from 'client/constants'

export const STEP_ID = 'general'

const Content = () => (
  <FormWithSchema id={STEP_ID} fields={FIELDS} cy={`${STEP_ID}`} />
)

/**
 * General configuration about Security Groups.
 *
 * @param {object} securityGroupData - security group data
 * @returns {object} Security Groups configuration step
 */
const General = (securityGroupData = {}) => {
  const isUpdate = securityGroupData?.NAME

  return {
    id: STEP_ID,
    label: T.Configuration,
    resolver: (formdata) => SCHEMA(isUpdate),
    optionsValidate: { abortEarly: false },
    content: () => Content(securityGroupData),
  }
}

export default General
