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
import { createForm } from 'client/utils'
import { SCHEMA } from 'client/components/Forms/Vm/AliasForm/schema'
import PropTypes from 'prop-types'
import { useFieldArray } from 'react-hook-form'
import { useEffect } from 'react'
import {
  AttachAliasAction,
  DetachAliasAction,
} from 'client/components/Tabs/Vm/Network/Actions'

import {
  useAttachNicMutation,
  useDetachNicMutation,
} from 'client/features/OneApi/vm'

import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'
import { jsonToXml } from 'client/models/Helper'

import { useGeneralApi } from 'client/features/General'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'
import { Stack } from '@mui/material'
import { NicCard } from 'client/components/Cards'

import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { SkeletonStepsForm } from 'client/components/FormStepper'

const Content = ({ parent, methods, vmId }) => {
  // Get virtual networks
  const { data: vnets } = useGetVNetworksQuery()

  // Define method to create alias name
  const mapAliasNameFunction = mapNameByIndex('ALIAS')

  // Use array field form
  const {
    fields: alias,
    append,
    remove,
    update,
  } = useFieldArray({ name: 'ALIAS' })

  // General api for enqueue
  const { enqueueSuccess, setFieldPath, setModifiedFields } = useGeneralApi()

  // API to attach and detach alias
  const [attachAlias, { isSuccess: isSuccessAttachAlias }] =
    useAttachNicMutation()
  const [detachAlias, { isSuccess: isSuccessDetachAlias }] =
    useDetachNicMutation()

  // Success messages
  const successMessageAttachAlias = `${Tr(T.AttachAliasSuccess, [vmId])}`
  useEffect(
    () => isSuccessAttachAlias && enqueueSuccess(successMessageAttachAlias),
    [isSuccessAttachAlias]
  )
  const successMessageDetachAlias = `${Tr(T.DetachAliasSuccess, [vmId])}`
  useEffect(
    () => isSuccessDetachAlias && enqueueSuccess(successMessageDetachAlias),
    [isSuccessDetachAlias]
  )

  // Handle actions on NIC and alias
  const handleAttach = async (formData) =>
    await attachAlias({
      id: vmId,
      template: jsonToXml({ NIC_ALIAS: formData }),
    })
  const handleDetach = async (nicId) =>
    await detachAlias({ id: vmId, nic: nicId })

  const handleAppend = (data) => {
    // Set parent
    data.PARENT = parent

    // Create name
    const newAlias = mapAliasNameFunction(data, alias.length)

    // Add to form (and also to the parent form to update the parent component)
    append(newAlias)
    methods && methods.append(newAlias)

    // If vmId exists, make request to API (we are in the network section of a virtual machine)
    vmId && handleAttach(data)
  }

  const handleUpdate = (index) => (data) => {
    // Set parent
    data.PARENT = parent

    // Update form (and also to the parent form to update the parent component)
    update(index, mapAliasNameFunction(data, index))
    methods && methods.update(index, mapAliasNameFunction(data, index))
  }

  const handleRemove = (index, nicId) => () => {
    // Set modified fields
    setFieldPath(`extra.Network.NIC_ALIAS.${index}`)
    setModifiedFields({ __flag__: 'DELETE' })

    // Remove form (and also to the parent form to update the parent component)
    remove(index)
    methods && methods.remove(index)

    // If vmId exists, make request to API (we are in the network section of a virtual machine)
    vmId && handleDetach(nicId || index)
  }

  // Index of alias in a NIC (all alias are in the same array, so in a NIC you only show the corresponding alias)
  let indexNicAlias = -1

  // Return component when exists vnets
  return vnets ? (
    <>
      <div>
        <AttachAliasAction
          onSubmit={(item) => {
            handleAppend(item)
          }}
          indexAlias={alias.length}
          vmId={vmId}
        />
      </div>
      <div>
        <Stack
          pb="1em"
          display="grid"
          gap="1em"
          mt="1em"
          sx={{
            gridTemplateColumns: {
              sm: '1fr',
              md: 'repeat(auto-fit, minmax(400px, 0.5fr))',
            },
          }}
        >
          {alias?.map(({ id, ...item }, index) => {
            const show = item.PARENT === parent

            if (show) {
              indexNicAlias++
            }

            return (
              show && (
                <NicCard
                  key={id ?? item?.NAME}
                  nic={item}
                  indexAlias={index}
                  indexNicAlias={indexNicAlias}
                  showParents
                  clipboardOnTags={false}
                  vnets={vnets}
                  actions={
                    <>
                      {!vmId && (
                        <AttachAliasAction
                          indexAlias={index}
                          indexNicAlias={indexNicAlias}
                          alias={item}
                          onSubmit={handleUpdate(index)}
                        />
                      )}
                      <DetachAliasAction
                        alias={item}
                        onSubmit={handleRemove(index, item.NIC_ID)}
                        index={index}
                        indexNicAlias={indexNicAlias}
                        vmId={vmId}
                      />
                    </>
                  }
                />
              )
            )
          })}
        </Stack>
      </div>
    </>
  ) : (
    <SkeletonStepsForm />
  )
}

Content.displayName = 'Content'

Content.propTypes = {
  parent: PropTypes.string,
  methods: PropTypes.object,
  vmId: PropTypes.number,
}

const AliasForm = createForm(SCHEMA, undefined, {
  ContentForm: Content,
})

export default AliasForm
