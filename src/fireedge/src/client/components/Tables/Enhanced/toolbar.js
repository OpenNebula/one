/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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

import {
  GlobalActions,
  GlobalAction,
  ActionPropTypes,
  GlobalSelectedRows,
  GlobalSort,
} from 'client/components/Tables/Enhanced/Utils'

/**
 * @param {object} props - Props
 * @param {GlobalAction[]} props.globalActions - Global actions
 * @param {object} props.onlyGlobalSelectedRows - Show only the selected rows
 * @param {UseTableInstanceProps} props.useTableProps - Table props
 * @returns {JSXElementConstructor} Returns table toolbar
 */
const Toolbar = ({ globalActions, onlyGlobalSelectedRows, useTableProps }) => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('sm'))
  const isSmallDevice = useMediaQuery((theme) => theme.breakpoints.down('md'))

  /** @type {UseRowSelectState} */
  const { selectedRowIds } = useTableProps?.state ?? {}

  if (onlyGlobalSelectedRows) {
    return <GlobalSelectedRows useTableProps={useTableProps} />
  }

  return isMobile ? null : (
    <>
      <Stack alignItems="start" gap="1em">
        <GlobalActions
          globalActions={globalActions}
          useTableProps={useTableProps}
        />
      </Stack>
      <Stack
        className="summary"
        direction="row"
        flexWrap="wrap"
        alignItems="center"
        gap={'1em'}
        width={1}
      >
        {!isSmallDevice && (
          <div>
            <GlobalSort useTableProps={useTableProps} />
          </div>
        )}
        {!!Object.keys(selectedRowIds).length && (
          <GlobalSelectedRows withAlert useTableProps={useTableProps} />
        )}
      </Stack>
    </>
  )
}

Toolbar.propTypes = {
  globalActions: PropTypes.arrayOf(ActionPropTypes),
  onlyGlobalSelectedRows: PropTypes.bool,
  useTableProps: PropTypes.object,
}

export default Toolbar
