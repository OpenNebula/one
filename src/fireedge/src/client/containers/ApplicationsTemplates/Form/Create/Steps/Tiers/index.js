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
/* eslint-disable jsdoc/require-jsdoc */
import { useEffect, useState, useCallback, createContext, useMemo } from 'react'

import * as yup from 'yup'
import { useWatch } from 'react-hook-form'

import { ReactFlowProvider } from 'react-flow-renderer'
import { Box } from '@mui/material'

import { useListForm } from 'client/hooks'
import FormStepper from 'client/components/FormStepper'
import { DialogForm } from 'client/components/Dialogs'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { STEP_ID as NETWORKS_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers/Steps/Networks'
import { T } from 'client/constants'

import Steps from './Steps'
import Flow from './Flow'

export const Context = createContext({})
export const STEP_ID = 'tiers'

const Tiers = () => {
  const { steps, defaultValues, resolvers } = Steps()

  return {
    id: STEP_ID,
    label: T.TierDefinition,
    resolver: yup
      .array(resolvers())
      .min(1, 'Should be at least one tier')
      .required('Tiers field is required')
      .default([]),
    content: useCallback(({ data, setFormData }) => {
      const [showDialog, setShowDialog] = useState(false)
      const [nestedForm, setNestedForm] = useState({})
      const form = useWatch({})

      const { editingData, handleSetList, handleSave, handleEdit } =
        useListForm({
          key: STEP_ID,
          list: data,
          setList: setFormData,
          defaultValue: defaultValues,
        })

      const handleEditTier = (id) => {
        handleEdit(id)
        setShowDialog(true)
      }

      useEffect(() => {
        setNestedForm(form)
      }, [])

      const formSteps = useMemo(() => {
        const networking = nestedForm[NETWORKING_ID] ?? []

        return steps.filter(
          ({ id }) => id !== NETWORKS_ID || networking.length !== 0
        )
      }, [nestedForm])

      return (
        <>
          <ReactFlowProvider>
            <Box height={1} flexGrow={1}>
              <Flow
                dataFields={Object.keys(resolvers().fields)}
                handleCreate={() => handleEditTier()}
                handleEdit={handleEditTier}
                handleSetData={handleSetList}
              />
            </Box>
          </ReactFlowProvider>
          {showDialog && (
            <Context.Provider value={{ nestedForm }}>
              <DialogForm
                open={showDialog}
                title={`${T.Tiers} form`}
                resolver={resolvers}
                values={editingData}
                onCancel={() => setShowDialog(false)}
              >
                <Box display="flex" flexDirection="column" height={1}>
                  <FormStepper
                    steps={formSteps}
                    schema={resolvers}
                    onSubmit={(values) => {
                      handleSave(values)
                      setShowDialog(false)
                    }}
                  />
                </Box>
              </DialogForm>
            </Context.Provider>
          )}
        </>
      )
    }, []),
  }
}

export default Tiers
