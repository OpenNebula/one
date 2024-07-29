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
import { MenuItem, Select } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'
/**
 * Render zone selector.
 *
 * @param {object} props - props
 * @param {Array} props.data - data for selector
 * @param {Function} props.handleZone - selector function
 * @param {string} props.value - value
 * @returns {ReactElement} - selector zones
 */
const SelectZones = ({ data = [], handleZone, value }) => {
  const handleChange = (event) => {
    handleZone(event.target.value)
  }

  return (
    <Select value={value} onChange={handleChange}>
      {data.map(({ ID, NAME }) => (
        <MenuItem key={ID} value={ID}>
          {NAME}
        </MenuItem>
      ))}
    </Select>
  )
}
SelectZones.propTypes = {
  data: PropTypes.array,
  handleZone: PropTypes.func,
  value: PropTypes.string,
}

SelectZones.displayName = 'SelectZones'

export default SelectZones
