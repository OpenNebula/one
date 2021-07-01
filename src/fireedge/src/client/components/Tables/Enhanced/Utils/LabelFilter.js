import * as React from 'react'
import PropTypes from 'prop-types'

import { Cancel, Minus, Plus } from 'iconoir-react'
import { List, ListSubheader, IconButton } from '@material-ui/core'
import { TreeView, TreeItem } from '@material-ui/lab'

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
  /** @type {import('react-table').UseFiltersInstanceProps} */
  const { setFilter, id, preFilteredRows, filterValue = [] } = column

  React.useEffect(() => () => setFilter([]), [])

  const labels = React.useMemo(() => {
    const labels = new Set()

    preFilteredRows?.forEach(row => {
      const labelsFromTemplate = row.values[id]

      labelsFromTemplate.forEach(labels.add, labels)
    })

    return [...labels.values()]
  }, [id, preFilteredRows])

  const tree = React.useMemo(() => buildTree(labels), [labels])

  const handleSelect = value =>
    setFilter([...filterValue, value])

  const handleUnselect = value =>
    setFilter(filterValue.filter(v => v !== value))

  const handleClear = () => setFilter(undefined)

  const isFiltered = React.useMemo(() => (
    filterValue?.length > 0
  ), [filterValue])

  const renderTree = ({ id, name, children }) => (
    <TreeItem key={id} nodeId={id} label={name}>
      {Array.isArray(children)
        ? children.map(node => renderTree(node)) : null}
    </TreeItem>
  )

  console.log({ filterValue })

  return (
    <List dense disablePadding>
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
