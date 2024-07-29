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
import PropTypes from 'prop-types'
import { Stack } from '@mui/material'
import { ServerConnection as NetworkIcon } from 'iconoir-react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { useEffect } from 'react'
import { filter } from 'lodash'
import { FormWithSchema } from 'client/components/Forms'
import NicCard from 'client/components/Cards/NicCard'
import {
  AttachAction,
  DetachAction,
  AliasAction,
} from 'client/components/Tabs/Vm/Network/Actions'
import { SkeletonStepsForm } from 'client/components/FormStepper'

import {
  STEP_ID as EXTRA_ID,
  TabType,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import {
  BOOT_ORDER_NAME,
  reorderBootAfterRemove,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import { FIELDS } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/networking/schema'
import { T, PCI_TYPES } from 'client/constants'
import { useGeneralApi } from 'client/features/General'
import { useGetVNetworksQuery } from 'client/features/OneApi/network'

export const TAB_ID = ['NIC', 'NIC_ALIAS', 'PCI']

const mapNicNameFunction = mapNameByIndex(TAB_ID[0])
const mapPCINameFunction = mapNameByIndex(TAB_ID[2])

const Networking = ({ hypervisor, oneConfig, adminGroup }) => {
  const {
    setModifiedFields,
    setFieldPath,
    initModifiedFields,
    changePositionModifiedFields,
  } = useGeneralApi()
  useEffect(() => {
    // Init nic modified fields
    setFieldPath(`extra.Network.NIC`)
    initModifiedFields([
      ...nics.map((element, index) => ({ __nicIndex__: index })),
    ])

    // Init alias modified fields
    setFieldPath(`extra.Network.NIC_ALIAS`)
    initModifiedFields([
      ...alias.map((element, index) => ({ __aliasIndex__: index })),
    ])

    // Init pci modified fields
    setFieldPath(`extra.PciDevices.PCI`)
    initModifiedFields([
      ...pcis.map((element, index) => ({ __aliasPci__: index })),
    ])

    // Set field to network
    setFieldPath(`extra.Network`)
  }, [])

  const { setValue, getValues, control } = useFormContext()

  const { data: vnets } = useGetVNetworksQuery()

  const {
    fields: nics = [],
    replace: replaceNic,
    update: updateNic,
    append: appendNic,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[0]}`,
  })

  const methods = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[1]}`,
  })

  const { fields: alias = [], update: updateAlias } = methods

  const {
    fields: pcis = [],
    replace: replacePCI,
    update: updatePCI,
    append: appendPCI,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[2]}`,
  })

  // Delay execution until next event loop tick to ensure state updates
  useEffect(() => {
    setFieldPath(`extra.Network`)
  }, [])

  /**
   * Remove a nic and reorder the array of nics or pcis. Also, update boot order and parent attribute in alias list.
   *
   * @param {object} nic - Nic to delete
   * @param {string} idNic - Id of the nic in the array
   * @param {object} updatedNic - Nic to update
   */
  const removeAndReorder = (nic, idNic, updatedNic) => {
    // Get nic name and if it is pci
    const nicName = nic?.NAME
    const isPCI = nic?.TYPE === 'NIC'

    let list
    let mapFunction

    if (isPCI) {
      // Select list and map name function with pci type
      list = pcis
      mapFunction = mapPCINameFunction

      // Find the id of the nic in pci array
      const indexRemove = list.findIndex((nicPci) => nicPci.id === idNic)

      // Set field path on the index of pci array to set delete flag in this element
      setFieldPath(`extra.PciDevices.PCI.${indexRemove}`)
    } else {
      // Select list and map name function with nic type
      list = nics
      mapFunction = mapNicNameFunction

      // Find the id of the nic in nics array
      const indexRemove = list.findIndex(
        (nicNetwork) => nicNetwork.id === idNic
      )

      // Set field path on the index of nics array to set delete flag in this element
      setFieldPath(`extra.Network.NIC.${indexRemove}`)
    }

    // Set delete flag in modified fields
    setModifiedFields({ __flag__: 'DELETE' })

    // Update list selected (nics, alias or pcis) names. Names are based on index, so the names of the list elements are calculated and updated
    const updatedList = list
      .filter(({ id }) => idNic !== id)
      .map((itemNic, indexNicUpdated) => {
        const nicUpdated = mapFunction(itemNic, indexNicUpdated)

        // Update alias with new name of the NICs
        alias.forEach((itemAlias, indexItemAlias) => {
          if (itemAlias.PARENT === itemNic.NAME) {
            setFieldPath(`extra.Network.NIC_ALIAS.${indexItemAlias}`)
            setModifiedFields({ PARENT: true })
            itemAlias.PARENT = nicUpdated.NAME
            updateAlias(indexItemAlias, itemAlias)
          }
        })

        return nicUpdated
      })

    // Update boot order of booting section (boot order has disks and nics, so if we delete a nic, we need to update it)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      nicName,
      list,
      currentBootOrder
    )

    // Set modifiedFields with boout order to update it
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)

    // Replace the list (nics or pcis) with the new values after delete the element
    if (isPCI) {
      replacePCI(updatedList)
    } else {
      replaceNic(updatedList)
    }
  }

  /**
   * Update a nic with the different cases that could be because nics and pcis are on different array forms.
   *
   * @param {object} updatedNic - The nic to update
   * @param {string} id - The id of the nic in the array form
   * @param {object} nicForDelete - Nic to delete if user changes nic or pci
   * @returns {void} - Void value
   */
  const handleUpdate = (updatedNic, id, nicForDelete) => {
    // Check if the nic is pci
    const isPCI = Object.values(PCI_TYPES).includes(updatedNic?.PCI_TYPE)

    if (isPCI) {
      // Get the index of the pci in the pci array
      const indexPci = pcis.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not a pci, but in this update, user change this element from nic type to pci.
      // In this case, we need to delete the old element (that is on nics array) and add to the pci arrays.
      if (indexPci === -1) {
        // Check if the old element is in nic array and get the index
        const indexNic = nics.findIndex((nic) => nic.id === id)

        // If the old element it's on nics array, we need to get the state (if it was deleted or updated) of the element from Network.NIC of modifiedFields and set on Network.PCI of modifiedFields
        if (indexNic !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.Network.NIC',
            sourcePosition: indexNic,
            targetPath: 'extra.PciDevices.PCI',
            targetPosition: pcis.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })
        }

        // Remove the old element
        removeAndReorder(nicForDelete, id)

        // Add the new element
        handleAppend(updatedNic, true)

        return
      }

      // Update if the pci exists on pcis array
      updatedNic.TYPE = 'NIC'
      delete updatedNic.PCI_TYPE
      updatePCI(indexPci, mapPCINameFunction(updatedNic, indexPci))
    } else {
      // Get the index of the nic in the nics array
      const indexNic = nics.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not a nic, but in this update, user change this element from pci type to nic.
      // In this case, we need to delete the old element (that is on pcis array) and add to the nic arrays.
      if (indexNic === -1) {
        // Check if the old element is in pcis array and get the index
        const indexPci = pcis.findIndex((nic) => nic.id === id)

        // If the old element it's on pcis array, we need to get the state (if it was deleted or updated) of the element from Network.PCI of moodifiedFields and set on Network.NIC of modifiedFields
        if (indexPci !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.PciDevices.PCI',
            sourcePosition: indexPci,
            targetPath: 'extra.Network.NIC',
            targetPosition: nics.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })

          // If the element was pci, delete the pci fields
          setFieldPath(`extra.Network.NIC.${nics.length}`)
          setModifiedFields({
            advanced: { TYPE: { __delete__: true } },
          })
        }

        // Remove the old element
        removeAndReorder(nicForDelete, id)

        // Add the new element
        handleAppend(updatedNic, true)

        return
      }

      // In case that the element has not changed from nic to pci, update on nics array
      updateNic(indexNic, mapNicNameFunction(updatedNic, indexNic))
    }

    // Always set field path on the length of nics
    setFieldPath(`extra.Network`)
  }

  /**
   * Append a nic to the corresponding array (nics or pcis).
   *
   * @param {object} newNic - The nic to append
   * @param {boolean} update - If the append it's when user are updating a nic
   */
  const handleAppend = (newNic, update) => {
    // Check if nic is pci
    const isPCI = Object.values(PCI_TYPES).includes(newNic?.PCI_TYPE)

    if (isPCI) {
      // Set pci type as pci attribute
      newNic.TYPE = 'NIC'
      delete newNic.PCI_TYPE

      // Add the nic to the pci section in modified fields
      !update &&
        changePositionModifiedFields({
          sourcePath: 'extra.Network.NIC',
          sourcePosition: nics.length,
          targetPath: 'extra.PciDevices.PCI',
          targetPosition: pcis.length,
          sourceDelete: true,
        })
      setFieldPath(`extra.PciDevices.PCI.${pcis.length}`)
      setModifiedFields({
        advanced: { PCI_TYPE: { __delete__: true } },
      })

      // Append to form array of pci
      appendPCI(mapPCINameFunction(newNic, pcis.length))
    } else {
      // Set field path to last position
      setFieldPath(`extra.Network.NIC.${nics.length}`)
      setModifiedFields({
        advanced: { PCI_TYPE: { __delete__: true } },
      })

      // Append to form array of nics
      appendNic(mapNicNameFunction(newNic, nics.length))
    }
  }

  return vnets && Array.isArray(vnets) ? (
    <div>
      <AttachAction
        currentNics={nics}
        hypervisor={hypervisor}
        oneConfig={oneConfig}
        adminGroup={adminGroup}
        onSubmit={handleAppend}
      />
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
        {[...nics, ...pcis.filter((pci) => pci?.TYPE === 'NIC')]?.map(
          ({ id, ...item }, index) => {
            const hasAlias = alias.find(
              (aliasItem) => aliasItem.PARENT === item.NAME
            )
            const isPci = item.TYPE === 'NIC'
            const isAlias = Object.prototype.hasOwnProperty.call(item, 'PARENT')
            item.NIC_ID = index

            return (
              <NicCard
                key={id ?? item?.NAME}
                nic={item}
                hasAlias={hasAlias}
                aliasLength={filter(alias, { PARENT: item?.NAME }).length}
                showParents
                clipboardOnTags={false}
                vnets={vnets}
                actions={
                  <>
                    {!hasAlias && (
                      <DetachAction
                        nic={item}
                        onSubmit={() => removeAndReorder(item, id)}
                        oneConfig={oneConfig}
                        adminGroup={adminGroup}
                      />
                    )}

                    <AliasAction
                      nic={item}
                      alias={alias}
                      control={control}
                      methods={methods}
                    />

                    <AttachAction
                      nic={item}
                      hypervisor={hypervisor}
                      oneConfig={oneConfig}
                      adminGroup={adminGroup}
                      currentNics={nics}
                      onSubmit={(updatedNic) => {
                        updatedNic.NAME = item.NAME
                        handleUpdate(updatedNic, id, item)
                      }}
                      indexNic={nics.findIndex((nic) => nic.id === id)}
                      indexPci={pcis.findIndex((nic) => nic.id === id)}
                      hasAlias={hasAlias}
                      isPci={isPci}
                      isAlias={isAlias}
                    />
                  </>
                }
              />
            )
          }
        )}
      </Stack>
      <FormWithSchema
        cy={`${EXTRA_ID}-network-options`}
        fields={FIELDS}
        legend={T.NetworkDefaults}
        legendTooltip={T.NetworkDefaultsConcept}
        id={EXTRA_ID}
        saveState={true}
      />
    </div>
  ) : (
    <SkeletonStepsForm />
  )
}

Networking.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

/** @type {TabType} */
const TAB = {
  id: 'network',
  name: T.Network,
  icon: NetworkIcon,
  Content: Networking,
  getError: (error) => TAB_ID.some((id) => error?.[id]),
}

export default TAB
