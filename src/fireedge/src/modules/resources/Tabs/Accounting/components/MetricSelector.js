/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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
import { Box } from '@mui/material'
import { useTranslation } from '@ProvidersModule'
import { Checkbox } from '@ComponentsV2Module'

/**
 * Sub-component used to select different metrics.
 *
 * @function
 * @param {object} props - The properties of the component.
 * @param {object} props.selectedItems - An object containing selected items with keys as item keys and values as booleans indicating selection.
 * @param {Function} props.onChange - The function to call when a metric selection changes.
 * @param {Array<object>} props.items - An array of items where each item has a key and a label.
 * @returns {object} The MetricSelector component.
 */
export const MetricSelector = ({ selectedItems, onChange, items }) => {
  const { translate } = useTranslation()

  return (
    <Box
      sx={(theme) => ({
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.scale?.[300] ? theme.scale[300] + 'px' : '12px',
      })}
    >
      {items.map((item) => (
        <Checkbox
          key={item.key}
          text={translate(item.label)}
          checked={!!selectedItems[item.key]}
          onChange={(checked) =>
            onChange({ target: { name: item.key, checked } })
          }
        />
      ))}
    </Box>
  )
}

MetricSelector.propTypes = {
  selectedItems: PropTypes.objectOf(PropTypes.bool),
  onChange: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
}

MetricSelector.defaultProps = {
  selectedItems: {},
  items: [
    { key: 'cpuHours', label: 'CPU Hours' },
    { key: 'memoryGBHours', label: 'Memory GB Hours' },
    { key: 'diskMBHours', label: 'Disk MB Hours' },
  ],
}
