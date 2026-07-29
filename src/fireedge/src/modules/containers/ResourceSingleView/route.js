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

import { useEffect, useRef } from 'react'
import { Redirect, useHistory, useParams } from 'react-router-dom'
import { useResourceSingleViewContext } from '@ProvidersModule'

/**
 * Creates a route component that opens a hydrated resource single view.
 *
 * @param {string} resource - Resource name
 * @param {string} listPath - Path to return to when the drawer closes
 * @param {string} displayName - Route component display name
 * @returns {Function} Resource detail route component
 */
export const createResourceDetailRoute = (resource, listPath, displayName) => {
  const ResourceDetailRoute = () => {
    const { id } = useParams()
    const history = useHistory()
    const { openResourceSingleView, stack } = useResourceSingleViewContext()
    const hasOpened = useRef(false)
    const wasVisible = useRef(false)
    const isInvalidId = Number.isNaN(+id)

    useEffect(() => {
      if (isInvalidId || hasOpened.current) return

      hasOpened.current = openResourceSingleView(resource, { ID: id })
    }, [id, isInvalidId, openResourceSingleView])

    useEffect(() => {
      if (stack.entries.length > 0) {
        wasVisible.current = true
      } else if (wasVisible.current) {
        history.push(listPath)
      }
    }, [history, listPath, stack.entries.length])

    return isInvalidId ? <Redirect to={listPath} /> : null
  }

  ResourceDetailRoute.displayName = displayName

  return ResourceDetailRoute
}
