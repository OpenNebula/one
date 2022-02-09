/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { AttachNicForm } from 'client/components/Forms/Vm'
import { FormWithSchema } from 'client/components/Forms'

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
import NicItem from './NicItem'

export const TAB_ID = 'NIC'

const mapNameFunction = mapNameByIndex('NIC')

const Networking = () => {
  const { setValue, getValues } = useFormContext()
  const {
    fields: nics,
    replace,
    update,
    append,
  } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`,
  })

  const removeAndReorder = (nicName) => {
    const updatedNics = nics
      .filter(({ NAME }) => NAME !== nicName)
      .map(mapNameFunction)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(
      nicName,
      nics,
      currentBootOrder
    )

    replace(updatedNics)
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)
  }

  const handleUpdate = (updatedNic, index) => {
    update(index, mapNameFunction(updatedNic, index))
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-nic',
          label: T.AttachNic,
          variant: 'outlined',
        }}
        options={[
          {
            dialogProps: { title: T.AttachNic, dataCy: 'modal-attach-nic' },
            form: () => AttachNicForm({ nics }),
            onSubmit: (nic) => append(mapNameFunction(nic, nics.length)),
          },
        ]}
      />
      <Stack
        pb="1em"
        display="grid"
        gap="1em"
        mt="1em"
        sx={{
          gridTemplateColumns: {
            sm: '1fr',
            md: 'repeat(auto-fit, minmax(300px, 0.5fr))',
          },
        }}
      >
        {nics?.map(({ id, ...item }, index) => (
          <NicItem
            key={id ?? item?.NAME}
            item={item}
            nics={nics}
            handleRemove={() => removeAndReorder(item?.NAME)}
            handleUpdate={(updatedNic) => handleUpdate(updatedNic, index)}
          />
        ))}
      </Stack>
      <FormWithSchema
        cy={`${EXTRA_ID}-network-options`}
        fields={FIELDS}
        legend={T.NetworkDefaults}
        legendTooltip={T.NetworkDefaultsConcept}
        id={EXTRA_ID}
      />
    </>
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
  getError: (error) => !!error?.[TAB_ID],
}

export default TAB
