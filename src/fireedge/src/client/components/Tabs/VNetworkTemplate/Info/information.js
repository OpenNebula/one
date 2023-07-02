/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import { useRenameVNTemplateMutation } from 'client/features/OneApi/networkTemplate'
import { List } from 'client/components/Tabs/Common'
import { T, VNetworkTemplate, VN_TEMPLATE_ACTIONS } from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {VNetworkTemplate} props.vnetTemplate - Virtual network template resource
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ vnetTemplate = {}, actions }) => {
  const [rename] = useRenameVNTemplateMutation()
  const { ID, NAME } = vnetTemplate

  const handleRename = async (_, newName) => {
    await rename({ id: ID, name: newName })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      dataCy: 'name',
      canEdit: actions?.includes?.(VN_TEMPLATE_ACTIONS.RENAME),
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
  vnetTemplate: PropTypes.object,
  actions: PropTypes.arrayOf(PropTypes.string),
}

InformationPanel.displayName = 'InformationPanel'

export default InformationPanel
