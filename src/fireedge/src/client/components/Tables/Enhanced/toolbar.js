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
import { JSXElementConstructor } from 'react'
import PropTypes from 'prop-types'

import { Stack, useMediaQuery } from '@mui/material'
import { UseTableInstanceProps, UseRowSelectState } from 'react-table'
import { RefreshDouble } from 'iconoir-react'

import {
  GlobalActions,
  GlobalAction,
  GlobalSelectedRows,
  GlobalSort,
} from 'client/components/Tables/Enhanced/Utils'
import { SubmitButton } from 'client/components/FormControl'
import { T } from 'client/constants'

/**
 * @param {object} props - Props
 * @param {GlobalAction[]} props.globalActions - Global actions
 * @param {boolean} props.onlyGlobalSelectedRows - Show only the selected rows
 * @param {boolean} props.disableRowSelect - Rows can't select
 * @param {boolean} props.disableGlobalSort - Hide the sort filters
 * @param {UseTableInstanceProps} props.useTableProps - Table props
 * @param {function():Promise} props.refetch - Function to refetch data
 * @param {boolean} props.isLoading - The data is fetching
 * @returns {JSXElementConstructor} Returns table toolbar
 */
const Toolbar = ({
  globalActions,
  onlyGlobalSelectedRows,
  disableGlobalSort = false,
  disableRowSelect = false,
  useTableProps,
  refetch,
  isLoading,
}) => {
  const isSmallDevice = useMediaQuery((theme) => theme.breakpoints.down('md'))

  /** @type {UseRowSelectState} */
  const { selectedRowIds } = useTableProps?.state ?? {}

  const enableGlobalSort = !isSmallDevice && !disableGlobalSort
  const enableGlobalSelect =
    !onlyGlobalSelectedRows && !!Object.keys(selectedRowIds).length

  return (
    <>
      <Stack direction="row" flexWrap="wrap" alignItems="center" gap="1em">
        {refetch && (
          <SubmitButton
            data-cy="refresh"
            icon={<RefreshDouble />}
            title={T.Tooltip}
            isSubmitting={isLoading}
            onClick={refetch}
          />
        )}
        {onlyGlobalSelectedRows && !disableRowSelect ? (
          <GlobalSelectedRows useTableProps={useTableProps} />
        ) : (
          <GlobalActions
            refetch={refetch}
            isLoading={isLoading}
            disableRowSelect={disableRowSelect}
            globalActions={globalActions}
            useTableProps={useTableProps}
          />
        )}
      </Stack>
      {(enableGlobalSort || enableGlobalSelect) && (
        <Stack
          className="summary"
          direction="row"
          flexWrap="wrap"
          alignItems="center"
          gap={'1em'}
          width={1}
        >
          {enableGlobalSort && <GlobalSort useTableProps={useTableProps} />}
          {enableGlobalSelect && (
            <GlobalSelectedRows withAlert useTableProps={useTableProps} />
          )}
        </Stack>
      )}
    </>
  )
}

Toolbar.propTypes = {
  globalActions: PropTypes.array,
  onlyGlobalSelectedRows: PropTypes.bool,
  disableRowSelect: PropTypes.bool,
  disableGlobalSort: PropTypes.bool,
  useTableProps: PropTypes.object,
  refetch: PropTypes.func,
  isLoading: PropTypes.bool,
}

export default Toolbar
