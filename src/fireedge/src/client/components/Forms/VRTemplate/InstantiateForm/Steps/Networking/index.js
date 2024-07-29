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
import FormWithSchema from 'client/components/Forms/FormWithSchema'
import { v4 as uuidv4 } from 'uuid'
import {
  FIELDS,
  SCHEMA,
} from 'client/components/Forms/VRTemplate/InstantiateForm/Steps/Networking/NicMenu/informationSchema'
import { T } from 'client/constants'
import { Tr } from 'client/components/HOC'
import { Box, Typography } from '@mui/material'
import { useState, useMemo } from 'react'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'
import Canvas from 'client/components/Forms/VRTemplate/InstantiateForm/Steps/UserInputs/Node/Canvas'
import NicColumn from 'client/components/Forms/VRTemplate/InstantiateForm/Steps/Networking/NicMenu/NicColumn'

export const STEP_ID = 'networking'
const Content = () => {
  const [activeNic, setActiveNic] = useState(0)
  const { control } = useFormContext()

  const defaultFields = {
    ...control._defaultValues?.[STEP_ID],
    nicId: uuidv4(),
  }

  const {
    fields: nics = [],
    append,
    remove,
  } = useFieldArray({
    name: `${STEP_ID}.NIC`,
  })

  const watchedNicsArray = useWatch({
    control,
    name: `${STEP_ID}.NIC`,
  })

  const handleAddnewNic = () => {
    append(defaultFields)
    setActiveNic(nics.length)
  }

  const handleSelectNic = (nId) => {
    const nicIndex = nics?.findIndex((nic) => nic?.nicId === nId)
    setActiveNic(nicIndex)
  }

  const handleDeleteNic = (nId) => {
    const nicIndex = nics?.findIndex((nic) => nic?.nicId === nId)
    if (nicIndex !== -1) {
      remove(nicIndex)
      if (activeNic === nics.length - 1) {
        setActiveNic((prev) => prev - 1)
      }
    }
  }

  const memoizedFormWithSchema = useMemo(
    () =>
      nics?.length <= 0 ? (
        <Box p={4} maxWidth={600} mx="auto">
          <Typography
            noWrap
            variant="h5"
            gutterBottom
            style={{ color: '#1976d', fontWeight: 'bold' }}
          >
            {Tr(T.VirtualRouterNICStart)}
          </Typography>
          <Typography variant="body1" paragraph style={{ marginTop: '16px' }}>
            {Tr(T.VirtualRouterNICStart1)}
          </Typography>
          <Typography variant="body1" paragraph style={{ marginTop: '16px' }}>
            {Tr(T.VirtualRouterNICStart2)}
          </Typography>
        </Box>
      ) : (
        <FormWithSchema
          legend={Tr(T.VirtualRouterNICNetworkConfiguration)}
          key={`${STEP_ID}-NIC-${activeNic}`}
          cy={STEP_ID}
          fields={FIELDS}
          saveState={true}
          id={`${STEP_ID}.NIC.${activeNic}`}
        />
      ),
    [nics, activeNic]
  )

  return (
    <Canvas
      columns={[
        <NicColumn
          key={`${STEP_ID}-NIC-COLUMN-${activeNic}}`}
          nics={watchedNicsArray}
          addNic={handleAddnewNic}
          removeNic={handleDeleteNic}
          selectNic={handleSelectNic}
          activeNic={activeNic}
        />,
        memoizedFormWithSchema,
      ]}
      layout={[4, 8]} // Controls the viewport width split
    />
  )
}

/**
 * Basic configuration about VM Template.
 *
 * @returns {object} Basic configuration step
 */
const Networking = () => ({
  id: STEP_ID,
  label: T.ConfigureNetworking,
  resolver: SCHEMA,
  optionsValidate: { abortEarly: false },
  content: () => Content(),
})

export default Networking
