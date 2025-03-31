/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import { Button, MenuItem, Select, Tooltip, Typography } from '@mui/material'
import { NavArrowLeft, NavArrowRight } from 'iconoir-react'
import { UsePaginationState } from 'opennebula-react-table'

import { PAGINATION_SIZES, T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

const Pagination = ({
  count = 0,
  handleChangePage,
  useTableProps,
  showPageCount = true,
  styles,
}) => {
  /** @type {UsePaginationState} */
  const { pageIndex, pageSize } = useTableProps.state

  const handleBackButtonClick = () => {
    handleChangePage(pageIndex - 1)
  }

  const handleNextButtonClick = () => {
    handleChangePage(pageIndex + 1)
  }

  const startItem = pageIndex * pageSize + 1
  const endItem = Math.min((pageIndex + 1) * pageSize, count)

  return (
    <div className={styles.pagination}>
      {useTableProps?.setPageSize && (
        <>
          <Typography className={styles.paginationText}>
            {`${Tr(T.RowsPerPage)}`}
          </Typography>
          <Tooltip
            title={Tr(T.NumberPerPage)}
            arrow
            placement="top"
            disableInteractive
            className={styles.left}
          >
            <Select
              value={pageSize}
              size="small"
              style={{ width: 'auto' }}
              sx={(theme) => ({
                ...theme.typography.body2,
                '& .MuiSelect-select': {
                  paddingTop: '0px',
                  paddingBottom: '0px',
                  border: 'none',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              })}
              onChange={(e) =>
                useTableProps.setPageSize(Number(e.target.value))
              }
            >
              {PAGINATION_SIZES.map((size) => (
                <MenuItem key={size} value={size}>
                  {size}
                </MenuItem>
              ))}
            </Select>
          </Tooltip>
        </>
      )}
      {showPageCount && (
        <>
          <Typography className={styles.paginationText}>
            {`${startItem}-${endItem} ${Tr(T.Of)} ${count}`}
          </Typography>
          <Button
            aria-label="previous page"
            disabled={pageIndex === 0}
            onClick={handleBackButtonClick}
            size="small"
            color="inherit"
            className={styles.paginationArrow}
          >
            <NavArrowLeft />
          </Button>
          <Button
            aria-label="next page"
            disabled={pageIndex >= Math.ceil(count / pageSize) - 1}
            onClick={handleNextButtonClick}
            size="small"
            color="inherit"
            sx={{ minWidth: '1.5rem', height: '1.5rem', padding: '0.5rem' }}
            className={styles.paginationArrow}
          >
            <NavArrowRight />
          </Button>
        </>
      )}
    </div>
  )
}

Pagination.propTypes = {
  className: PropTypes.string,
  handleChangePage: PropTypes.func.isRequired,
  useTableProps: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  showPageCount: PropTypes.bool,
  styles: PropTypes.object,
}

export default Pagination
