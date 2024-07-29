/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, Fragment, isValidElement } from 'react'
import PropTypes from 'prop-types'

import {
  styled,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  List,
  ListItem,
  Typography,
  Paper,
} from '@mui/material'

import {
  Attribute,
  AttributePropTypes,
} from 'client/components/Tabs/Common/Attribute'
import AttributeCreateForm from 'client/components/Tabs/Common/AttributeCreateForm'
import { Tr } from 'client/components/HOC'
import { camelCase } from 'client/utils'

const Title = styled(ListItem)(({ theme }) => ({
  fontWeight: theme.typography.fontWeightBold,
  borderBottom: `1px solid ${theme.palette.divider}`,
}))

const Item = styled(ListItem)(({ theme }) => ({
  gap: '1em',
  '& > *': {
    flex: '1 1 50%',
    overflow: 'hidden',
    minHeight: '100%',
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}))

const AttributeList = ({
  title,
  list = [],
  handleAdd,
  containerProps = {},
  itemProps = {},
  listProps = {},
  subListProps = {},
  collapse = false,
}) => {
  const RootElement = useMemo(() => (collapse ? Box : Paper), [collapse])
  const ListElement = useMemo(() => (collapse ? Accordion : List), [collapse])

  const TitleElement = useMemo(
    () => (collapse ? AccordionSummary : Title),
    [collapse]
  )

  const DetailsElement = useMemo(
    () => (collapse ? AccordionDetails : Fragment),
    [collapse]
  )

  const { className: itemClassName, ...restOfItemProps } = itemProps

  const renderList = (attribute, parentPath = false) => {
    const { name, value } = attribute
    const isReactElement = isValidElement(value)
    const isParent = typeof value === 'object' && !isReactElement

    return (
      <Fragment key={`${title}.${parentPath || name}`}>
        <Item
          sx={isReactElement ? { minHeight: '2.4em' } : { height: '2.4em' }}
          className={itemClassName}
          {...restOfItemProps}
        >
          <Attribute
            path={parentPath || name}
            dataCy={'attribute-' + camelCase(name)}
            {...attribute}
            {...(isParent && { canEdit: false, value: undefined })}
          />
        </Item>
        {isParent && (
          <List {...subListProps}>
            {Object.entries(value).map(([childName, childValue]) => {
              const attributePath = `${parentPath || name}.${childName}`
              const subAttributeProps = {
                ...attribute,
                name: childName,
                value: childValue,
              }

              return renderList(subAttributeProps, attributePath)
            })}
          </List>
        )}
      </Fragment>
    )
  }

  return (
    <RootElement variant="outlined" {...containerProps}>
      <ListElement variant="outlined" {...listProps}>
        {/* TITLE */}
        {title && (
          <TitleElement>
            {typeof title === 'string' ? (
              <Typography noWrap>{Tr(title)}</Typography>
            ) : (
              title
            )}
          </TitleElement>
        )}
        <DetailsElement>
          {/* LIST */}
          {list.map((attr) => renderList(attr))}
          {/* ADD ACTION */}
          {handleAdd && (
            <Item className={itemClassName}>
              <AttributeCreateForm handleAdd={handleAdd} />
            </Item>
          )}
        </DetailsElement>
      </ListElement>
    </RootElement>
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
  collapse: PropTypes.bool,
}

AttributeList.displayName = 'AttributeList'

export default AttributeList
