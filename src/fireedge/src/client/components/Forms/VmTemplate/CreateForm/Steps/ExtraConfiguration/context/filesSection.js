/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { FormWithSchema } from 'client/components/Forms'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { FILES_FIELDS } from './schema'
import { T } from 'client/constants'

export const SECTION_ID = 'CONTEXT'

/**
 * @param {object} props - Props
 * @param {string} props.hypervisor - VM hypervisor
 * @returns {JSXElementConstructor} - Files section
 */
const FilesSection = ({ hypervisor }) => (
  <FormWithSchema
    accordion
    cy={`${EXTRA_ID}-context-files`}
    legend={T.Files}
    fields={() => FILES_FIELDS(hypervisor)}
    id={EXTRA_ID}
  />
)

FilesSection.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

export default FilesSection
