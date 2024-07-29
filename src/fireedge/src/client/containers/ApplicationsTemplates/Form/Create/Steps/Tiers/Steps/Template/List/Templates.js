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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { useGetTemplatesQuery } from 'client/features/OneApi/vmTemplate'
import Search from 'client/components/Search'
import { SelectCard } from 'client/components/Cards'

const sortByID = (a, b) => a.ID - b.ID

const ListTemplates = ({ backButton, currentValue, handleSetData }) => {
  const { data: templates = [] } = useGetTemplatesQuery()

  return (
    <Search
      list={templates?.sort(sortByID)}
      listOptions={{ shouldSort: true, sortFn: sortByID, keys: ['NAME'] }}
      startAdornment={backButton}
      renderResult={({ ID, NAME }) => {
        const isSelected = ID === String(currentValue)

        return (
          <SelectCard
            key={`tmp-${ID}`}
            title={`📁 ${NAME}`}
            isSelected={isSelected}
            handleClick={() => handleSetData(!isSelected && ID)}
          />
        )
      }}
      searchBoxProps={{
        style: {
          display: 'flex',
          padding: '1rem 0',
          gap: 10,
        },
      }}
    />
  )
}

ListTemplates.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleSetData: PropTypes.func,
}

ListTemplates.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: () => undefined,
}

export default ListTemplates
