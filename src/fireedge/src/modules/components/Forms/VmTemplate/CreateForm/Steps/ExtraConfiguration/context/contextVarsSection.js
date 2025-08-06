/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Accordion, AccordionSummary, Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { reach } from 'yup'

import { SystemAPI, useGeneralApi } from '@FeaturesModule'
import { SCHEMA as CONTEXT_SCHEMA } from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/context/schema'

import { T } from '@ConstantsModule'
import { Legend } from '@modules/components/Forms'
import { AttributePanel } from '@modules/components/Tabs/Common'
import { getUnknownAttributes } from '@UtilsModule'

export const SECTION_ID = 'CONTEXT'

/**
 * Renders the context section to VM Template form.
 *
 * @param {object} props - Props passed to the component
 * @param {string} [props.stepId] - ID of the step the section belongs to
 * @param {string} props.hypervisor - VM hypervisor
 * @returns {ReactElement} - Context vars section
 */
const ContextVarsSection = ({ stepId, hypervisor }) => {
  const { enqueueError, setModifiedFields, setFieldPath } = useGeneralApi()
  const { data: oneConfig = {} } = SystemAPI.useGetOneConfigQuery()
  const { setValue } = useFormContext()

  const customVars = useWatch({
    name: [stepId, SECTION_ID].filter(Boolean).join('.'),
  })

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
      const formPath = [stepId, contextPath].filter(Boolean).join('.')

      try {
        // retrieve the schema for the given path
        reach(CONTEXT_SCHEMA(hypervisor), contextPath)
        enqueueError(T.ContextCustomVarErrorExists)
      } catch (e) {
        // When the path is not found, it means that
        // the attribute is correct and we can set it
        setValue(formPath, newValue)

        // Set as update if the newValue is not undefined and delete if the newValue is undefined
        // Set as delete
        setFieldPath('extra.Context')
        setModifiedFields({
          extra: {
            CONTEXT: {
              [path]: newValue ? true : { __delete__: true },
            },
          },
        })
      }
    },
    [hypervisor]
  )

  return (
    <Box display="grid" gap="1em">
      <Box sx={{ maxWidth: '100%', width: '100%', overflowX: 'auto' }}>
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
            enableEdit={(name = '') => {
              const regex = /^eth\d*(?:_[A-Za-z0-9]+)+$/i
              if (regex.test(name)) {
                return (
                  (oneConfig?.CONTEXT_ALLOW_ETH_UPDATES.toUpperCase?.() ??
                    '') === 'YES'
                )
              }

              return true
            }}
          />
        </Accordion>
      </Box>
    </Box>
  )
}

ContextVarsSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
}

export default ContextVarsSection
