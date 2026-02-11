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
/* eslint-disable jsdoc/require-jsdoc */
import PropTypes from 'prop-types'

import { alpha, Box, styled, Typography, useTheme } from '@mui/material'
import { Folder, HardDrive, NetworkAlt } from 'iconoir-react'

import { rowStyles } from '@modules/components/Tables/styles'
import { useMemo } from 'react'

import { T } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'

const TagType = styled(Typography, {
  shouldForwardProp: (prop) => !['provision'].includes(prop),
})(({ theme, provision }) => {
  const color = provision?.color
    ? `#${provision.color}`
    : theme.palette.primary.main

  return {
    color: alpha(color, 1),
    border: `1px solid ${alpha(color, 1)}`,
    fontSize: theme.typography.button.fontSize,
    textTransform: 'capitalize',
    padding: `${theme.typography.pxToRem(1)} ${theme.typography.pxToRem(8)}`,
    backgroundColor: alpha(color, 0.1),
    userSelect: 'none',
  }
})

const Row = ({
  original,
  value,
  headerList,
  rowDataCy,
  isSelected,
  toggleRowSelected,
  ...props
}) => {
  const theme = useTheme()
  const classes = useMemo(() => rowStyles(theme), [theme])
  const { ID, NAME, HOSTS, DATASTORES, VNETS, TEMPLATE } = value

  return (
    <div data-cy={`cluster-${ID}`} {...props}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography noWrap component="span" data-cy="cluster-card-name">
            {NAME}
          </Typography>
          <span className={classes.labels}>
            {TEMPLATE?.ONEFORM && TEMPLATE?.ONEFORM?.DRIVER && (
              <Box sx={{ width: '100%', textAlign: 'end' }}>
                <TagType
                  component="span"
                  variant="overline"
                  lineHeight="normal"
                  borderRadius="0.5em"
                  provision={TEMPLATE?.fireedge}
                >
                  {TEMPLATE?.ONEFORM?.DRIVER}
                </TagType>
              </Box>
            )}
          </span>
        </div>
        <div className={classes.caption}>
          <span data-cy="cluster-card-id">{`#${ID}`}</span>
          <span
            data-cy="cluster-card-hosts"
            title={`${Tr(T.Total)} ${Tr(T.Hosts)}: ${HOSTS}`}
          >
            <HardDrive />
            <span>{`${HOSTS}`}</span>
          </span>
          <span
            data-cy="cluster-card-vnets"
            title={`${Tr(T.Total)} ${Tr(T.VirtualNetworks)}: ${VNETS}`}
          >
            <NetworkAlt />
            <span>{`${VNETS}`}</span>
          </span>
          <span
            data-cy="cluster-card-datastores"
            title={`${Tr(T.Total)} ${Tr(T.Datastores)}: ${DATASTORES}`}
          >
            <Folder />
            <span>{`${DATASTORES}`}</span>
          </span>
        </div>
      </div>
    </div>
  )
}

Row.propTypes = {
  original: PropTypes.object,
  value: PropTypes.object,
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

export default Row
