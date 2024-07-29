/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { List } from 'client/components/Tabs/Common'
import { useRenameVMGroupMutation } from 'client/features/OneApi/vmGroup'

import { T, VMGROUP_ACTIONS, VmGroup } from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VmGroup} props.template - Template
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ template = {}, actions }) => {
  const [renameTemplate] = useRenameVMGroupMutation()

  const { ID, NAME, LOCK, TEMPLATE = {} } = template
  const { DESCRIPTION } = TEMPLATE ?? ''

  const handleRename = async (_, newName) => {
    await renameTemplate({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VMGROUP_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.Locked,
      value: LOCK?.LOCKED ? 'Yes' : 'No',
      dataCy: 'locked',
    },
    DESCRIPTION && {
      name: T.Description,
      value: DESCRIPTION,
      dataCy: 'description',
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 3' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  template: PropTypes.object,
}

export default InformationPanel
