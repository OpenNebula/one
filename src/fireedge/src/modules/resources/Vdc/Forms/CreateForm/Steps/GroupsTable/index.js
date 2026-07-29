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

import { FormWithSchema } from '@ComponentsV2Module'
import { FIELDS, SCHEMA } from './schema'

import { T } from '@ConstantsModule'
import { Step } from '@UtilsModule'

export const STEP_ID = 'groups'

const Content = () => <FormWithSchema cy={STEP_ID} fields={FIELDS} />

/**
 * Step to select the Group.
 *
 * @param {object} app - VDC App resource
 * @returns {Step} Group step
 */
const GroupsStep = (app) => ({
  id: STEP_ID,
  label: T.SelectGroup,
  resolver: SCHEMA,
  content: (props) => Content({ ...props, app }),
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  app: PropTypes.object,
}

export default GroupsStep
