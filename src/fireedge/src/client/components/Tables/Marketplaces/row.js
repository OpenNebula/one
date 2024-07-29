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
import { memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import marketplaceApi from 'client/features/OneApi/marketplace'
import { MarketplaceCard } from 'client/components/Cards'

const Row = memo(
  ({ original, value, ...props }) => {
    const state = marketplaceApi.endpoints.getMarketplaces.useQueryState(
      undefined,
      {
        selectFromResult: ({ data = [] }) =>
          data.find((market) => +market?.ID === +original.ID),
      }
    )

    const memoMarket = useMemo(() => state ?? original, [state, original])

    return <MarketplaceCard market={memoMarket} rootProps={props} />
  },
  (prev, next) => prev.className === next.className
)

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  className: PropTypes.string,
  handleClick: PropTypes.func,
}

Row.displayName = 'MarketplaceRow'

export default Row
