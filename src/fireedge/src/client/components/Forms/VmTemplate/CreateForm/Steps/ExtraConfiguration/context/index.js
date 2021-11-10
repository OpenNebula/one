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
import PropTypes from 'prop-types'
import { Folder as ContextIcon } from 'iconoir-react'

import { TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import ConfigurationSection, { SECTION_ID as CONFIGURATION_ID } from './configurationSection'
import UserInputsSection, { SECTION_ID as USER_INPUTS_ID } from './userInputsSection'

import { T } from 'client/constants'

export const TAB_ID = [CONFIGURATION_ID, USER_INPUTS_ID]

const Context = () => {
  return (
    <>
      <ConfigurationSection />
      <UserInputsSection />
    </>
  )
}

Context.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

/** @type {TabType} */
const TAB = {
  id: 'context',
  name: T.Context,
  icon: ContextIcon,
  Content: Context,
  getError: error => TAB_ID.some(id => error?.[id])
}

export default TAB
