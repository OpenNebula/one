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

import { List } from 'client/components/Tabs/Common'

import { stringToBoolean, booleanToString } from 'client/models/Helper'
import { T, User } from 'client/constants'

/**
 * Renders mainly information tab.
 *
 * @param {object} props - Props
 * @param {User} props.user - User
 * @returns {ReactElement} Information tab
 */
const InformationPanel = ({ user = {} }) => {
  const { ID, NAME, ENABLED } = user
  const isEnabled = stringToBoolean(ENABLED)

  const info = [
    { name: T.ID, value: ID },
    { name: T.Name, value: NAME },
    { name: T.State, value: booleanToString(isEnabled) },
  ]

  return <List title={T.Information} list={info} />
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  user: PropTypes.object,
}

export default InformationPanel
