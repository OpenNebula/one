/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { T } from 'client/constants'

export const TAB_ID = ['NIC', 'NIC_ALIAS']

const mapNicNameFunction = mapNameByIndex('NIC')
const mapAliasNameFunction = mapNameByIndex('NIC_ALIAS')

const Networking = ({ hypervisor }) => {
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

  const removeAndReorder = (nic) => {
    const nicName = nic?.NAME
    const isAlias = !!nic?.PARENT?.length
    const list = isAlias ? alias : nics

    const updatedList = list
      .filter(({ NAME }) => NAME !== nicName)
      .map(isAlias ? mapAliasNameFunction : mapNicNameFunction)

    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      nicName,
      list,
      currentBootOrder
    )

    isAlias ? replaceAlias(updatedList) : replaceNic(updatedList)
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)
  }

  const handleUpdate = ({ NAME: _, ...updatedNic }, id) => {
    const isAlias = !!updatedNic?.PARENT?.length
    const index = isAlias
      ? alias.findIndex((nic) => nic.id === id)
      : nics.findIndex((nic) => nic.id === id)

    isAlias
      ? updateAlias(index, mapAliasNameFunction(updatedNic, index))
      : updateNic(index, mapNicNameFunction(updatedNic, index))
  }

  const handleAppend = (newNic) => {
    const isAlias = !!newNic?.PARENT?.length

    isAlias
      ? appendAlias(mapAliasNameFunction(newNic, alias.length))
      : appendNic(mapNicNameFunction(newNic, nics.length))
  }

  return (
    <div>
      <AttachAction
        currentNics={nics}
        hypervisor={hypervisor}
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
        {[...nics, ...alias]?.map(({ id, ...item }, index) => {
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
                    />
                  )}
                  <AttachAction
                    nic={item}
                    hypervisor={hypervisor}
                    currentNics={nics}
                    onSubmit={(updatedNic) => {
                      const wasAlias = !!item?.PARENT?.length
                      const isAlias = !!updatedNic?.PARENT?.length

                      if (wasAlias === isAlias) {
                        return handleUpdate(updatedNic, id)
                      }

                      removeAndReorder(item)
                      handleAppend(updatedNic)
                    }}
                  />
                </>
              }
            />
          )
        })}
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
