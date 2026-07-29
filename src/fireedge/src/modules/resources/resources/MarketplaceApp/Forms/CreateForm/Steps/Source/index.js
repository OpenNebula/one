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
import { useMemo } from 'react'
import PropTypes from 'prop-types'
import { useWatch } from 'react-hook-form'

import { FormWithSchema } from '@ComponentsV2Module'
import { Step } from '@UtilsModule'
import { T } from '@ConstantsModule'

import { TYPES, FIELDS, TEMPLATE_FIELDS, SCHEMA } from './schema'

export const STEP_ID = 'source'

const Content = () => {
  const type = useWatch({ name: `${STEP_ID}.type` })
  const imageFields = useMemo(
    () => TYPES.IMAGE === type && TEMPLATE_FIELDS,
    [type]
  )

  return (
    <>
      <FormWithSchema cy={STEP_ID} fields={FIELDS} id={STEP_ID} />
      {imageFields && (
        <FormWithSchema
          cy={`${STEP_ID}-template`}
          fields={imageFields}
          legend={T.TemplatesForTheApp}
          legendTooltip={T.TemplatesForTheAppConcept}
          id={STEP_ID}
        />
      )}
    </>
  )
}

/**
 * Step to select the marketplace app source.
 *
 * @returns {Step} Source step
 */
const SourceStep = () => ({
  id: STEP_ID,
  label: T.Source,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

Content.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
}

export default SourceStep
