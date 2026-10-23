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

import { FormWithSchema } from '@ComponentsModule'
import {
  SCHEMA,
  SECTIONS,
} from '@modules/resources/VnTemplate/Forms/InstantiateForm/Steps/General/schema'
import { T } from '@ConstantsModule'

export const STEP_ID = 'general'

const Content = ({ vnTemplate, oneConfig, adminGroup }) => {
  const sections = useMemo(
    () => SECTIONS(vnTemplate, oneConfig, adminGroup),
    [vnTemplate, oneConfig, adminGroup]
  )

  return (
    <>
      {sections.map(({ id, ...section }) => (
        <FormWithSchema
          key={id}
          id={STEP_ID}
          cy={`${STEP_ID}-${id}`}
          {...section}
          {...(!adminGroup && {
            columns: [section.fields],
            rootProps: {
              sx: {
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
                columnGap: (theme) => `${theme.scale[600]}px`,
                '& > *': {
                  gridColumn: { xs: '1', md: '2' },
                },
              },
            },
          })}
        />
      ))}
    </>
  )
}

Content.propTypes = {
  vnTemplate: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/**
 * Basic configuration about VN Template.
 *
 * @param {object} root0 - Props
 * @param {object} root0.data - VN Template
 * @param {object} root0.oneConfig - Open Nebula configuration
 * @param {boolean} root0.adminGroup - If the user belongs to oneadmin group
 * @returns {object} Basic configuration step
 */
const General = ({ data: vnTemplate, oneConfig, adminGroup }) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(vnTemplate, oneConfig, adminGroup),
  optionsValidate: { abortEarly: false },
  content: () => (
    <Content
      vnTemplate={vnTemplate}
      oneConfig={oneConfig}
      adminGroup={adminGroup}
    />
  ),
})

General.propTypes = {
  data: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

export default General
