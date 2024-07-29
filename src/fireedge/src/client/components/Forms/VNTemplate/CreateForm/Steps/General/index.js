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
import PropTypes from 'prop-types'
import { ReactElement, useMemo } from 'react'

import FormWithSchema from 'client/components/Forms/FormWithSchema'

import {
  SCHEMA,
  SECTIONS,
} from 'client/components/Forms/VNTemplate/CreateForm/Steps/General/schema'

import { T, VirtualNetwork } from 'client/constants'

export const STEP_ID = 'general'

/**
 * @param {boolean} isUpdate - True if it is an update operation
 * @param {object} oneConfig - Open Nebula configuration
 * @param {boolean} adminGroup - If the user belongs to oneadmin group
 * @returns {ReactElement} Form content component
 */
const Content = (isUpdate, oneConfig, adminGroup) => {
  const sections = useMemo(() => SECTIONS(isUpdate, oneConfig, adminGroup))

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
 * @param {VirtualNetwork} data - Virtual network
 * @returns {object} General configuration step
 */
const General = ({ data, oneConfig, adminGroup }) => {
  const isUpdate = data?.NAME !== undefined

  return {
    id: STEP_ID,
    label: T.General,
    resolver: () => SCHEMA(isUpdate, oneConfig, adminGroup),
    optionsValidate: { abortEarly: false },
    content: () => Content(isUpdate, oneConfig, adminGroup),
  }
}

Content.propTypes = {
  isUpdate: PropTypes.bool,
}

export default General
