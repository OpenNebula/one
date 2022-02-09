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

import { NetworkAlt as NetworkIcon } from 'iconoir-react'

import SelectCard, { Action } from 'client/components/Cards/SelectCard'
import { LinearProgressWithLabel } from 'client/components/Status'

const NetworkCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME, USED_LEASES = '', AR_POOL } = value

    const addresses = [AR_POOL?.AR ?? []].flat()
    const totalLeases = addresses.reduce((res, ar) => +ar.SIZE + res, 0)

    const percentOfUsed = (+USED_LEASES * 100) / +totalLeases || 0
    const percentLabel = `${USED_LEASES} / ${totalLeases} (${Math.round(
      percentOfUsed
    )}%)`

    return (
      <SelectCard
        action={actions?.map((action) => (
          <Action key={action?.cy} {...action} />
        ))}
        icon={<NetworkIcon />}
        title={NAME}
        subheader={`#${ID}`}
        isSelected={isSelected}
        handleClick={handleClick}
      >
        <div style={{ padding: '2em' }}>
          <LinearProgressWithLabel value={percentOfUsed} label={percentLabel} />
        </div>
      </SelectCard>
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

NetworkCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string,
    USED_LEASES: PropTypes.string,
    AR_POOL: PropTypes.shape({
      AR: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
    }),
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.node.isRequired,
      cy: PropTypes.string,
    })
  ),
}

NetworkCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined,
}

NetworkCard.displayName = 'NetworkCard'

export default NetworkCard
