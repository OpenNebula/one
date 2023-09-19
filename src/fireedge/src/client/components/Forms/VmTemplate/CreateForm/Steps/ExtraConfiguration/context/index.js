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
import PropTypes from 'prop-types'
import { Folder as ContextIcon } from 'iconoir-react'

import {
  TabType,
  STEP_ID as EXTRA_ID,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import UserInputsSection, {
  SECTION_ID as USER_INPUTS_ID,
} from './userInputsSection'
import ConfigurationSection from './configurationSection'
import FilesSection from './filesSection'
import ContextVarsSection from './contextVarsSection'

import { T } from 'client/constants'

export const TAB_ID = ['CONTEXT', USER_INPUTS_ID]

const Context = (props) => (
  <>
    <ConfigurationSection stepId={EXTRA_ID} {...props} />
    <UserInputsSection {...props} />
    <FilesSection stepId={EXTRA_ID} {...props} />
    <ContextVarsSection stepId={EXTRA_ID} />
  </>
)

Context.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

/** @type {TabType} */
const TAB = {
  id: 'context',
  name: T.Context,
  icon: ContextIcon,
  Content: Context,
  getError: (error) => TAB_ID.some((id) => error?.[id]),
}

export default TAB
