import * as React from 'react'

import { Skeleton } from '@material-ui/lab'
import { useMediaQuery, Card } from '@material-ui/core'

import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'
import { rowStyles } from 'client/components/Tables/styles'

const SkeletonTable = React.memo(() => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))
  const classes = EnhancedTableStyles()
  const rowClasses = rowStyles()

  const SkeletonCategory = ({ numberOfItems = 1 }) => (
    <>
      <Skeleton width={'30%'} height={40} />
      {[...new Array(numberOfItems)].map((_, idx) => (
        <Skeleton key={idx} width={'80%'} height={40} />
      ))}
    </>
  )

  const SkeletonRow = () => (
    <Card style={{ padding: '1em' }}>
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
        {!isMobile && <Skeleton variant='rect' height={35} width={100} />}
        <div className={classes.pagination}>
          <Skeleton variant='rect' height={35} width={85} />
          <Skeleton variant='rect' height={35} width={85} />
          <Skeleton variant='rect' height={35} width={85} />
        </div>
      </div>
      <div className={classes.table}>
        {isMobile ? (
          <Skeleton variant='rect' height={40} style={{ marginBottom: '1em' }} />
        ) : (
          <Card variant='outlined' style={{ padding: '1em' }}>
            <Skeleton variant='rect' height={40} style={{ marginBottom: '1em' }} />
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
