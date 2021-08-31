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
import PropTypes from 'prop-types'

import { makeStyles, useMediaQuery } from '@material-ui/core'

import { GlobalSelectedRows, GlobalSort } from 'client/components/Tables/Enhanced/Utils'

const useToolbarStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'start',
    gap: '1em'
  }
})

const Toolbar = ({ onlyGlobalSelectedRows = false, useTableProps = {} }) => {
  const classes = useToolbarStyles()
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))

  if (onlyGlobalSelectedRows) {
    return <GlobalSelectedRows useTableProps={useTableProps} />
  }

  return isMobile ? null : (
    <div className={classes.root}>
      <GlobalSort useTableProps={useTableProps} />
    </div>
  )
}

Toolbar.propTypes = {
  onlyGlobalSelectedRows: PropTypes.bool,
  useTableProps: PropTypes.object
}

export default Toolbar
