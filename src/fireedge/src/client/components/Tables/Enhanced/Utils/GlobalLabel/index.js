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
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo, useState } from 'react'

import { Stack } from '@mui/material'
import SettingsIcon from 'iconoir-react/dist/LabelOutline'
import { UseFiltersInstanceProps } from 'react-table'

import { useAuth } from 'client/features/Auth'

import { Translate } from 'client/components/HOC'
import HeaderPopover from 'client/components/Header/Popover'
import Allocator from 'client/components/Tables/Enhanced/Utils/GlobalLabel/Allocator'
import FilterByLabel from 'client/components/Tables/Enhanced/Utils/GlobalLabel/Filter'
import { T } from 'client/constants'
import { areStringEqual, jsonToXml } from 'client/models/Helper'

export const LABEL_COLUMN_ID = 'label'

const toUpperCase = (label) => label?.trim()

const getLabelFromRows = (rows, flatting = true) => {
  const labels = rows
    ?.map((row) => row.values[LABEL_COLUMN_ID]?.split(',') ?? [])
    .filter(Boolean)

  return flatting
    ? labels.flat().map(toUpperCase)
    : labels.map((label) => [label].flat().filter(Boolean).map(toUpperCase))
}

const sortByFilteredFirst = (labels, filters) =>
  labels.sort((a, b) => {
    let ai = filters.indexOf(a)
    ai = ai === -1 ? filters.length + labels.indexOf(a) : ai
    let bi = filters.indexOf(b)
    bi = bi === -1 ? filters.length + labels.indexOf(b) : bi

    return ai - bi
  })

/**
 * Button to filter rows by label or assign labels to selected rows.
 *
 * @param {UseFiltersInstanceProps} props - Component props
 * @param {object[]} props.selectedRows - Selected rows
 * @param {Function} props.useUpdateMutation - Callback to update row labels
 * @returns {ReactElement} Button component
 */
const GlobalLabel = ({
  selectedRows = [],
  useUpdateMutation,
  ...tableProps
}) => {
  const { setFilter, page, state } = tableProps
  const [update, { isLoading } = {}] = useUpdateMutation?.() || []

  const [pendingValue, setPendingValue] = useState(() => [])
  const { labels: userLabels } = useAuth()

  const enableEditLabel = useMemo(
    () => useUpdateMutation && selectedRows?.length > 0,
    [useUpdateMutation, selectedRows?.length]
  )

  const unknownPageLabels = useMemo(
    () =>
      getLabelFromRows(page)
        .filter((label) => !userLabels.includes(label))
        .sort(areStringEqual),
    [page]
  )

  const currentLabelFilters = useMemo(
    () =>
      state.filters
        .filter(({ id }) => id === LABEL_COLUMN_ID)
        .map(({ value }) => value)
        .flat(),
    [state.filters]
  )

  const allFilterLabels = useMemo(() => {
    const all = [...userLabels, ...currentLabelFilters]
    const unique = [...new Set(all)]

    return sortByFilteredFirst(unique, currentLabelFilters)
  }, [userLabels, unknownPageLabels, currentLabelFilters])

  const allocatorProps = useMemo(() => {
    if (!enableEditLabel) return {}

    const selectedLabels = getLabelFromRows(selectedRows, false)
    const labels = sortByFilteredFirst(
      [...allFilterLabels],
      selectedLabels.flat()
    )

    return { selectedLabels, labels }
  }, [enableEditLabel, allFilterLabels, selectedRows])

  /**
   * Handle event when user clicks on the label filter button
   */
  const handleOpenPopover = useCallback(() => {
    if (!enableEditLabel) return setPendingValue(currentLabelFilters)

    const { labels, selectedLabels } = allocatorProps
    const labelsInEveryRows = labels.filter((l) =>
      selectedLabels.every((selected) => selected.includes(l))
    )

    // [labelsToAdd, labelsToRemove]
    setPendingValue([labelsInEveryRows, []])
  }, [enableEditLabel, currentLabelFilters, selectedRows])

  /**
   * Handle event when user clicks outside of the popover
   */
  const handleClickAwayPopover = useCallback(async () => {
    if (!enableEditLabel) return

    const [labelsToAdd, labelsToRemove] = pendingValue

    await Promise.all(
      selectedRows.map(({ original: { ID, USER_TEMPLATE, TEMPLATE } }) => {
        const template = USER_TEMPLATE ?? TEMPLATE
        const currentLabels = template?.LABELS?.split(',') ?? []
        const newLabels = currentLabels
          .map((l) => l?.trim())
          .filter((l) => labelsToRemove.indexOf(l) === -1)
          .concat(labelsToAdd)

        const uniqueLabels = [...new Set(newLabels)].join(',')
        const templateXml = jsonToXml({ ...template, LABELS: uniqueLabels })

        return update({ id: ID, template: templateXml, replace: 0 })
      })
    )
  }, [enableEditLabel, selectedRows, pendingValue, update])

  /**
   * Filter by label when click on a label.
   *
   * @param {Array} value - List of labels
   */
  const handleFilterByLabel = (value) => {
    setFilter(LABEL_COLUMN_ID, value)
  }

  return (
    <Stack direction="row" gap="0.5em" flexWrap="wrap">
      <HeaderPopover
        id="filter-by-label"
        icon={<SettingsIcon />}
        headerTitle={
          <Translate word={enableEditLabel ? T.ApplyLabels : T.FilterByLabel} />
        }
        buttonLabel={<Translate word={T.Label} />}
        buttonProps={{
          'data-cy': 'filter-by-label',
          variant: 'outlined',
          color: 'secondary',
          disabled: isLoading,
          onClick: handleOpenPopover,
        }}
        popperProps={{
          placement: 'bottom-end',
          sx: { width: { xs: '100%', md: 500 } },
        }}
        onClickAway={handleClickAwayPopover}
      >
        {({ handleClose }) =>
          enableEditLabel ? (
            <Allocator
              {...allocatorProps}
              pendingValue={pendingValue}
              handleChange={setPendingValue}
              handleClose={handleClose}
            />
          ) : (
            <FilterByLabel
              labels={allFilterLabels}
              unknownLabels={unknownPageLabels}
              pendingValue={pendingValue}
              handleChange={setPendingValue}
              handleClose={handleClose}
              handleFilterByLabel={handleFilterByLabel}
            />
          )
        }
      </HeaderPopover>
    </Stack>
  )
}

GlobalLabel.propTypes = {
  selectedRows: PropTypes.array,
  useUpdateMutation: PropTypes.func,
}

GlobalLabel.displayName = 'GlobalLabel'

export default GlobalLabel
