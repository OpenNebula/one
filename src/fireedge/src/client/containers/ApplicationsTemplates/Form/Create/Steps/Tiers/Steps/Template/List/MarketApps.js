import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { useOpennebula } from 'client/hooks'
import Search from 'client/components/Search'
import { SelectCard } from 'client/components/Cards'

const sortByID = (a, b) => a.ID - b.ID

const ListMarketApp = ({ backButton, currentValue, handleSetData }) => {
  const { apps, getMarketApps } = useOpennebula()

  useEffect(() => {
    getMarketApps()
  }, [])

  return (
    <Search
      list={apps?.sort(sortByID)}
      listOptions={{ shouldSort: true, sortFn: sortByID, keys: ['NAME'] }}
      startAdornment={backButton}
      renderResult={({ ID, NAME }) => {
        const isSelected = ID === String(currentValue)

        return <SelectCard
          key={`app-${ID}`}
          title={`📦 ${NAME}`}
          isSelected={isSelected}
          handleClick={() => handleSetData(!isSelected && ID)}
        />
      }}
      searchBoxProps={{
        style: {
          display: 'flex',
          padding: '1rem 0',
          gap: 10
        }
      }}
    />
  )
}

ListMarketApp.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleSetData: PropTypes.func
}

ListMarketApp.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: () => undefined
}

export default ListMarketApp
