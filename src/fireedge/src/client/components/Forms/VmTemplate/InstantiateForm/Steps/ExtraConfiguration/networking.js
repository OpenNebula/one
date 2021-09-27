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
import { SCHEMA as EXTRA_SCHEMA } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/schema'
import { reorderBootAfterRemove } from 'client/components/Forms/VmTemplate/InstantiateForm/Steps/ExtraConfiguration/booting'
import { stringToBoolean } from 'client/models/Helper'
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

  const { handleSetList, handleRemove, handleSave } = useListForm({
    parent: EXTRA_ID,
    key: TAB_ID,
    list: nics,
    setList: setFormData,
    getItemId: item => item.NAME,
    addItemId: (item, _, itemIndex) => ({ ...item, NAME: `${TAB_ID}${itemIndex}` })
  })

  const reorderNics = () => {
    const diskSchema = EXTRA_SCHEMA.pick([TAB_ID])
    const { [TAB_ID]: newList } = diskSchema.cast({ [TAB_ID]: data?.[TAB_ID] })

    handleSetList(newList)
  }

  return (
    <>
      <ButtonToTriggerForm
        buttonProps={{
          color: 'secondary',
          'data-cy': 'add-nic',
          label: Tr(T.AttachNic)
        }}
        options={[{
          dialogProps: { title: T.AttachNic },
          form: () => AttachNicForm({ nics }),
          onSubmit: handleSave
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
                  .entries({
                    RDP: stringToBoolean(RDP),
                    SSH: stringToBoolean(SSH),
                    EXTERNAL: stringToBoolean(EXTERNAL),
                    ALIAS: PARENT
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
                      handleClick={() => {
                        handleRemove(NAME)
                        reorderNics()
                        reorderBootAfterRemove(NAME, nics, data, setFormData)
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
                    options={[{
                      dialogProps: {
                        title: <Translate word={T.EditSomething} values={[`${NAME} - ${NETWORK}`]} />
                      },
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
