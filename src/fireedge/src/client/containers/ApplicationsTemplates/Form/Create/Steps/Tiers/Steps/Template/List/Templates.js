import React, { useEffect } from 'react'
import PropTypes from 'prop-types'

import { useVmTemplate, useVmTemplateApi } from 'client/features/One'
import Search from 'client/components/Search'
import { SelectCard } from 'client/components/Cards'

const sortByID = (a, b) => a.ID - b.ID

const ListTemplates = ({ backButton, currentValue, handleSetData }) => {
  const templates = useVmTemplate()
  const { getTemplates } = useVmTemplateApi()

  useEffect(() => {
    getTemplates()
  }, [])

  return (
    <Search
      list={templates?.sort(sortByID)}
      listOptions={{ shouldSort: true, sortFn: sortByID, keys: ['NAME'] }}
      startAdornment={backButton}
      renderResult={({ ID, NAME }) => {
        const isSelected = ID === String(currentValue)

        return <SelectCard
          key={`tmp-${ID}`}
          title={`📁 ${NAME}`}
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

ListTemplates.propTypes = {
  backButton: PropTypes.node,
  currentValue: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  handleSetData: PropTypes.func
}

ListTemplates.defaultProps = {
  backButton: null,
  currentValue: undefined,
  handleSetData: () => undefined
}

export default ListTemplates
