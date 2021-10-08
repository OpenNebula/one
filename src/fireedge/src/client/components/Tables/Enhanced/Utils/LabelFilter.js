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
import { useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Cancel } from 'iconoir-react'
import { List, ListSubheader, IconButton } from '@mui/material'
import { TreeView, TreeItem } from '@mui/lab'
import { UseFiltersInstanceProps } from 'react-table'

import { Tr } from 'client/components/HOC'

const buildTree = (data = [], separator = '/') => {
  const mapper = {}
  const tree = {
    id: 'root',
    name: 'Labels',
    children: []
  }

  for (const labelString of data) {
    const splits = labelString.split(separator)
    let label = ''

    splits.reduce((parent, place) => {
      if (label) {
        label += `${separator}${place}`
      } else {
        label = place
      }

      if (place && !mapper[label]) {
        const o = { id: label }
        mapper[label] = o
        mapper[label].name = place
        parent.children = parent.children || []
        parent.children.push(o)
      }

      return mapper[label]
    }, tree)
  }

  return tree
}

const LabelFilter = ({ title, column }) => {
  /** @type {UseFiltersInstanceProps} */
  const { setFilter, id, preFilteredRows, filterValue = [] } = column

  useEffect(() => () => setFilter([]), [])

  const labels = useMemo(() => {
    const labels = new Set()

    preFilteredRows?.forEach(row => {
      const labelsFromTemplate = row.values[id]

      labelsFromTemplate.forEach(labels.add, labels)
    })

    return [...labels.values()]
  }, [id, preFilteredRows])

  const tree = useMemo(() => buildTree(labels), [labels])

  const handleSelect = value =>
    setFilter([...filterValue, value])

  const handleUnselect = value =>
    setFilter(filterValue.filter(v => v !== value))

  const handleClear = () => setFilter(undefined)

  const isFiltered = useMemo(() => (
    filterValue?.length > 0
  ), [filterValue])

  const renderTree = ({ id, name, children }) => (
    <TreeItem key={id} nodeId={id} label={name}>
      {Array.isArray(children)
        ? children.map(node => renderTree(node)) : null}
    </TreeItem>
  )

  return (
    <List>
      {title && (
        <ListSubheader disableSticky disableGutters
          title={Tr(title)}
          style={{ display: 'flex', alignItems: 'center' }}
        >
          {Tr(title)}
          {isFiltered && (
            <IconButton disableRipple disablePadding size='small' onClick={handleClear}>
              <Cancel/>
            </IconButton>
          )}
        </ListSubheader>
      )}

      <TreeView
        selected={filterValue}
        defaultExpanded={['root', ...labels]}
        onNodeSelect={(evt, value) => {
          evt.preventDefault()

          filterValue.includes?.(value)
            ? handleUnselect(value)
            : handleSelect(value)
        }}
      >
        {renderTree(tree)}
      </TreeView>
    </List>
  )
}

LabelFilter.propTypes = {
  column: PropTypes.object,
  icon: PropTypes.node,
  title: PropTypes.string
}

export default LabelFilter
