/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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

import {
  getNodeById,
  updateAllNodes,
  expandByPath,
  getModifiedPaths,
} from '@modules/components/List/NestedLabelTree/utils'
import { useMemo, useReducer, useRef, useCallback } from 'react'
import { buildLabelTreeState } from '@UtilsModule'

export const TOGGLE_SELECTED = 'TOGGLE_SELECTED'
export const TOGGLE_EXPANDED = 'TOGGLE_EXPANDED'
export const SET_EXPANDED_ALL = 'SET_EXPANDED_ALL'
export const SET_EXPAND_PATH = 'SET_EXPANDED_UNTIL'
export const SET_TREE = 'SET_TREE'

/**
 * @param {object} state - Current label tree state
 * @param {object} action - Dispatched action
 * @param {string} [action.type] - Action
 * @param {string} [action.nodeId] - Dot-notated path to the node
 * @param {*} [action.payload] - Optional payload
 * @returns {object} - New tree state
 */
const labelTreeReducer = (state, action) => {
  const next = structuredClone(state)
  const { nodeId, payload } = action

  switch (action.type) {
    case TOGGLE_SELECTED: {
      const node = getNodeById(next, nodeId)
      if (node) {
        if (node.indeterminate) {
          node.selected = true
          node.indeterminate = false
        } else {
          node.selected = !node.selected
        }
      }

      return next
    }

    case TOGGLE_EXPANDED: {
      const node = getNodeById(next, nodeId)
      if (node) node.expanded = !node.expanded

      return next
    }

    case SET_EXPANDED_ALL: {
      updateAllNodes(next, 'expanded', !!payload)

      return next
    }

    case SET_EXPAND_PATH: {
      expandByPath(next, nodeId)

      return next
    }
    case SET_TREE: {
      return payload
    }

    default:
      return state
  }
}

/**
 * @param {object} params - Params
 * @returns {object} - Tree state + dispatcher
 */
export const useLabelTree = (params) => {
  const initial = useMemo(() => buildLabelTreeState(params), [params])

  const initialRef = useRef(initial)

  const [treeState, dispatch] = useReducer(labelTreeReducer, initial)

  const resetInitialState = useCallback(() => {
    initialRef.current = structuredClone(treeState)
  }, [treeState])

  const actions = useMemo(
    () => ({
      toggleSelected: (nodeId) => dispatch({ type: TOGGLE_SELECTED, nodeId }),
      toggleExpanded: (nodeId) => dispatch({ type: TOGGLE_EXPANDED, nodeId }),
      setExpandedPath: (nodeId) => dispatch({ type: SET_EXPAND_PATH, nodeId }),
      setExpandedAll: (payload) =>
        dispatch({ type: SET_EXPANDED_ALL, payload }),
      setTree: (payload) => dispatch({ type: SET_TREE, payload }),
    }),
    [dispatch]
  )

  return {
    state: treeState,
    actions,
    isModified: () =>
      getModifiedPaths(treeState, initialRef.current)?.length > 0,
    getModifiedPaths: () => getModifiedPaths(treeState, initialRef.current),
    resetInitialState,
  }
}
