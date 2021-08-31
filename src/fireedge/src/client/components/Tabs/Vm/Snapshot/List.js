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

import SnapshotItem from 'client/components/Tabs/Vm/Snapshot/Item'

const SnapshotList = ({ snapshots, actions }) => (
  <div style={{ display: 'grid', gap: '1em', paddingBlock: '0.8em' }}>
    {snapshots.map((snapshot, idx) => (
      <SnapshotItem key={idx} snapshot={snapshot} actions={actions} />
    ))}
  </div>
)

SnapshotList.propTypes = {
  snapshots: PropTypes.array,
  actions: PropTypes.arrayOf(PropTypes.string)
}

SnapshotList.displayName = 'SnapshotList'

export default SnapshotList
