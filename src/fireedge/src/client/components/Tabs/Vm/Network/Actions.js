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
import { memo } from 'react'
import PropTypes from 'prop-types'
import { Trash } from 'iconoir-react'

import {
  useAttachNicMutation,
  useDetachNicMutation,
} from 'client/features/OneApi/vm'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'
import { AttachNicForm } from 'client/components/Forms/Vm'

import { jsonToXml } from 'client/models/Helper'
import { Tr, Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const AttachAction = memo(({ vmId, currentNics }) => {
  const [attachNic] = useAttachNicMutation()

  const handleAttachNic = async (formData) => {
    const isAlias = !!formData?.PARENT?.length
    const data = { [isAlias ? 'NIC_ALIAS' : 'NIC']: formData }

    const template = jsonToXml(data)
    await attachNic({ id: vmId, template })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        color: 'secondary',
        'data-cy': 'attach-nic',
        label: T.AttachNic,
        variant: 'outlined',
      }}
      options={[
        {
          dialogProps: { title: T.AttachNic },
          form: () => AttachNicForm({ nics: currentNics }),
          onSubmit: handleAttachNic,
        },
      ]}
    />
  )
})

const DetachAction = memo(({ vmId, nic }) => {
  const [detachNic] = useDetachNicMutation()
  const { NIC_ID, PARENT } = nic
  const isAlias = !!PARENT?.length

  const handleDetach = async () => {
    await detachNic({ id: vmId, nic: NIC_ID })
  }

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `detach-nic-${NIC_ID}`,
        icon: <Trash />,
        tooltip: Tr(T.Detach),
      }}
      options={[
        {
          isConfirmDialog: true,
          dialogProps: {
            title: (
              <Translate
                word={T.DetachSomething}
                values={`${isAlias ? T.Alias : T.NIC} #${nic}`}
              />
            ),
            children: <p>{Tr(T.DoYouWantProceed)}</p>,
          },
          onSubmit: handleDetach,
        },
      ]}
    />
  )
})

const ActionPropTypes = {
  vmId: PropTypes.string.isRequired,
  currentNics: PropTypes.object,
  nic: PropTypes.object,
}

AttachAction.propTypes = ActionPropTypes
AttachAction.displayName = 'AttachActionButton'
DetachAction.propTypes = ActionPropTypes
DetachAction.displayName = 'DetachActionButton'

export { AttachAction, DetachAction }
