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
import { memo, JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'
import { Edit, Trash } from 'iconoir-react'

import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { AttachNicForm } from 'client/components/Forms/Vm'
import { Translate } from 'client/components/HOC'

import { stringToBoolean } from 'client/models/Helper'
import { T } from 'client/constants'

/**
 * @param {object} props - Props
 * @param {number} props.index - Index in list
 * @param {object} props.item - NIC
 * @param {string} props.handleRemove - Remove function
 * @param {string} props.handleUpdate - Update function
 * @returns {JSXElementConstructor} - NIC card
 */
const NicItem = memo(({ item, nics, handleRemove, handleUpdate }) => {
  const { id, NAME, RDP, SSH, NETWORK, PARENT, EXTERNAL } = item
  const hasAlias = nics?.some((nic) => nic.PARENT === NAME)

  return (
    <SelectCard
      key={id ?? NAME}
      title={[NAME, NETWORK].filter(Boolean).join(' - ')}
      subheader={
        <>
          {Object.entries({
            RDP: stringToBoolean(RDP),
            SSH: stringToBoolean(SSH),
            EXTERNAL: stringToBoolean(EXTERNAL),
            [`PARENT: ${PARENT}`]: PARENT,
          })
            .map(([k, v]) => (v ? `${k}` : ''))
            .filter(Boolean)
            .join(' | ')}
        </>
      }
      action={
        <>
          {!hasAlias && (
            <Action
              data-cy={`remove-${NAME}`}
              tooltip={<Translate word={T.Remove} />}
              handleClick={handleRemove}
              color="error"
              icon={<Trash />}
            />
          )}
          <ButtonToTriggerForm
            buttonProps={{
              'data-cy': `edit-${NAME}`,
              icon: <Edit />,
              tooltip: <Translate word={T.Edit} />,
            }}
            options={[
              {
                dialogProps: {
                  title: (
                    <Translate
                      word={T.EditSomething}
                      values={[`${NAME} - ${NETWORK}`]}
                    />
                  ),
                },
                form: () => AttachNicForm({ nics }, item),
                onSubmit: handleUpdate,
              },
            ]}
          />
        </>
      }
    />
  )
})

NicItem.propTypes = {
  index: PropTypes.number,
  item: PropTypes.object,
  nics: PropTypes.array,
  handleRemove: PropTypes.func,
  handleUpdate: PropTypes.func,
}

NicItem.displayName = 'NicItem'

export default NicItem
