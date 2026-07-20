/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { Suspense } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { Button, DetailsDrawer, SkeletonLoading } from '@ComponentsV2Module'
import { getResourceSingleView } from '@modules/containers/ResourceSingleView/registry'
import { getResourceName } from '@modules/containers/ResourceSingleView/stack'

const ResourceSingleViewLoading = ({ handleClose }) => (
  <Box
    role="status"
    aria-label="Loading resource details"
    aria-busy="true"
    sx={(theme) => ({
      display: 'flex',
      flex: '1 1 0',
      flexDirection: 'column',
      minHeight: 0,
      width: '100%',
      gap: `${theme.scale[550]}px`,
    })}
  >
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <SkeletonLoading loading width="40%" height={32} />
      <Button
        type={STYLE_BUTTONS.TYPE.TRANSPARENT}
        size="small"
        iconOnly={<Cancel width="16px" height="16px" />}
        tooltip={T.Close}
        onClick={handleClose}
      />
    </Box>
    <SkeletonLoading loading width="100%" height={96} />
    <Box
      sx={(theme) => ({
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
        gap: `${theme.scale[500]}px`,
      })}
    >
      <SkeletonLoading loading width="100%" height={160} />
      <SkeletonLoading loading width="100%" height={160} />
    </Box>
    <Box sx={{ flex: '1 1 0', minHeight: 0 }}>
      <SkeletonLoading loading width="100%" height="100%" />
    </Box>
  </Box>
)

ResourceSingleViewLoading.propTypes = {
  handleClose: PropTypes.func,
}

ResourceSingleViewLoading.displayName = 'ResourceSingleViewLoading'

/**
 * @param {object} root0 - Drawer properties
 * @param {object} root0.view - Active resource entry
 * @param {Function} root0.getResourceView - View configuration lookup
 * @param {Function} root0.handleClose - Close callback
 * @returns {object} Hydrated resource drawer or its loading state
 */
const ResourceSingleViewDrawer = ({
  view,
  getResourceView,
  handleClose,
  ...props
}) => {
  const resource = getResourceName(view?.resource)
  const config = getResourceSingleView(resource)

  if (!config || !view) return null

  const { Component, selectedProp, getProps } = config
  const resourceView = getResourceView?.(resource)
  const baseProps =
    getProps?.({ getResourceView, resource, resourceView }) ?? {}
  const loading = (
    <DetailsDrawer
      isOpen
      slots={[[ResourceSingleViewLoading, { handleClose }]]}
    />
  )

  if (view.isHydrating) return loading

  return (
    <Suspense fallback={loading}>
      <Component
        {...baseProps}
        {...view.props}
        {...props}
        {...{ [selectedProp]: [view.data] }}
        handleClose={handleClose}
      />
    </Suspense>
  )
}

ResourceSingleViewDrawer.propTypes = {
  view: PropTypes.shape({
    resource: PropTypes.string,
    data: PropTypes.object,
    props: PropTypes.object,
    isHydrating: PropTypes.bool,
  }),
  getResourceView: PropTypes.func,
  handleClose: PropTypes.func,
}

export { ResourceSingleViewDrawer }
