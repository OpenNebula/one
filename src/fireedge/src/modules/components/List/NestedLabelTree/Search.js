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
import { useState, useEffect, useMemo, Component } from 'react'
import PropTypes from 'prop-types'
import { TextField } from '@mui/material'
import { findNodePathByLabel } from '@modules/components/List/NestedLabelTree/utils'
import { debounce } from 'lodash'
import { T } from '@ConstantsModule'

/**
 * @param {object} props - Props
 * @param {object} props.treeState - The current tree state
 * @param {Function} props.onMatch - Callback when a node is matched (optional)
 * @returns {Component} - Label search bar
 */
export const LabelTreeSearch = ({ treeState, onMatch }) => {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = useMemo(
    () =>
      debounce((term) => {
        if (!term) return

        const matchPath = findNodePathByLabel(treeState, term)
        if (matchPath) {
          onMatch?.(matchPath.join('.'))
          scrollToNode(matchPath.join('.'))
        }
      }, 300),
    [treeState, onMatch]
  )

  useEffect(() => {
    handleSearch(searchTerm)
  }, [searchTerm])

  const scrollToNode = (nodeId) => {
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-nodeid="${nodeId}"]`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <TextField
      size="small"
      variant="outlined"
      placeholder={`${T.SearchLabels}...`}
      fullWidth
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      data-cy={'search-labels'}
      sx={{ mb: 2 }}
    />
  )
}

LabelTreeSearch.propTypes = {
  treeState: PropTypes.object,
  onMatch: PropTypes.func,
}
