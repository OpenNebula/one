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
import * as React from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import { makeStyles, List as MList, ListItem, Typography, Paper } from '@material-ui/core'

import { Attribute, AttributePropTypes } from 'client/components/Tabs/Common/Attribute'
import AttributeCreateForm from 'client/components/Tabs/Common/AttributeCreateForm'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles(theme => ({
  title: {
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.palette.divider}`
  },
  item: {
    gap: '1em',
    '& > *': {
      flex: '1 1 50%',
      overflow: 'hidden'
    }
  },
  typo: theme.typography.body2
}))

const AttributeList = ({
  title,
  list = [],
  handleAdd,
  containerProps = {},
  itemProps = {},
  listProps = {},
  subListProps = {}
}) => {
  const classes = useStyles()
  const { className: itemClassName, ...restOfItemProps } = itemProps

  const renderList = (attribute, parentPath = false) => {
    const { name, value } = attribute
    const isParent = typeof value === 'object' && !React.isValidElement(value)

    return (
      <>
        <ListItem
          key={`${title}.${parentPath || name}`}
          className={clsx(classes.item, itemClassName)}
          {...restOfItemProps}
        >
          <Attribute
            path={parentPath || name}
            {...attribute}
            { ...(isParent && { canEdit: false, value: undefined })}
          />
        </ListItem>
        {isParent && (
          <MList {...subListProps}>
            {Object.entries(value).map(([childName, childValue]) => {
              const subAttributeProps = { ...attribute, name: childName, value: childValue }
              const attributePath = `${parentPath || name}.${childName}`

              return renderList(subAttributeProps, attributePath)
            })}
          </MList>
        )}
      </>
    )
  }

  return (
    <Paper variant='outlined' {...containerProps}>
      <MList {...listProps}>
        {/* TITLE */}
        {title && (
          <ListItem className={classes.title}>
            <Typography noWrap>
              {Tr(title)}
            </Typography>
          </ListItem>
        )}
        {/* LIST */}
        {list.map(attr => renderList(attr))}
        {/* ADD ACTION */}
        {handleAdd && (
          <ListItem className={classes.item}>
            <AttributeCreateForm handleAdd={handleAdd} />
          </ListItem>
        )}
      </MList>
    </Paper>
  )
}

AttributeList.propTypes = {
  containerProps: PropTypes.object,
  handleAdd: PropTypes.oneOfType([
    PropTypes.func,
    PropTypes.bool
  ]),
  itemProps: PropTypes.object,
  title: PropTypes.any,
  list: PropTypes.arrayOf(
    PropTypes.shape(AttributePropTypes)
  ),
  listProps: PropTypes.object,
  subListProps: PropTypes.object
}

AttributeList.displayName = 'AttributeList'

export default AttributeList
