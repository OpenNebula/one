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
import { HostCard } from 'client/components/Cards'
import hostApi, { useUpdateHostMutation } from 'client/features/OneApi/host'
import { jsonToXml } from 'client/models/Helper'
import PropTypes from 'prop-types'
import { memo, useCallback, useMemo } from 'react'

const Row = memo(
  ({ original, value, onClickLabel, zone, ...props }) => {
    const [update] = useUpdateHostMutation()

    const {
      data: hosts,
      error,
      isLoading,
    } = hostApi.endpoints.getHosts.useQuery({ zone })

    const host = useMemo(
      () => hosts?.find((h) => +h.ID === +original.ID) ?? original,
      [hosts, original]
    )

    const memoHost = useMemo(
      () => host ?? original,
      [host, original, update, isLoading, error, hosts]
    )

    const handleDeleteLabel = useCallback(
      (label) => {
        const currentLabels = memoHost?.TEMPLATE?.LABELS.split(',')
        const newLabels = currentLabels.filter((l) => l !== label).join(',')
        const newHostTemplate = { ...memoHost.TEMPLATE, LABELS: newLabels }
        const templateXml = jsonToXml(newHostTemplate)

        update({ id: original.ID, template: templateXml, replace: 0 })
      },
      [memoHost.TEMPLATE?.LABELS, update]
    )

    return (
      <HostCard
        host={memoHost}
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
  handleClick: PropTypes.func,
  onClickLabel: PropTypes.func,
  zone: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
}

Row.displayName = 'HostRow'

export default Row
