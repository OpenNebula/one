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
import * as React from 'react'
import PropTypes from 'prop-types'

import SchedulingItem from 'client/components/Tabs/Vm/SchedActions/Item'

const SchedulingList = ({ vmStartTime, scheduling, actions }) => (
  <div style={{ display: 'grid', gap: '1em', paddingBlock: '0.8em' }}>
    {scheduling.map((schedule, idx) => (
      <SchedulingItem
        key={idx}
        vmStartTime={vmStartTime}
        schedule={schedule}
        actions={actions}
      />
    ))}
  </div>
)

SchedulingList.propTypes = {
  vmStartTime: PropTypes.string,
  scheduling: PropTypes.array,
  actions: PropTypes.arrayOf(PropTypes.string)
}

SchedulingList.displayName = 'SchedulingList'

export default SchedulingList
