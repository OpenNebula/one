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

import { List } from '@modules/components/Tabs/Common'
import { ProviderAPI } from '@FeaturesModule'

import { timeToString } from '@ModelsModule'
import { T, Provider, PROVIDER_ACTIONS } from '@ConstantsModule'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Provider} props.provider - Provider
 * @param {string[]} props.actions - Available actions to information tab
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ provider = {}, actions }) => {
  const [renameTemplate] = ProviderAPI.useRenameProviderMutation()

  const {
    ID,
    NAME,
    TEMPLATE: {
      PROVIDER_BODY: { description, registration_time: regTime } = {},
    },
  } = provider || {}

  const handleRename = async (_, newName) => {
    await renameTemplate({ id: ID, template: { name: newName } })
  }

  const info = [
    { name: T.ID, value: ID, dataCy: 'id' },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(PROVIDER_ACTIONS.RENAME),
      handleEdit: handleRename,
      dataCy: 'name',
    },
    {
      name: T.Description,
      value: description,
      dataCy: 'description',
    },
    {
      name: T.StartTime,
      value: timeToString(regTime),
      dataCy: 'time',
    },
  ].filter(Boolean)

  return (
    <List
      title={T.Information}
      list={info}
      containerProps={{ sx: { gridRow: 'span 2' } }}
    />
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  provider: PropTypes.object,
}

export default InformationPanel
