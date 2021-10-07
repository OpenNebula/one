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
import { memo, useContext } from 'react'
import PropTypes from 'prop-types'

import { Trash, UndoAction } from 'iconoir-react'

import { useVmApi } from 'client/features/One'
import { TabContext } from 'client/components/Tabs/TabProvider'
import ButtonToTriggerForm from 'client/components/Forms/ButtonToTriggerForm'

import { Tr, Translate } from 'client/components/HOC'
import { T, VM_ACTIONS } from 'client/constants'

const RevertAction = memo(({ snapshot }) => {
  const { SNAPSHOT_ID, NAME } = snapshot
  const { revertSnapshot } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleRevert = async () => await revertSnapshot(vm.ID, SNAPSHOT_ID)

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_REVERT}-${SNAPSHOT_ID}`,
        icon: <UndoAction />
      }}
      options={[{
        isConfirmDialog: true,
        dialogProps: {
          title: <Translate word={T.RevertSomething} values={`#${SNAPSHOT_ID} - ${NAME}`} />,
          children: <p>{Tr(T.DoYouWantProceed)}</p>
        },
        onSubmit: handleRevert
      }]}
    />
  )
})

const DeleteAction = memo(({ snapshot }) => {
  const { SNAPSHOT_ID, NAME } = snapshot
  const { deleteSnapshot } = useVmApi()
  const { data: vm } = useContext(TabContext)

  const handleDelete = async () => await deleteSnapshot(vm.ID, SNAPSHOT_ID)

  return (
    <ButtonToTriggerForm
      buttonProps={{
        'data-cy': `${VM_ACTIONS.SNAPSHOT_DELETE}-${SNAPSHOT_ID}`,
        icon: <Trash />
      }}
      options={[{
        isConfirmDialog: true,
        dialogProps: {
          title: <Translate word={T.DeleteSomething} values={`#${SNAPSHOT_ID} - ${NAME}`} />,
          children: <p>{Tr(T.DoYouWantProceed)}</p>
        },
        onSubmit: handleDelete
      }]}
    />
  )
})

const ActionPropTypes = {
  snapshot: PropTypes.object,
  name: PropTypes.string
}

RevertAction.propTypes = ActionPropTypes
RevertAction.displayName = 'RevertActionButton'
DeleteAction.propTypes = ActionPropTypes
DeleteAction.displayName = 'DeleteActionButton'

export {
  DeleteAction,
  RevertAction
}
