/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement } from 'react'
import PropTypes from 'prop-types'

import { Stack, Checkbox } from '@mui/material'
import { RefreshDouble } from 'iconoir-react'
import {
  UseTableInstanceProps,
  UseRowSelectState,
  UseFiltersInstanceProps,
  UseRowSelectInstanceProps,
} from 'react-table'

import {
  Action,
  GlobalAction,
} from 'client/components/Tables/Enhanced/Utils/GlobalActions/Action'
import { SubmitButton } from 'client/components/FormControl'
import { Tr } from 'client/components/HOC'
import { T } from 'client/constants'

/**
 * Render bulk actions.
 *
 * @param {object} props - Props
 * @param {function():Promise} props.refetch - Function to refetch data
 * @param {object} [props.className] - Class name for the container
 * @param {boolean} props.isLoading - The data is fetching
 * @param {boolean} props.singleSelect - If true, only one row can be selected
 * @param {boolean} props.disableRowSelect - Rows can't select
 * @param {GlobalAction[]} props.globalActions - Possible bulk actions
 * @param {UseTableInstanceProps} props.useTableProps - Table props
 * @returns {ReactElement} Component JSX with all actions
 */
const GlobalActions = ({
  refetch,
  className,
  isLoading,
  singleSelect = false,
  disableRowSelect = false,
  globalActions = [],
  useTableProps = {},
}) => {
  /** @type {UseRowSelectInstanceProps} */
  const { getToggleAllPageRowsSelectedProps, getToggleAllRowsSelectedProps } =
    useTableProps

  /** @type {UseFiltersInstanceProps} */
  const { preFilteredRows } = useTableProps

  /** @type {UseRowSelectState} */
  const { selectedRowIds } = useTableProps?.state

  const selectedRows = preFilteredRows.filter((row) => !!selectedRowIds[row.id])

  return (
    <Stack
      className={className}
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      gap="0.5em"
    >
      {refetch && (
        <SubmitButton
          data-cy="refresh"
          icon={<RefreshDouble />}
          tooltip={Tr(T.Refresh)}
          isSubmitting={isLoading}
          onClick={refetch}
        />
      )}
      {!singleSelect && !disableRowSelect && (
        <>
          <Checkbox
            {...getToggleAllPageRowsSelectedProps()}
            title={Tr(T.ToggleAllCurrentPageRowsSelected)}
            indeterminate={getToggleAllRowsSelectedProps().indeterminate}
            color="secondary"
          />
          {globalActions?.map((item, idx) => {
            const key = item.accessor ?? item.label ?? item.tooltip ?? idx

            return <Action key={key} item={item} selectedRows={selectedRows} />
          })}
        </>
      )}
    </Stack>
  )
}

GlobalActions.propTypes = {
  refetch: PropTypes.func,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  singleSelect: PropTypes.bool,
  disableRowSelect: PropTypes.bool,
  globalActions: PropTypes.array,
  useTableProps: PropTypes.object,
}

export default GlobalActions
