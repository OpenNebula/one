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
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import { reach } from 'yup'

import { SystemAPI, useGeneralApi } from '@FeaturesModule'
import { SCHEMA as CONTEXT_SCHEMA } from '@modules/resources/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/context/schema'

import { T } from '@ConstantsModule'
import { Accordion, AttributesPanel, Legend } from '@ComponentsV2Module'
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
    ({ key, path, value } = {}) => {
      const attributePath = path ?? key?.toUpperCase?.() ?? key
      if (!attributePath) return

      const contextPath = `${SECTION_ID}.${attributePath}`
      const formPath = [stepId, contextPath].filter(Boolean).join('.')

      try {
        // retrieve the schema for the given path
        reach(CONTEXT_SCHEMA(hypervisor), contextPath)
        enqueueError(T.ContextCustomVarErrorExists)
      } catch (e) {
        // When the path is not found, it means that
        // the attribute is correct and we can set it
        setValue(formPath, value)

        // Set as update if the newValue is not undefined and delete if the newValue is undefined
        // Set as delete
        setFieldPath('extra.Context')
        setModifiedFields({
          extra: {
            CONTEXT: {
              [attributePath]: value ? true : { __delete__: true },
            },
          },
        })
      }
    },
    [
      enqueueError,
      hypervisor,
      setFieldPath,
      setModifiedFields,
      setValue,
      stepId,
    ]
  )

  const handleDeleteAttribute = useCallback(
    (index, attribute) => {
      const attributePath =
        attribute?.path ?? attribute?.key ?? Object.keys(unknownVars)?.[index]
      if (!attributePath) return

      const contextPath = `${SECTION_ID}.${attributePath}`
      const formPath = [stepId, contextPath].filter(Boolean).join('.')

      setValue(formPath, undefined)
      setFieldPath('extra.Context')
      setModifiedFields({
        extra: {
          CONTEXT: {
            [attributePath]: { __delete__: true },
          },
        },
      })
    },
    [setFieldPath, setModifiedFields, setValue, stepId, unknownVars]
  )

  return (
    <Box display="grid" gap="1em">
      <Box sx={{ maxWidth: '100%', width: '100%', overflowX: 'auto' }}>
        <Accordion
          options={[
            {
              title: (
                <Legend
                  disableGutters
                  data-cy={'context-custom-vars'}
                  title={T.ContextCustomVariables}
                  tooltip={T.ContextCustomVariablesConcept}
                />
              ),
              description: (
                <AttributesPanel
                  actions={{ add: true, edit: true, delete: true, copy: true }}
                  handleAdd={handleChangeAttribute}
                  handleEdit={handleChangeAttribute}
                  handleDelete={handleDeleteAttribute}
                  attributes={unknownVars}
                  dataCy="context-custom-vars-attributes"
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
              ),
            },
          ]}
        />
      </Box>
    </Box>
  )
}

ContextVarsSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
}

export default ContextVarsSection
