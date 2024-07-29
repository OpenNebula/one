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
import { ReactElement, useMemo } from 'react'
import PropTypes from 'prop-types'

import { FormWithSchema } from 'client/components/Forms'

import { FILES_FIELDS } from './schema'
import { T } from 'client/constants'

import { disableFields } from 'client/utils'

export const SECTION_ID = 'CONTEXT'

/**
 * @param {object} props - Props
 * @param {string} [props.stepId] - ID of the step the section belongs to
 * @param {string} props.hypervisor - VM hypervisor
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @returns {ReactElement} - Files section
 */
const FilesSection = ({ stepId, hypervisor, oneConfig, adminGroup }) => (
  <FormWithSchema
    accordion
    legend={T.Files}
    id={stepId}
    cy={useMemo(
      () => [stepId, 'context-files'].filter(Boolean).join('-'),
      [stepId]
    )}
    fields={useMemo(
      () =>
        disableFields(
          FILES_FIELDS(hypervisor),
          'CONTEXT',
          oneConfig,
          adminGroup
        ),
      [hypervisor]
    )}
    saveState={true}
  />
)

FilesSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default FilesSection
