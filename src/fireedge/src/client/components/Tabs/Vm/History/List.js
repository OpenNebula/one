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

import HistoryItem from 'client/components/Tabs/Vm/History/Item'

const HistoryList = ({ records, actions }) => (
  <div style={{ display: 'grid', gap: '1em', paddingBlock: '0.8em' }}>
    {records.map((history, idx) => (
      <HistoryItem key={idx} history={history} actions={actions} />
    ))}
  </div>
)

HistoryList.propTypes = {
  records: PropTypes.array,
  actions: PropTypes.arrayOf(PropTypes.string),
}

HistoryList.displayName = 'HistoryList'

export default HistoryList
