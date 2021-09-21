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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/core'
import { Edit, Trash } from 'iconoir-react'

import { useListForm } from 'client/hooks'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { AttachNicForm } from 'client/components/Forms/Vm'
import { Tr, Translate } from 'client/components/HOC'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration'
import { NIC_SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { reorder } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/booting'
import { T } from 'client/constants'

const useStyles = makeStyles({
  root: {
    paddingBlock: '1em',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, auto))',
    gap: '1em'
  }
})

export const TAB_ID = 'NIC'

const Networking = ({ data, setFormData }) => {
  const classes = useStyles()
  const nics = data?.[TAB_ID]
    ?.map((nic, idx) => ({ ...nic, NAME: nic?.NAME ?? `NIC${idx}` }))

  const { handleRemove, handleSave } = useListForm({
    parent: EXTRA_ID,
    key: TAB_ID,
    list: nics,
    setList: setFormData,
    getItemId: (item) => item.NAME ?? `NIC${data.length + 1}`,
    addItemId: (item, id) => ({ ...item, NAME: id })
  })

  const reorderBootOrder = nicId => {
    const getIndexFromNicId = id => String(id).toLowerCase().replace('nic', '')
    const idxToRemove = getIndexFromNicId(nicId)

    const nicIds = nics
      .filter(nic => nic.NAME !== nicId)
      .map(nic => String(nic.NAME).toLowerCase())

    const newBootOrder = [...data?.OS?.BOOT?.split(',').filter(Boolean)]
      .filter(bootId => !bootId.startsWith('nic') || nicIds.includes(bootId))
      .map(bootId => {
        if (!bootId.startsWith('nic')) return bootId

        const nicId = getIndexFromNicId(bootId)

        return nicId < idxToRemove ? bootId : `nic${nicId - 1}`
      })

    reorder(newBootOrder, setFormData)
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-nic',
          label: 'Add nic'
        }}
        dialogProps={{
          title: `Add new: ${Tr(T.NIC)}`
        }}
        options={[{
          form: () => AttachNicForm({ nics }),
          onSubmit: formData =>
            handleSave(NIC_SCHEMA.cast(formData))
        }]}
      />
      <div className={classes.root}>
        {nics?.map(item => {
          const { NAME, RDP, SSH, NETWORK, PARENT, EXTERNAL } = item
          const hasAlias = nics?.some(nic => nic.PARENT === NAME)

          return (
            <SelectCard
              key={NAME}
              title={[NAME, NETWORK].filter(Boolean).join(' - ')}
              subheader={<>
                {Object
                  .entries({ RDP, SSH, ALIAS: PARENT, EXTERNAL })
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
                      handleClick={() => {
                        handleRemove(NAME)
                        reorderBootOrder(NAME)
                      }}
                      icon={<Trash size={18} />}
                    />
                  }
                  <ButtonToTriggerForm
                    buttonProps={{
                      'data-cy': `edit-${NAME}`,
                      icon: <Edit size={18} />,
                      tooltip: <Translate word={T.Edit} />
                    }}
                    dialogProps={{
                      title: <><Translate word={T.Edit} />{`: ${NAME} - ${NETWORK}`}</>
                    }}
                    options={[{
                      form: () => AttachNicForm({ nics }, item),
                      onSubmit: newValues => handleSave(newValues, NAME)
                    }]}
                  />
                </>
              }
            />
          )
        })}
      </div>
    </>
  )
}

Networking.propTypes = {
  data: PropTypes.any,
  setFormData: PropTypes.func
}

Networking.displayName = 'Networking'

export default Networking
