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
import { memo, useMemo, useCallback } from 'react'
import PropTypes from 'prop-types'
import { jsonToXml } from 'client/models/Helper'

import api, { useUpdateVNetMutation } from 'client/features/OneApi/network'
import { NetworkCard } from 'client/components/Cards'

const Row = memo(
  ({ original, value, onClickLabel, ...props }) => {
    const [update] = useUpdateVNetMutation()
    const {
      data: vnetworks,
      error,
      isLoading,
    } = api.endpoints.getVNetworks.useQuery(undefined)

    const vnetwork = useMemo(
      () => vnetworks?.find((vnet) => +vnet.ID === +original.ID) ?? original,
      [vnetworks, original]
    )

    const memoNetwork = useMemo(
      () => vnetwork ?? original,
      [vnetwork, original, update, isLoading, error, vnetworks]
    )
    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoNetwork.TEMPLATE?.LABELS?.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newVnetTemplate = { ...memoNetwork.TEMPLATE, LABELS: newLabels }
        const templateXml = jsonToXml(newVnetTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoNetwork.TEMPLATE?.LABELS, update]
    )

    return (
      <NetworkCard
        network={memoNetwork}
        rootProps={props}
        onClickLabel={onClickLabel}
        onDeleteLabel={handleDeleteLabel}
      />
    )
  },
  (prev, next) => prev.className === next.className
)

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func,
  onClickLabel: PropTypes.func,
}

Row.displayName = 'VirtualNetworkRow'

export default Row
