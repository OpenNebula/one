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
import { memo, JSXElementConstructor } from 'react'

import { Skeleton } from '@material-ui/lab'
import { useMediaQuery, styled } from '@material-ui/core'

const ControlWrapper = styled('div')(({ theme }) => ({
  marginBlock: '1em',
  display: 'flex',
  justifyContent: 'end',
  gap: '1em',
  [theme.breakpoints.down('sm')]: {
    justifyContent: 'space-between',
    alignItems: 'center'
  }
}))

/**
 * Returns skeleton loader to stepper form.
 *
 * @returns {JSXElementConstructor} Skeleton loader component
 */
const SkeletonStepsForm = memo(() => {
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'))

  return (
    <div>
      <Skeleton variant='rect' height={120} width='100%' />
      <ControlWrapper>
        <Skeleton variant='rect' height={35} width={95} />
        {isMobile && <Skeleton variant='rect' height={8} width='100%' />}
        <Skeleton variant='rect' height={35} width={95} />
      </ControlWrapper>
      <Skeleton variant='rect' height={200} width='100%' />
    </div>
  )
})

SkeletonStepsForm.displayName = 'SkeletonStepsForm'

export default SkeletonStepsForm
