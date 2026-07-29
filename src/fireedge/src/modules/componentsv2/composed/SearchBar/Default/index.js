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

import { forwardRef, Component } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/composed/SearchBar/Default/styles'
import {
  SearchSlot,
  SortSlot,
  FilterSlot,
  ViewSlot,
  RefreshSlot,
} from '@modules/componentsv2/composed/SearchBar/Default/slots'
import { T, TABLE_VIEW_MODE } from '@ConstantsModule'

/**
 * SearchBar component.
 *
 * @param {object} root0 - Params
 * @param {Array} root0.slots - Component slots
 * @param {Array} root0.extraSlots - Extra component slots appended to the default slots
 * @param {Function} root0.onRefresh - Refresh handler
 * @param {boolean} root0.isRefreshing - Disable refresh while refreshing
 * @param {boolean} root0.isEnableSearchBar - Whether to display the search input
 * @param {boolean} root0.isEnableFilters - Whether to display the filters button
 * @param {boolean} root0.isEnableSort - Whether to display the sort button
 * @param {boolean} root0.isEnableView - Whether to display the view selector
 * @param {string} root0.searchPlaceholder - Search input placeholder
 * @param {string} root0.searchValue - Current search value
 * @param {object} root0.sortValue - Current sort value
 * @param {string} root0.viewValue - Current view value
 * @param {Function} root0.onSearchChange - Search change handler
 * @param {Function} root0.onSortChange - Sort change handler
 * @param {Function} root0.onFilterClick - Filter click handler
 * @param {Function} root0.onCardClick - Card view click handler
 * @param {Function} root0.onListClick - List view click handler
 * @returns {Component} - SearchBar component
 */
export const SearchBar = forwardRef(
  (
    {
      slots,
      extraSlots = [],
      onRefresh,
      isRefreshing,
      isEnableSearchBar = true,
      isEnableFilters = true,
      isEnableSort = true,
      isEnableView = true,
      searchPlaceholder = T.Search,
      searchDataCy,
      refreshDataCy,
      searchValue = '',
      sortOptions = [],
      sortValue = null,
      viewValue = TABLE_VIEW_MODE.CARD,
      onSearchChange,
      onSortChange,
      onFilterClick,
      onCardClick,
      onListClick,
      viewMode,
    },
    ref
  ) => {
    const handleSearchChange = (value) => {
      onSearchChange?.(value)
    }

    const handleSortChange = (option) => {
      if (!option) {
        onSortChange?.(Array.isArray(sortValue) ? [] : null)

        return
      }

      const optionValue =
        typeof option === 'object' ? option?.value ?? option?.text : option
      const value = Array.isArray(sortValue)
        ? sortValue?.[0]?.id
        : typeof sortValue === 'object'
        ? sortValue?.value ?? sortValue?.text
        : sortValue
      const currentDesc = Array.isArray(sortValue)
        ? !!sortValue?.[0]?.desc
        : typeof sortValue === 'object'
        ? !!sortValue?.desc
        : false
      const isCurrentOption =
        value != null && String(optionValue) === String(value)

      if (isCurrentOption && currentDesc) {
        onSortChange?.(Array.isArray(sortValue) ? [] : null)

        return
      }

      const nextDesc = isCurrentOption ? !currentDesc : false

      if (Array.isArray(sortValue)) {
        onSortChange?.([{ id: optionValue, desc: nextDesc }])

        return
      }

      onSortChange?.({
        ...(typeof option === 'object'
          ? option
          : { text: option, value: optionValue }),
        desc: nextDesc,
      })
    }

    const handleCardClick = () => {
      onCardClick?.()
    }

    const handleListClick = () => {
      onListClick?.()
    }

    const selectedSortValue =
      sortOptions?.find((option) => {
        const optionValue =
          typeof option === 'object' ? option?.value ?? option?.text : option
        const value = Array.isArray(sortValue)
          ? sortValue?.[0]?.id
          : typeof sortValue === 'object'
          ? sortValue?.value ?? sortValue?.text
          : sortValue

        return value != null && String(optionValue) === String(value)
      }) ?? null
    const selectedSortDesc = Array.isArray(sortValue)
      ? !!sortValue?.[0]?.desc
      : typeof sortValue === 'object'
      ? !!sortValue?.desc
      : false

    const defaultSlots = []

    if (onRefresh) {
      defaultSlots.push([
        RefreshSlot,
        {
          onRefresh: onRefresh,
          isRefreshing: isRefreshing,
          dataCy: refreshDataCy,
        },
        { flex: '0 1 auto' },
      ])
    }

    if (isEnableSearchBar) {
      defaultSlots.push([
        SearchSlot,
        {
          onChange: handleSearchChange,
          placeholder: searchPlaceholder,
          dataCy: searchDataCy,
          value: searchValue,
        },
        { flex: 10 },
      ])
    }

    if (isEnableSort) {
      defaultSlots.push([
        SortSlot,
        {
          onChange: handleSortChange,
          placeholder: T.Sort,
          options: sortOptions,
          initialValue: selectedSortValue,
          sortDesc: selectedSortDesc,
        },
        { flex: '0 0 auto' },
      ])
    }

    if (isEnableFilters) {
      defaultSlots.push([
        FilterSlot,
        { onClick: onFilterClick },
        { flex: '0 0 auto' },
      ])
    }

    if (isEnableView && viewMode === undefined) {
      defaultSlots.push([
        ViewSlot,
        {
          defaultView: viewValue || TABLE_VIEW_MODE.CARD,
          onCardClick: handleCardClick,
          onListClick: handleListClick,
        },
        { flex: '0 0 auto' },
      ])
    }

    const activeSlots = [...(slots ?? defaultSlots), ...extraSlots]

    if (activeSlots.length === 0) return null

    return (
      <Box
        sx={(theme) =>
          getStyles({
            theme,
          })
        }
        ref={ref}
      >
        <Box className="searchbar-slots">
          {activeSlots.map(([Slot, slotProps = {}, containerSx = {}], idx) => (
            <Box
              key={idx}
              className={`searchbar-slot searchbar-slot--${idx}`}
              sx={{
                display: 'flex',
                flex: '1 0 0',
                height: '100%',
                minWidth: 0,
                ...containerSx,
              }}
            >
              <Slot {...slotProps} />
            </Box>
          ))}
        </Box>
      </Box>
    )
  }
)

SearchBar.propTypes = {
  slots: PropTypes.array,
  extraSlots: PropTypes.array,
  onRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool,
  isEnableSearchBar: PropTypes.bool,
  isEnableFilters: PropTypes.bool,
  isEnableSort: PropTypes.bool,
  isEnableView: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  searchDataCy: PropTypes.string,
  refreshDataCy: PropTypes.string,
  searchValue: PropTypes.string,
  sortOptions: PropTypes.array,
  sortValue: PropTypes.any,
  viewValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onSortChange: PropTypes.func,
  onFilterClick: PropTypes.func,
  onCardClick: PropTypes.func,
  onListClick: PropTypes.func,
  viewMode: PropTypes.oneOf(Object.values(TABLE_VIEW_MODE)),
}

SearchBar.displayName = 'SearchBar'
