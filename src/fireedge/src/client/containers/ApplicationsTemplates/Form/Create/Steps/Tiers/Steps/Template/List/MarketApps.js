/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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

import { useGetMarketplaceAppsQuery } from 'client/features/OneApi/marketplaceApp'
import Search from 'client/components/Search'
import { SelectCard } from 'client/components/Cards'

const sortByID = (a, b) => a.ID - b.ID

const ListMarketApp = ({ backButton, currentValue, handleSetData }) => {
  const { data: apps = [] } = useGetMarketplaceAppsQuery()

  return (
    <Search
      list={apps?.sort(sortByID)}
      listOptions={{ shouldSort: true, sortFn: sortByID, keys: ['NAME'] }}
      startAdornment={backButton}
      renderResult={({ ID, NAME }) => {
        const isSelected = ID === String(currentValue)

        return (
          <SelectCard
            key={`app-${ID}`}
            title={`📦 ${NAME}`}
            isSelected={isSelected}
            handleClick={() => handleSetData(!isSelected && ID)}
          />
        )
      }}
      searchBoxProps={{
        sx: {
          display: 'flex',
          padding: '1rem 0',
          gap: 10,
        },
      }}
    />
  )
}

ListMarketApp.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleSetData: PropTypes.func,
}

ListMarketApp.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: () => undefined,
}

export default ListMarketApp
