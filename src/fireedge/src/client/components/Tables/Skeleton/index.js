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
import { memo } from 'react'
import PropTypes from 'prop-types'
import { useMediaQuery, Card, Skeleton } from '@mui/material'

import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'
import { rowStyles } from 'client/components/Tables/styles'

const SkeletonCategory = ({ numberOfItems = 1 }) => (
  <>
    <Skeleton width={'30%'} height={40} />
    {[...new Array(numberOfItems)].map((_, idx) => (
      <Skeleton key={idx} width={'80%'} height={40} />
    ))}
  </>
)

SkeletonCategory.propTypes = {
  numberOfItems: PropTypes.number,
}

const SkeletonTable = memo(() => {
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'))
  const classes = EnhancedTableStyles()
  const rowClasses = rowStyles()

  const SkeletonRow = () => (
    <Card sx={{ p: '1em' }}>
      <div className={rowClasses.main}>
        <div className={rowClasses.title}>
          <Skeleton width={'40%'} height={30} />
        </div>
        <div className={rowClasses.caption}>
          <Skeleton width={'10%'} height={20} />
          <Skeleton width={'10%'} height={20} />
          <Skeleton width={'10%'} height={20} />
        </div>
      </div>
    </Card>
  )

  return (
    <div className={classes.root}>
      <div className={classes.toolbar}>
        {!isMobile && (
          <Skeleton variant="rectangular" height={35} width={100} />
        )}
        <div className={classes.pagination}>
          <Skeleton variant="rectangular" height={35} width={85} />
          <Skeleton variant="rectangular" height={35} width={85} />
          <Skeleton variant="rectangular" height={35} width={85} />
        </div>
      </div>
      <div className={classes.table}>
        {isMobile ? (
          <Skeleton variant="rectangular" height={40} sx={{ mb: '1em' }} />
        ) : (
          <Card variant="outlined" sx={{ p: '1em' }}>
            <Skeleton variant="rectangular" height={40} sx={{ mb: '1em' }} />
            <div>
              <SkeletonCategory />
              <SkeletonCategory numberOfItems={3} />
            </div>
          </Card>
        )}
        <div className={classes.body}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    </div>
  )
})

SkeletonTable.displayName = 'SkeletonTable'

export default SkeletonTable
