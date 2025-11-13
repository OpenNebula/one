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
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
import { StatusChip } from '@modules/components/Status'
import { List } from '@modules/components/Tabs/Common'
import { Driver, T, DRIVER_STATES } from '@ConstantsModule'
import { find } from 'lodash'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {Driver} props.driver - Driver resource
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ driver = {} }) => {
  const { name, description, state, source, version } = driver
  const { color: stateColor, name: stateName } =
    find(DRIVER_STATES, { name: state }) || {}

  const info = [
    {
      name: T.Name,
      value: name,
      dataCy: 'name',
    },
    {
      name: T.Description,
      value: description,
      dataCy: 'description',
    },
    {
      name: T.Version,
      value: version,
      dataCy: 'version',
    },
    {
      name: T.State,
      value: (
        <StatusChip dataCy="state" text={stateName} stateColor={stateColor} />
      ),
    },
    {
      name: T.Source,
      value: source,
      dataCy: 'source',
    },
  ]

  return (
    <>
      <List
        title={T.Information}
        list={info}
        containerProps={{ sx: { gridRow: 'span 2' } }}
      />
    </>
  )
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  driver: PropTypes.object,
}

export default InformationPanel
