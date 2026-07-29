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
import { useMemo } from 'react'

import { FormWithSchema } from '@ComponentsV2Module'

import {
  SCHEMA,
  SECTIONS,
} from '@modules/resources/resources/VirtualNetwork/Forms/CreateForm/Steps/General/schema'
import { T } from '@ConstantsModule'

export const STEP_ID = 'general'

/**
 * @param {object} root0 - Props
 * @param {boolean} root0.isUpdate - True if it is an update operation
 * @param {object} root0.oneConfig - Open Nebula configuration
 * @param {boolean} root0.adminGroup - If the user belongs to oneadmin group
 * @returns {object} Form content component
 */
const Content = ({ isUpdate, oneConfig, adminGroup }) => {
  const sections = useMemo(
    () => SECTIONS(isUpdate, oneConfig, adminGroup),
    [adminGroup, isUpdate, oneConfig]
  )

  return (
    <>
      {sections.map(({ id, ...section }) => (
        <FormWithSchema
          key={id}
          id={STEP_ID}
          cy={`${STEP_ID}-${id}`}
          {...section}
        />
      ))}
    </>
  )
}

/**
 * General configuration about Virtual network.
 *
 * @param {object} root0 - Props
 * @param {object} root0.data - Virtual network
 * @param {object} root0.oneConfig - Open Nebula configuration
 * @param {boolean} root0.adminGroup - If the user belongs to oneadmin group
 * @returns {object} General configuration step
 */
const General = ({ data, oneConfig, adminGroup }) => {
  const isUpdate = data?.NAME !== undefined

  return {
    id: STEP_ID,
    label: T.General,
    resolver: () => SCHEMA(isUpdate, oneConfig, adminGroup),
    optionsValidate: { abortEarly: false },
    content: () => (
      <Content
        isUpdate={isUpdate}
        oneConfig={oneConfig}
        adminGroup={adminGroup}
      />
    ),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default General
