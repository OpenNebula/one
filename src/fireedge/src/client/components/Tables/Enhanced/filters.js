import * as React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { makeStyles, useMediaQuery, Card, CardContent } from '@material-ui/core'

import GlobalFilter from 'client/components/Tables/Enhanced/Utils/GlobalFilter'

const useToolbarStyles = makeStyles({
  root: {
    display: 'flex'
  },
  rootNoFilters: {
    gridColumn: '1/3',
    '& ~ div': {
      gridColumn: '1/3'
    }
  },
  content: {
    flexGrow: 1
  },
  contentWithFilter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1em'
  },
  filters: {
    flexGrow: 1,
    overflow: 'auto'
  }
})

const Filters = ({ useTableProps }) => {
  const classes = useToolbarStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))

  /** @type {import('react-table').UseTableInstanceProps} */
  const { rows, columns } = useTableProps

  const filters = React.useMemo(() => (
    columns
      .filter(({ canFilter }) => canFilter)
      .map((column, idx) => column.canFilter ? (
        <React.Fragment key={idx}>
          {column.render('Filter')}
        </React.Fragment>
      ) : null)
  ), [rows])

  if (isMobile) {
    return <GlobalFilter useTableProps={useTableProps} />
  }

  const noFilters = filters.length === 0

  return (
    <Card variant='outlined'
      className={clsx(classes.root, { [classes.rootNoFilters]: noFilters })}
    >
      <CardContent
        className={clsx(classes.content, { [classes.contentWithFilter]: !noFilters })}
      >
        <GlobalFilter useTableProps={useTableProps} />

        {!noFilters && <div className={classes.filters}>{filters}</div>}
      </CardContent>
    </Card>
  )
}

Filters.propTypes = {
  useTableProps: PropTypes.object
}

Filters.defaultProps = {
  useTableProps: {}
}

export default Filters
