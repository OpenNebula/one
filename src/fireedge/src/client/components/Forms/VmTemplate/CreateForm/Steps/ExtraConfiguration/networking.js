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
import { ServerConnection as NetworkIcon, Edit, Trash } from 'iconoir-react'
import { useFormContext, useFieldArray } from 'react-hook-form'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { AttachNicForm } from 'client/components/Forms/Vm'
import { Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID, TabType } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { mapNameByIndex } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/schema'
import { BOOT_ORDER_NAME, reorderBootAfterRemove } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/booting'
import { stringToBoolean } from 'client/models/Helper'
import { T } from 'client/constants'

export const TAB_ID = 'NIC'

const mapNameFunction = mapNameByIndex('NIC')

const Networking = () => {
  const { setValue, getValues } = useFormContext()
  const { fields: nics, replace, update, append } = useFieldArray({
    name: `${EXTRA_ID}.${TAB_ID}`
  })

  const removeAndReorder = nicName => {
    const updatedNics = nics.filter(({ NAME }) => NAME !== nicName).map(mapNameFunction)
    const currentBootOrder = getValues(BOOT_ORDER_NAME())
    const updatedBootOrder = reorderBootAfterRemove(nicName, nics, currentBootOrder)

    replace(updatedNics)
    setValue(BOOT_ORDER_NAME(), updatedBootOrder)
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-nic',
          label: T.AttachNic,
          variant: 'outlined'
        }}
        options={[{
          dialogProps: { title: T.AttachNic },
          form: () => AttachNicForm({ nics }),
          onSubmit: nic => append(mapNameFunction(nic, nics.length))
        }]}
      />
      <Stack
        pb='1em'
        display='grid'
        gridTemplateColumns='repeat(auto-fit, minmax(300px, 0.5fr))'
        gap='1em'
        mt='1em'
      >
        {nics?.map((item, index) => {
          const { id, NAME, RDP, SSH, NETWORK, PARENT, EXTERNAL } = item
          const hasAlias = nics?.some(nic => nic.PARENT === NAME)

          return (
            <SelectCard
              key={id ?? NAME}
              title={[NAME, NETWORK].filter(Boolean).join(' - ')}
              subheader={<>
                {Object
                  .entries({
                    RDP: stringToBoolean(RDP),
                    SSH: stringToBoolean(SSH),
                    EXTERNAL: stringToBoolean(EXTERNAL),
                    [`PARENT: ${PARENT}`]: PARENT
                  })
                  .map(([k, v]) => v ? `${k}` : '')
                  .filter(Boolean)
                  .join(' | ')
                }
              </>}
              action={
                <>
                  {!hasAlias &&
                    <Action
                      data-cy={`remove-${NAME}`}
                      handleClick={() => removeAndReorder(NAME)}
                      icon={<Trash />}
                    />
                  }
                  <ButtonToTriggerForm
                    buttonProps={{
                      'data-cy': `edit-${NAME}`,
                      icon: <Edit />,
                      tooltip: <Translate word={T.Edit} />
                    }}
                    options={[{
                      dialogProps: {
                        title: (
                          <Translate
                            word={T.EditSomething}
                            values={[`${NAME} - ${NETWORK}`]}
                          />
                        )
                      },
                      form: () => AttachNicForm({ nics }, item),
                      onSubmit: updatedNic =>
                        update(index, mapNameFunction(updatedNic, index))
                    }]}
                  />
                </>
              }
            />
          )
        })}
      </Stack>
    </>
  )
}

Networking.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func,
  hypervisor: PropTypes.string,
  control: PropTypes.object
}

/** @type {TabType} */
const TAB = {
  id: 'network',
  name: T.Network,
  icon: NetworkIcon,
  Content: Networking,
  getError: error => !!error?.[TAB_ID]
}

export default TAB
