/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { ProviderCard } from '@modules/components/Cards'
import PropTypes from 'prop-types'
import { memo, useMemo } from 'react'
import { oneApi } from '@FeaturesModule'

const Row = memo(
  ({
    original,
    value,
    onClickLabel,
    zone,
    headerList,
    rowDataCy,
    isSelected,
    toggleRowSelected,
    ...props
  }) => {
    const state = oneApi.endpoints.getProviders.useQueryState(undefined, {
      selectFromResult: ({ data = [] }) =>
        data.find((provider) => +provider.ID === +original.ID),
    })

    const memoTemplate = useMemo(() => state ?? original, [state, original])

    return <ProviderCard provider={memoTemplate} rootProps={props} />
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
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

Row.displayName = 'ProviderRow'

export default Row
