import React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, IconButton } from '@material-ui/core'

import {
  FastArrowLeft as FirstPageIcon,
  NavArrowLeft as PreviousPageIcon,
  NavArrowRight as NextPageIcon,
  FastArrowRight as LastPageIcon
} from 'iconoir-react'

const useStyles = makeStyles(theme => ({
  root: {
    margin: '10px auto'
  }
}))

const Pagination = ({
  count = 0,
  handleChangePage,
  useTableProps,
  showPageCount = true
}) => {
  const classes = useStyles()

  /** @type {import('react-table').UsePaginationState} */
  const { pageIndex, pageSize } = useTableProps.state

  const pageCount = React.useMemo(() => Math.ceil(count / pageSize), [count])

  const handleFirstPageButtonClick = () => {
    handleChangePage(0)
  }

  const handleBackButtonClick = () => {
    handleChangePage(pageIndex - 1)
  }

  const handleNextButtonClick = () => {
    handleChangePage(pageIndex + 1)
  }

  const handleLastPageButtonClick = () => {
    handleChangePage(Math.max(0, pageCount - 1))
  }

  return (
    <div className={classes.root}>
      {/*       <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={pageIndex === 0}
        aria-label="first page"
      >
        <FirstPageIcon />
      </IconButton> */}
      <IconButton
        onClick={handleBackButtonClick}
        disabled={pageIndex === 0}
        aria-label="previous page"
      >
        <PreviousPageIcon />
      </IconButton>
      {showPageCount &&
        <span style={{ marginInline: '1em' }}>
          {`${pageIndex + 1} / ${pageCount}`}
        </span>
      }
      <IconButton
        onClick={handleNextButtonClick}
        disabled={pageIndex >= Math.ceil(count / pageSize) - 1}
        aria-label="next page"
      >
        <NextPageIcon />
      </IconButton>
      {/*       <IconButton
        onClick={handleLastPageButtonClick}
        disabled={pageIndex >= Math.ceil(count / pageSize) - 1}
        aria-label="last page"
      >
        <LastPageIcon />
      </IconButton> */}
    </div>
  )
}

Pagination.propTypes = {
  handleChangePage: PropTypes.func.isRequired,
  useTableProps: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  showPageCount: PropTypes.bool
}

export default Pagination
