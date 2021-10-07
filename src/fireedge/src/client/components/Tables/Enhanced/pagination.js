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
/* eslint-disable jsdoc/require-jsdoc */
import { useMemo } from 'react'
import PropTypes from 'prop-types'

import { Button, Typography } from '@mui/material'
import { NavArrowLeft, NavArrowRight } from 'iconoir-react'
import { UsePaginationState } from 'react-table'

import { T } from 'client/constants'

const Pagination = ({
  count = 0,
  handleChangePage,
  useTableProps,
  showPageCount = true
}) => {
  /** @type {UsePaginationState} */
  const { pageIndex, pageSize } = useTableProps.state

  const pageCount = useMemo(() => Math.ceil(count / pageSize), [count])

  const handleBackButtonClick = () => {
    handleChangePage(pageIndex - 1)
  }

  const handleNextButtonClick = () => {
    handleChangePage(pageIndex + 1)
  }

  return (
    <>
      <Button
        aria-label='previous page'
        disabled={pageIndex === 0}
        onClick={handleBackButtonClick}
        size='small'
        color='inherit'
      >
        <NavArrowLeft />
        {T.Previous}
      </Button>
      <Typography variant='body2' component='span'>
        {`${pageIndex + 1} of ${showPageCount ? pageCount : 'many'}`}
      </Typography>
      <Button
        aria-label='next page'
        disabled={pageIndex >= Math.ceil(count / pageSize) - 1}
        onClick={handleNextButtonClick}
        size='small'
        color='inherit'
      >
        {T.Next}
        <NavArrowRight />
      </Button>
    </>
  )
}

Pagination.propTypes = {
  handleChangePage: PropTypes.func.isRequired,
  useTableProps: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  showPageCount: PropTypes.bool
}

export default Pagination
