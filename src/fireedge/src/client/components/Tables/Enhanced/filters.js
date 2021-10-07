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
import { useMemo, Fragment } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { useMediaQuery, Card, CardContent } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { UseTableInstanceProps } from 'react-table'

import { GlobalFilter } from 'client/components/Tables/Enhanced/Utils'

const useToolbarStyles = makeStyles({
  root: {
    display: 'flex'
  },
  rootNoFilters: {
    gridColumn: '1 / -1',
    '& ~ div': {
      gridColumn: '1 / -1'
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

const Filters = ({ onlyGlobalSearch, useTableProps }) => {
  const classes = useToolbarStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('md'))

  /** @type {UseTableInstanceProps} */
  const { rows, columns } = useTableProps

  const filters = useMemo(() => (
    columns
      .filter(({ canFilter }) => canFilter)
      .map((column, idx) => column.canFilter ? (
        <Fragment key={idx}>
          {column.render('Filter')}
        </Fragment>
      ) : null)
  ), [rows])

  if (isMobile || onlyGlobalSearch) {
    return (
      <GlobalFilter
        className={classes.rootNoFilters}
        useTableProps={useTableProps}
      />
    )
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
  onlyGlobalSearch: PropTypes.bool,
  useTableProps: PropTypes.object
}

Filters.defaultProps = {
  onlyGlobalSearch: false,
  useTableProps: {}
}

export default Filters
