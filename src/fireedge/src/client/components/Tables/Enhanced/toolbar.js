import * as React from 'react'
import PropTypes from 'prop-types'

import { makeStyles, useMediaQuery } from '@material-ui/core'

import GlobalSort from 'client/components/Tables/Enhanced/Utils/GlobalSort'

const useToolbarStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    gap: '1em'
  }
})

const Toolbar = ({ useTableProps }) => {
  const classes = useToolbarStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))

  return (
    <div className={classes.root}>
      {!isMobile && <GlobalSort useTableProps={useTableProps} />}
    </div>
  )
}

Toolbar.propTypes = {
  useTableProps: PropTypes.object
}

Toolbar.defaultProps = {
  useTableProps: {}
}

export default Toolbar
