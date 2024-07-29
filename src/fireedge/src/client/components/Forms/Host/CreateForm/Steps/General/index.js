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
import { useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import PropTypes from 'prop-types'

import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { Step } from 'client/utils'
import { T, CUSTOM_HOST_HYPERVISOR } from 'client/constants'

import {
  SCHEMA,
  INFORMATION_FIELD,
  DRIVERS_FIELDS,
  HYPERVISOR_FIELD,
} from 'client/components/Forms/Host/CreateForm/Steps/General/schema'

export const STEP_ID = 'general'

const Content = () => {
  const hypervisor = useWatch({ name: `${STEP_ID}.vmmMad` })
  const driversFields = useMemo(
    () => hypervisor === CUSTOM_HOST_HYPERVISOR.NAME && DRIVERS_FIELDS,
    [hypervisor]
  )

  return (
    <>
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}-hypervisor`}
        legend={T.Hypervisor}
        fields={[HYPERVISOR_FIELD]}
      />
      <FormWithSchema
        id={STEP_ID}
        cy={`${STEP_ID}-information`}
        legend={T.Information}
        fields={[INFORMATION_FIELD]}
      />
      {driversFields && (
        <FormWithSchema
          id={STEP_ID}
          cy={`${STEP_ID}-drivers`}
          legend={T.Drivers}
          fields={driversFields}
        />
      )}
    </>
  )
}

/**
 * Step to input the Host General information.
 *
 * @returns {Step} General information step
 */
const General = () => ({
  id: STEP_ID,
  label: T.General,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: Content,
})

General.propTypes = {
  data: PropTypes.object,
  setFormData: PropTypes.func,
}

export default General
