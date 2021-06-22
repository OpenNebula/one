import React from 'react'
import PropTypes from 'prop-types'

import { Button } from '@material-ui/core'
import { NavArrowLeft, NavArrowRight } from 'iconoir-react'

import { T } from 'client/constants'

const Pagination = ({
  count = 0,
  handleChangePage,
  useTableProps,
  showPageCount = true
}) => {
  /** @type {import('react-table').UsePaginationState} */
  const { pageIndex, pageSize } = useTableProps.state

  const pageCount = React.useMemo(() => Math.ceil(count / pageSize), [count])

  const handleBackButtonClick = () => {
    handleChangePage(pageIndex - 1)
  }

  const handleNextButtonClick = () => {
    handleChangePage(pageIndex + 1)
  }

  return (
    <>
      <Button
        onClick={handleBackButtonClick}
        disabled={pageIndex === 0}
        aria-label='previous page'
      >
        <NavArrowLeft />
        {T.Previous}
      </Button>
      <span style={{ marginInline: '1em' }}>
        {`${pageIndex + 1} of ${showPageCount ? pageCount : 'many'}`}
      </span>
      <Button
        onClick={handleNextButtonClick}
        disabled={pageIndex >= Math.ceil(count / pageSize) - 1}
        aria-label='next page'
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
