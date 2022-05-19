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
import { ReactElement, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { reach } from 'yup'
import { useFormContext, useWatch } from 'react-hook-form'
import { Accordion, AccordionSummary, Box } from '@mui/material'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { SCHEMA as CONTEXT_SCHEMA } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/schema'

import { useGeneralApi } from 'client/features/General'

import { Legend } from 'client/components/Forms'
import { AttributePanel } from 'client/components/Tabs/Common'
import { getUnknownAttributes } from 'client/utils'
import { T } from 'client/constants'

export const SECTION_ID = 'CONTEXT'

/**
 * Renders the context section of the extra configuration form.
 *
 * @param {object} props - Props passed to the component
 * @param {string} props.hypervisor - VM hypervisor
 * @returns {ReactElement} - Context vars section
 */
const ContextVarsSection = ({ hypervisor }) => {
  const { enqueueError } = useGeneralApi()
  const { setValue } = useFormContext()
  const customVars = useWatch({ name: `${EXTRA_ID}.${SECTION_ID}` })

  const unknownVars = useMemo(() => {
    const knownVars = CONTEXT_SCHEMA(hypervisor).cast(
      { [SECTION_ID]: customVars },
      { stripUnknown: true }
    )

    const currentContext = knownVars?.[SECTION_ID] || {}

    return getUnknownAttributes(customVars, currentContext)
  }, [customVars])

  const handleChangeAttribute = useCallback(
    (path, newValue) => {
      const contextPath = `${SECTION_ID}.${path}`
      const formPath = `${EXTRA_ID}.${contextPath}`

      try {
        // retrieve the schema for the given path
        reach(CONTEXT_SCHEMA(hypervisor), contextPath)
        enqueueError(T.ContextCustomVarErrorExists)
      } catch (e) {
        // When the path is not found, it means that
        // the attribute is correct and we can set it
        setValue(formPath, newValue)
      }
    },
    [hypervisor]
  )

  return (
    <Box display="grid" gap="1em">
      <Accordion
        variant="transparent"
        TransitionProps={{ unmountOnExit: false }}
      >
        <AccordionSummary>
          <Legend
            disableGutters
            data-cy={'context-custom-vars'}
            title={T.ContextCustomVariables}
            tooltip={T.ContextCustomVariablesConcept}
          />
        </AccordionSummary>
        <AttributePanel
          allActionsEnabled
          handleAdd={handleChangeAttribute}
          handleEdit={handleChangeAttribute}
          handleDelete={handleChangeAttribute}
          attributes={unknownVars}
          filtersSpecialAttributes={false}
        />
      </Accordion>
    </Box>
  )
}

ContextVarsSection.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
}

export default ContextVarsSection
