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
import { JSXElementConstructor } from 'react'

import { Alert, Button, Chip, alertClasses, styled } from '@mui/material'
import { Row, TableProps } from 'react-table'

import { Translate } from 'client/components/HOC'
import { T } from 'client/constants'

const MessageStyled = styled(Alert)({
  width: '100%',
  [` .${alertClasses.message}`]: {
    padding: 0,
    width: '100%',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
  },
})

/**
 * Render all selected rows.
 *
 * @param {object} props - Props
 * @param {boolean} props.withAlert - If `true`, the list of selected rows will be an alert
 * @param {function(Row)} [props.gotoRowPage] - Function to navigate to a page of the row
 * @param {TableProps} props.useTableProps - Table props
 * @returns {JSXElementConstructor} Component JSX
 */
const GlobalSelectedRows = ({
  withAlert = false,
  useTableProps,
  gotoRowPage,
}) => {
  const {
    preFilteredRows,
    toggleAllRowsSelected,
    state: { selectedRowIds },
  } = useTableProps
  const selectedRows = preFilteredRows.filter((row) => !!selectedRowIds[row.id])
  const numberOfRowSelected = selectedRows.length
  const allSelected = numberOfRowSelected === preFilteredRows.length

  return withAlert ? (
    <MessageStyled icon={false} severity="info" variant="outlined">
      <span>
        <Translate
          word={T.NumberOfResourcesSelected}
          values={numberOfRowSelected}
        />
        {'.'}
      </span>
      <Button
        sx={{ mx: 1, p: 0.5, fontSize: 'inherit', lineHeight: 'normal' }}
        onClick={() => toggleAllRowsSelected(!allSelected)}
      >
        {allSelected ? (
          <Translate word={T.ClearSelection} />
        ) : (
          <Translate
            word={T.SelectAllResources}
            values={preFilteredRows.length}
          />
        )}
      </Button>
    </MessageStyled>
  ) : (
    <div>
      {selectedRows?.map((row) => (
        <Chip
          key={row.id}
          label={row.original?.NAME ?? row.id}
          onDelete={() => row.toggleRowSelected(false)}
          data-cy="itemSelected"
          {...(gotoRowPage && { onClick: () => gotoRowPage(row) })}
        />
      ))}
    </div>
  )
}

GlobalSelectedRows.propTypes = {
  withAlert: PropTypes.bool,
  useTableProps: PropTypes.object.isRequired,
  gotoRowPage: PropTypes.func,
}

GlobalSelectedRows.displayName = ' GlobalSelectedRows'

export default GlobalSelectedRows
