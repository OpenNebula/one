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

import { Link } from '@mui/material'
import PropTypes from 'prop-types'
import { Component } from 'react'

import { useResourceSingleViewContext } from '@ProvidersModule'

/**
 * Opens a resource details drawer without leaving the current view.
 *
 * @param {object} props - Link props
 * @param {string} props.resource - Resource name
 * @param {object|string|number} props.data - Resource data or id
 * @param {object} props.viewProps - Extra props passed to the details drawer
 * @param {Component} props.children - Link content
 * @returns {Component} Resource details link
 */
export const ResourceLink = ({
  resource,
  data,
  viewProps,
  children,
  ...props
}) => {
  const { openResourceSingleView } = useResourceSingleViewContext()

  const handleClick = (event) => {
    event.preventDefault()
    event.stopPropagation()
    openResourceSingleView(resource, data, viewProps)
  }

  return (
    <Link {...props} component="button" type="button" onClick={handleClick}>
      {children}
    </Link>
  )
}

ResourceLink.propTypes = {
  resource: PropTypes.string.isRequired,
  data: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.string,
    PropTypes.number,
  ]).isRequired,
  viewProps: PropTypes.object,
  children: PropTypes.node,
}
