/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { forwardRef, useLayoutEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Box, Chip } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { getStyles } from '@modules/componentsv2/composed/ResourceContainer/Default/styles'
import { T, TABLE_VIEW_MODE } from '@ConstantsModule'
import { useFunctionality, useFunctionalityApi } from '@FeaturesModule'
import { SearchBar } from '@modules/componentsv2/composed/SearchBar/Default'
import { FilterPanel } from '@modules/componentsv2/composed/FilterPanel'
import { EmptyContent } from '@modules/componentsv2/composed/EmptyContent'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Checkbox } from '@modules/componentsv2/primitives/Buttons/Checkbox'
import { cleanFilterValues, getActiveFilters } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

export const ResourceContainer = forwardRef(
  (
    {
      onRefresh,
      isRefreshing,
      resourceName,
      count,
      selectedCount,
      onSelectAll,
      sortOptions,
      filterOptions,
      slots,
      extraSlots,
      viewMode,
      dataCy,
      emptyContentProps,
      children,
    },
    ref
  ) => {
    const { translate } = useTranslation()
    const {
      searchExpression,
      sortExpression,
      filterExpression,
      containerView,
      containerViewKey,
      defaultContainerView,
    } = useFunctionality()
    const {
      setSearchExpression,
      setSortExpression,
      setFilterExpression,
      setContainerView,
      setSelectedItems,
    } = useFunctionalityApi()
    const [isFilterPanelOpen, setFilterPanelOpen] = useState(false)
    const translatedResourceName = translate(resourceName)
    const viewKey = containerViewKey || resourceName

    useLayoutEffect(() => {
      setSearchExpression('')
      setSelectedItems([])
    }, [viewKey])

    const currentView = viewMode ?? containerView
    const isEmpty = count === 0 && !isRefreshing
    const hasFilters = filterOptions?.length > 0
    const filterValues = useMemo(
      () => cleanFilterValues(filterExpression),
      [filterExpression]
    )
    const activeFilters = useMemo(
      () => getActiveFilters(filterOptions, filterValues),
      [filterOptions, filterValues]
    )

    /**
     * Remove one active filter.
     *
     * @param {string} filterId - Filter identifier
     */
    const handleRemoveFilter = (filterId) => {
      const nextValues = { ...filterValues }
      delete nextValues[filterId]

      setFilterExpression(nextValues)
    }

    return (
      <Box ref={ref} data-cy={dataCy} sx={(theme) => getStyles({ theme })}>
        <SearchBar
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          refreshDataCy={dataCy ? 'refresh' : undefined}
          searchPlaceholder={`${translate(
            T.Search
          )} ${translatedResourceName}...`}
          searchDataCy={dataCy ? `search-${dataCy}` : undefined}
          searchValue={searchExpression}
          sortOptions={sortOptions}
          sortValue={sortExpression}
          viewValue={currentView}
          onSearchChange={setSearchExpression}
          onSortChange={setSortExpression}
          isEnableFilters={hasFilters}
          onFilterClick={() => setFilterPanelOpen(true)}
          onCardClick={() =>
            setContainerView(TABLE_VIEW_MODE.CARD, {
              defaultView: defaultContainerView,
              key: viewKey,
            })
          }
          onListClick={() =>
            setContainerView(TABLE_VIEW_MODE.LIST, {
              defaultView: defaultContainerView,
              key: viewKey,
            })
          }
          viewMode={viewMode}
          slots={slots}
          extraSlots={extraSlots}
        />
        {hasFilters && (
          <FilterPanel
            open={isFilterPanelOpen}
            filters={filterOptions}
            values={filterValues}
            onClose={() => setFilterPanelOpen(false)}
            onApply={setFilterExpression}
          />
        )}
        {activeFilters.length > 0 && (
          <Box className="active-filters-container">
            {activeFilters.map(({ id, label }) => (
              <Chip
                key={id}
                className="active-filter-chip"
                label={translate(label)}
                size="small"
                deleteIcon={<Cancel width="16px" height="16px" />}
                onDelete={() => handleRemoveFilter(id)}
              />
            ))}
            <Button
              type="transparent"
              size="small"
              startIcon={<Cancel width="16px" height="16px" />}
              onClick={() => setFilterExpression({})}
            >
              {`${translate(T.Clear)} ${translate(T.All)}`.trim()}
            </Button>
          </Box>
        )}
        {!isEmpty && currentView !== TABLE_VIEW_MODE.LIST && (
          <Box className="select-all-container">
            <Checkbox
              text={`${translate(T.SelectAll)} \u2022 ${
                count ?? 0
              } ${translatedResourceName}`}
              onChange={onSelectAll}
              checked={count > 0 && !isRefreshing && selectedCount === count}
              isDisabled={count <= 0 || isRefreshing}
            />
          </Box>
        )}
        {isEmpty ? (
          <Box className="empty-content-container">
            <EmptyContent {...emptyContentProps} />
          </Box>
        ) : (
          children
        )}
      </Box>
    )
  }
)

ResourceContainer.propTypes = {
  slots: PropTypes.array,
  extraSlots: PropTypes.array,
  emptyContentProps: PropTypes.object,
  children: PropTypes.node,
  onRefresh: PropTypes.func,
  onSelectAll: PropTypes.func,
  sortOptions: PropTypes.array,
  filterOptions: PropTypes.array,
  viewMode: PropTypes.oneOf(Object.values(TABLE_VIEW_MODE)),
  isRefreshing: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  resourceName: PropTypes.string,
  dataCy: PropTypes.string,
  count: PropTypes.number,
  selectedCount: PropTypes.number,
}

ResourceContainer.displayName = 'ResourceContainer'
