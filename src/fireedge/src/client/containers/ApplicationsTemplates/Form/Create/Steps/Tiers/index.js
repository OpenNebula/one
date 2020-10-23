import React, {
  useEffect,
  useState,
  useCallback,
  createContext,
  useMemo
} from 'react'

import * as yup from 'yup'
import { useWatch } from 'react-hook-form'

import { ReactFlowProvider } from 'react-flow-renderer'
import { Box } from '@material-ui/core'

import useListForm from 'client/hooks/useListForm'
import FormStepper from 'client/components/FormStepper'
import { DialogForm } from 'client/components/Dialogs'
import { STEP_ID as NETWORKING_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Networking'
import { STEP_ID as NETWORKS_ID } from 'client/containers/ApplicationsTemplates/Form/Create/Steps/Tiers/Steps/Networks'

import Steps from './Steps'
import Flow from './Flow'

export const Context = createContext({})
export const STEP_ID = 'tiers'

const Tiers = () => {
  const { steps, defaultValues, resolvers } = Steps()

  return {
    id: STEP_ID,
    label: 'Tier Definition',
    resolver: yup
      .array(resolvers)
      .min(1, 'Should be at least one tier')
      .required('Tiers field is required')
      .default([]),
    content: useCallback(({ data, setFormData }) => {
      const [showDialog, setShowDialog] = useState(false)
      const [nestedForm, setNestedForm] = useState({})
      const form = useWatch({})

      const {
        editingData,
        handleSetList,
        handleSave,
        handleEdit
      } = useListForm({
        key: STEP_ID,
        list: data,
        setList: setFormData,
        defaultValue: defaultValues()
      })

      const handleEditTier = id => {
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
                dataFields={Object.keys(resolvers.fields)}
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
                title={'Tier form'}
                resolver={resolvers}
                values={editingData}
                onCancel={() => setShowDialog(false)}
              >
                <Box display="flex" flexDirection="column" height={1}>
                  <FormStepper
                    steps={formSteps}
                    schema={resolvers}
                    onSubmit={values => {
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
    }, [])
  }
}

export default Tiers
