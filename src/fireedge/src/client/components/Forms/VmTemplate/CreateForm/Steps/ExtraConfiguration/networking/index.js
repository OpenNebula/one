/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { FormWithSchema } from 'client/components/Forms'
import NicCard from 'client/components/Cards/NicCard'
import {
  AttachAction,
  DetachAction,
} from 'client/components/Tabs/Vm/Network/Actions'

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

export const TAB_ID = ['NIC', 'NIC_ALIAS', 'PCI']

const mapNicNameFunction = mapNameByIndex(TAB_ID[0])
const mapAliasNameFunction = mapNameByIndex(TAB_ID[1])
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
    setFieldPath(`extra.InputOutput.PCI`)
    initModifiedFields([
      ...pcis.map((element, index) => ({ __aliasPci__: index })),
    ])

    // Set field to network
    setFieldPath(`extra.Network`)
  }, [])

  const { setValue, getValues } = useFormContext()

  const {
    fields: nics = [],
    replace: replaceNic,
    update: updateNic,
    append: appendNic,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[0]}`,
  })

  const {
    fields: alias = [],
    replace: replaceAlias,
    update: updateAlias,
    append: appendAlias,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID[1]}`,
  })

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
   * Remove a nic and reorder the array of nics, alias or pcis. Also, update boot order.
   *
   * @param {object} nic - Nic to delete
   * @param {string} idNic - If of the nic in the array
   * @param {object} updatedNic - Nic to update
   */
  const removeAndReorder = (nic, idNic, updatedNic) => {
    // Get nic name and if it is alias or pci
    const nicName = nic?.NAME
    const isAlias = !!nic?.PARENT?.length
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
      setFieldPath(`extra.InputOutput.PCI.${indexRemove}`)
    } else if (isAlias) {
      // Select list and map name function with alias type
      list = alias
      mapFunction = mapAliasNameFunction

      // Find the id of the nic in alias array
      const indexRemove = list.findIndex((nicAlias) => nicAlias.id === idNic)

      // Set field path on the index of alias array to set delete flag in this element
      setFieldPath(`extra.Network.NIC_ALIAS.${indexRemove}`)
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
    const updatedList = list.filter(({ id }) => idNic !== id).map(mapFunction)

    // Update boot order of booting section (boot order has disks and nics, so if we delete a nic, we need to update it)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      nicName,
      list,
      currentBootOrder
    )

    // Set modifiedFields with boout order to update it
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)

    // Update refernces to NAME in alias items
    if (!isAlias) {
      alias.forEach((aliasItem) => {
        const oldParent = list.find((item) => item.NAME === aliasItem.PARENT)
        if (oldParent) {
          const newParent = updatedList.find((item) => item.id === oldParent.id)
          aliasItem.PARENT = newParent.NAME
        }
      })

      if (updatedNic) {
        const oldParent = list.find((item) => item.NAME === updatedNic.PARENT)
        if (oldParent) {
          const newParent = updatedList.find((item) => item.id === oldParent.id)
          updatedNic.PARENT = newParent.NAME
        }
      }

      replaceAlias(alias)
    }

    // Replace the list (nics, alias or pcis) with the new values after delete the element
    if (isAlias) {
      replaceAlias(updatedList)
    } else if (isPCI) {
      replacePCI(updatedList)
    } else {
      replaceNic(updatedList)
    }
  }

  /**
   * Update a nic with the different cases that could be because nics, alias and pcis are on different array forms.
   *
   * @param {object} nic - The nic to update
   * @param {string} nic.NAME - Name of the nic
   * @param {string} id - The id of the nic in the array form
   * @param {object} nicForDelete - Nic to delete if user changes nic, alias or pci
   * @returns {void} - Void value
   */
  const handleUpdate = ({ NAME: _, ...updatedNic }, id, nicForDelete) => {
    // Check if the nic is alias or pci
    const isAlias = !!updatedNic?.PARENT?.length
    const isPCI = Object.values(PCI_TYPES).includes(updatedNic?.PCI_TYPE)

    if (isPCI) {
      // Get the index of the pci in the pci array
      const indexPci = pcis.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not a pci, but in this update, user change this element from nic or alias type to pci.
      // In this case, we need to delete the old element (that is on nics or alias array) and add to the pci arrays.
      if (indexPci === -1) {
        // Check if the old element is in nic or alias array and get the index
        const indexNic = nics.findIndex((nic) => nic.id === id)
        const indexAlias = alias.findIndex((nic) => nic.id === id)

        // If the old element it's on nics array, we need to get the state (if it was deleted or updated) of the element from Network.NIC of modifiedFields and set on Network.PCI of modifiedFields
        if (indexNic !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.Network.NIC',
            sourcePosition: indexNic,
            targetPath: 'extra.InputOutput.PCI',
            targetPosition: pcis.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })
        }

        // If the old element it's on alias array, we need to get the state (if it was deleted or updated) of the element from Network.NIC_ALIAS of moodifiedFields and set on Network.PCI of modifiedFields
        if (indexAlias !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.Network.NIC_ALIAS',
            sourcePosition: indexAlias,
            targetPath: 'extra.InputOutput.PCI',
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
    } else if (isAlias) {
      // Get the index of the alias in the alias array
      const indexAlias = alias.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not an alias, but in this update, user change this element from nic or pci type to alias.
      // In this case, we need to delete the old element (that is on nics or pcis array) and add to the alias arrays.
      if (indexAlias === -1) {
        // Check if the old element is in nic or pcis array and get the index
        const indexNic = nics.findIndex((nic) => nic.id === id)
        const indexPci = pcis.findIndex((nic) => nic.id === id)

        // If the old element it's on nics array, we need to get the state (if it was deleted or updated) of the element from Network.NIC of moodifiedFields and set on Network.NIC_ALIAS of modifiedFields
        if (indexNic !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.Network.NIC',
            sourcePosition: indexNic,
            targetPath: 'extra.Network.NIC_ALIAS',
            targetPosition: alias.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })
        }

        // If the old element it's on pcis array, we need to get the state (if it was deleted or updated) of the element from Network.PCI of moodifiedFields and set on Network.NIC_ALIAS of modifiedFields
        if (indexPci !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.InputOutput.PCI',
            sourcePosition: indexPci,
            targetPath: 'extra.Network.NIC_ALIAS',
            targetPosition: alias.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })

          // // If the element was pci, delete the pci fields
          setFieldPath(`extra.Network.NIC_ALIAS.${alias.length}.advanced`)
          setModifiedFields({
            advanced: { TYPE: { __delete__: true } },
          })
        }

        // Remove the old element
        removeAndReorder(nicForDelete, id, updatedNic)

        // Add the new element
        handleAppend(updatedNic, true)

        return
      }

      // Update if the alias exists on alias array
      updateAlias(indexAlias, mapAliasNameFunction(updatedNic, indexAlias))
    } else {
      // Get the index of the nic in the nics array
      const indexNic = nics.findIndex((nic) => nic.id === id)

      // If the index is equal to -1, that's mean that it's an element that before is not a nic, but in this update, user change this element from alias or pci type to nic.
      // In this case, we need to delete the old element (that is on nics or pcis array) and add to the alias arrays.
      if (indexNic === -1) {
        // Check if the old element is in alias or pcis array and get the index
        const indexAlias = alias.findIndex((nic) => nic.id === id)
        const indexPci = pcis.findIndex((nic) => nic.id === id)

        // If the old element it's on alias array, we need to get the state (if it was deleted or updated) of the element from Network.NIC_ALIAS of moodifiedFields and set on Network.NIC of modifiedFields
        if (indexAlias !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.Network.NIC_ALIAS',
            sourcePosition: indexAlias,
            targetPath: 'extra.Network.NIC',
            targetPosition: nics.length,
            sourceDelete: false,
            emptyObjectContent: true,
          })
        }

        // If the old element it's on pcis array, we need to get the state (if it was deleted or updated) of the element from Network.PCI of moodifiedFields and set on Network.NIC_ALIAS of modifiedFields
        if (indexPci !== -1) {
          changePositionModifiedFields({
            sourcePath: 'extra.InputOutput.PCI',
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

      // In case that the element has not changed from nic to alias or pci, update on nics array
      updateNic(indexNic, mapNicNameFunction(updatedNic, indexNic))
    }

    // Always set field path on the length of nics
    setFieldPath(`extra.Network`)
  }

  /**
   * Append a nic to the corresponding array (nics, alias or pcis).
   *
   * @param {object} newNic - The nic to append
   * @param {boolean} update - If the append it's when user are updating a nic
   */
  const handleAppend = (newNic, update) => {
    // Check if nic is alias or pci
    const isAlias = !!newNic?.PARENT?.length
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
          targetPath: 'extra.InputOutput.PCI',
          targetPosition: pcis.length,
          sourceDelete: true,
        })
      setFieldPath(`extra.InputOutput.PCI.${pcis.length}`)
      setModifiedFields({
        advanced: { PCI_TYPE: { __delete__: true } },
      })

      // Append to form array of pci
      appendPCI(mapPCINameFunction(newNic, pcis.length))
    } else if (isAlias) {
      // Add the nic to the alias section in modified fields
      !update &&
        changePositionModifiedFields({
          sourcePath: 'extra.Network.NIC',
          sourcePosition: nics.length,
          targetPath: 'extra.Network.NIC_ALIAS',
          targetPosition: alias.length,
          sourceDelete: true,
        })
      setFieldPath(`extra.Network.NIC_ALIAS.${alias.length}`)
      setModifiedFields({
        advanced: { PCI_TYPE: { __delete__: true } },
      })

      // Append to form array of alias
      appendAlias(mapAliasNameFunction(newNic, alias.length))
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

  return (
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
        {[...nics, ...alias, ...pcis.filter((pci) => pci?.TYPE === 'NIC')]?.map(
          ({ id, ...item }, index) => {
            const hasAlias = alias?.some((nic) => nic.PARENT === item.NAME)
            const isPci = item.TYPE === 'NIC'
            const isAlias = Object.prototype.hasOwnProperty.call(item, 'PARENT')
            item.NIC_ID = index

            return (
              <NicCard
                key={id ?? item?.NAME}
                nic={item}
                showParents
                clipboardOnTags={false}
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
                    <AttachAction
                      nic={item}
                      hypervisor={hypervisor}
                      oneConfig={oneConfig}
                      adminGroup={adminGroup}
                      currentNics={nics}
                      onSubmit={(updatedNic) =>
                        handleUpdate(updatedNic, id, item)
                      }
                      indexNic={nics.findIndex((nic) => nic.id === id)}
                      indexAlias={alias.findIndex((nic) => nic.id === id)}
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
