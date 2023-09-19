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

export const TAB_ID = ['NIC', 'NIC_ALIAS', 'PCI']

const mapNicNameFunction = mapNameByIndex(TAB_ID[0])
const mapAliasNameFunction = mapNameByIndex(TAB_ID[1])
const mapPCINameFunction = mapNameByIndex(TAB_ID[2])

const Networking = ({ hypervisor, oneConfig, adminGroup }) => {
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

  const removeAndReorder = (nic) => {
    const nicName = nic?.NAME
    const isAlias = !!nic?.PARENT?.length
    const isPCI = nic?.TYPE === 'NIC'

    let list
    let mapFunction

    if (isAlias) {
      list = alias
      mapFunction = mapAliasNameFunction
    } else if (isPCI) {
      list = pcis
      mapFunction = mapPCINameFunction
    } else {
      list = nics
      mapFunction = mapNicNameFunction
    }

    const updatedList = list
      .filter(({ NAME }) => NAME !== nicName)
      .map(mapFunction)

    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      nicName,
      list,
      currentBootOrder
    )

    if (isAlias) {
      replaceAlias(updatedList)
    } else if (isPCI) {
      replacePCI(updatedList)
    } else {
      replaceNic(updatedList)
    }

    setValue(BOOT_ORDER_NAME(), updatedBootOrder)
  }

  const handleUpdate = ({ NAME: _, ...updatedNic }, id, nicForDelete) => {
    const isAlias = !!updatedNic?.PARENT?.length
    const isPCI = Object.values(PCI_TYPES).includes(updatedNic?.PCI_TYPE)

    if (isAlias) {
      const index = alias.findIndex((nic) => nic.id === id)
      if (index === -1) {
        removeAndReorder(nicForDelete)
        handleAppend(updatedNic)

        return
      }
      updateAlias(index, mapAliasNameFunction(updatedNic, index))
    } else if (isPCI) {
      const index = pcis.findIndex((nic) => nic.id === id)
      if (index === -1) {
        removeAndReorder(nicForDelete)
        handleAppend(updatedNic)

        return
      }
      updatedNic.TYPE = 'NIC'
      delete updatedNic.PCI_TYPE
      updatePCI(index, mapPCINameFunction(updatedNic, index))
    } else {
      const index = nics.findIndex((nic) => nic.id === id)
      if (index === -1) {
        removeAndReorder(nicForDelete)
        handleAppend(updatedNic)

        return
      }
      updateNic(index, mapNicNameFunction(updatedNic, index))
    }
  }

  const handleAppend = (newNic) => {
    const isAlias = !!newNic?.PARENT?.length
    const isPCI = Object.values(PCI_TYPES).includes(newNic?.PCI_TYPE)

    if (isAlias) {
      appendAlias(mapAliasNameFunction(newNic, alias.length))
    } else if (isPCI) {
      newNic.TYPE = 'NIC'
      delete newNic.PCI_TYPE
      appendPCI(mapPCINameFunction(newNic, pcis.length))
    } else {
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
                        onSubmit={() => removeAndReorder(item)}
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
