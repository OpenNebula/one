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
} from '@modules/resources/resources/VnTemplate/Forms/InstantiateForm/Steps/General/schema'
import { T } from '@ConstantsModule'

export const STEP_ID = 'general'

const Content = ({ vnTemplate }) => {
  const sections = useMemo(() => SECTIONS(vnTemplate), [vnTemplate])

  return (
    <>
      {sections.map(({ fields, id, ...section }) => (
        <FormWithSchema
          key={id}
          id={STEP_ID}
          cy={`${STEP_ID}-${id}`}
          fields={fields}
          columns={[[], fields, []]}
          gridContainerSx={{
            gridTemplateColumns: { xs: '1fr', md: '1fr 2fr 1fr' },
          }}
          {...section}
        />
      ))}
    </>
  )
}

Content.propTypes = {
  vnTemplate: PropTypes.object,
}

/**
 * Basic configuration about VN Template.
 *
 * @param {object} root0 - Props
 * @param {object} root0.data - VN Template
 * @returns {object} Basic configuration step
 */
const General = ({ data: vnTemplate }) => ({
  id: STEP_ID,
  label: T.Configuration,
  resolver: () => SCHEMA(vnTemplate),
  optionsValidate: { abortEarly: false },
  content: () => <Content vnTemplate={vnTemplate} />,
})

General.propTypes = {
  data: PropTypes.object,
}

export default General
