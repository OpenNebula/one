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

import { List } from 'client/components/Tabs/Common'

import * as Helper from 'client/models/Helper'
import { T, VM_TEMPLATE_ACTIONS } from 'client/constants'

const InformationPanel = ({ template = {}, handleRename, actions }) => {
  const { ID, NAME, REGTIME, LOCK } = template

  const info = [
    { name: T.ID, value: ID },
    {
      name: T.Name,
      value: NAME,
      canEdit: actions?.includes?.(VM_TEMPLATE_ACTIONS.RENAME),
      handleEdit: handleRename,
    },
    {
      name: T.StartTime,
      value: Helper.timeToString(REGTIME),
    },
    {
      name: T.Locked,
      value: Helper.levelLockToString(LOCK?.LOCKED),
    },
  ]

  return <List title={T.Information} list={info} />
}

InformationPanel.displayName = 'InformationPanel'

InformationPanel.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.string),
  handleRename: PropTypes.func,
  template: PropTypes.object,
}

export default InformationPanel
