/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'
import { ViewGrid as VmIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { StatusBadge } from 'client/components/Status'
import { getState } from 'client/models/VirtualMachine'

const VirtualMachineCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME } = value
    const { color, name } = getState(value) ?? {}

    return (
      <SelectCard
        action={actions?.map((action) => (
          <Action key={action?.cy} {...action} />
        ))}
        skeletonHeight={75}
        dataCy={`vm-${ID}`}
        handleClick={handleClick}
        icon={
          <StatusBadge title={name} stateColor={color}>
            <VmIcon />
          </StatusBadge>
        }
        isSelected={isSelected}
        subheader={`#${ID}`}
        title={NAME}
      />
    )
  },
  (prev, next) =>
    prev.isSelected === next.isSelected &&
    prev.value.STATE === next.value.STATE &&
    prev.value?.LCM_STATE === next.value?.LCM_STATE
)

VirtualMachineCard.propTypes = {
  handleClick: PropTypes.func,
  isSelected: PropTypes.bool,
  value: PropTypes.object,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      cy: PropTypes.string,
    })
  ),
}

VirtualMachineCard.defaultProps = {
  handleClick: undefined,
  isSelected: false,
  value: {},
  actions: undefined,
}

VirtualMachineCard.displayName = 'VirtualMachineCard'

export default VirtualMachineCard
