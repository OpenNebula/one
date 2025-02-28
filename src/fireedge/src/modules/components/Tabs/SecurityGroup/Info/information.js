/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { SecurityGroupAPI } from '@FeaturesModule'
import { List } from '@modules/components/Tabs/Common'
import { T, Image, SEC_GROUP_ACTIONS } from '@ConstantsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Image} props.securityGroup - Security Group resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ securityGroup = {}, actions }) => {
  const [rename] = SecurityGroupAPI.useRenameSecGroupMutation()

  const { ID, NAME } = securityGroup

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit: actions?.includes?.(SEC_GROUP_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
  ]

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 3' } }}
      />
    </>
  )
}

InformationPanel.propTypes = {
  securityGroup: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
