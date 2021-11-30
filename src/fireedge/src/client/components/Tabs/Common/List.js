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
import { Fragment, isValidElement } from 'react'
import PropTypes from 'prop-types'

import clsx from 'clsx'
import {
  List as MList,
  ListItem,
  Typography,
  Paper,
  alpha,
} from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'

import {
  Attribute,
  AttributePropTypes,
} from 'client/components/Tabs/Common/Attribute'
import AttributeCreateForm from 'client/components/Tabs/Common/AttributeCreateForm'

import { Tr } from 'client/components/HOC'

const useStyles = makeStyles((theme) => ({
  title: {
    fontWeight: theme.typography.fontWeightBold,
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  item: {
    height: '2.4em',
    gap: '1em',
    '& > *': {
      flex: '1 1 50%',
      overflow: 'hidden',
      minHeight: '100%',
    },
    '&:hover': {
      backgroundColor: alpha(theme.palette.text.primary, 0.05),
    },
  },
  typo: theme.typography.body2,
}))

const AttributeList = ({
  title,
  list = [],
  handleAdd,
  containerProps = {},
  itemProps = {},
  listProps = {},
  subListProps = {},
}) => {
  const classes = useStyles()
  const { className: itemClassName, ...restOfItemProps } = itemProps

  const renderList = (attribute, parentPath = false) => {
    const { name, value } = attribute
    const isParent = typeof value === 'object' && !isValidElement(value)

    return (
      <Fragment key={`${title}.${parentPath || name}`}>
        <ListItem
          className={clsx(classes.item, itemClassName)}
          {...restOfItemProps}
        >
          <Attribute
            path={parentPath || name}
            {...attribute}
            {...(isParent && { canEdit: false, value: undefined })}
          />
        </ListItem>
        {isParent && (
          <MList {...subListProps}>
            {Object.entries(value).map(([childName, childValue]) => {
              const subAttributeProps = {
                ...attribute,
                name: childName,
                value: childValue,
              }
              const attributePath = `${parentPath || name}.${childName}`

              return renderList(subAttributeProps, attributePath)
            })}
          </MList>
        )}
      </Fragment>
    )
  }

  return (
    <Paper variant="outlined" {...containerProps}>
      <MList {...listProps}>
        {/* TITLE */}
        {title && (
          <ListItem className={classes.title}>
            <Typography noWrap>{Tr(title)}</Typography>
          </ListItem>
        )}
        {/* LIST */}
        {list.map((attr) => renderList(attr))}
        {/* ADD ACTION */}
        {handleAdd && (
          <ListItem className={clsx(classes.item, itemClassName)}>
            <AttributeCreateForm handleAdd={handleAdd} />
          </ListItem>
        )}
      </MList>
    </Paper>
  )
}

AttributeList.propTypes = {
  containerProps: PropTypes.object,
  handleAdd: PropTypes.oneOfType([PropTypes.func, PropTypes.bool]),
  itemProps: PropTypes.object,
  title: PropTypes.any,
  list: PropTypes.arrayOf(PropTypes.shape(AttributePropTypes)),
  listProps: PropTypes.object,
  subListProps: PropTypes.object,
}

AttributeList.displayName = 'AttributeList'

export default AttributeList
