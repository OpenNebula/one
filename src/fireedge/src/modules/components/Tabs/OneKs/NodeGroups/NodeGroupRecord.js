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
import { ReactElement, memo, useMemo } from 'react'
import { useTheme, Typography, Paper, Link, Tooltip, Box } from '@mui/material'
import PropTypes from 'prop-types'
import { Tr } from '@modules/components/HOC'
import { getNodeGroupState, getValidKeys } from '@ModelsModule'
import Timer from '@modules/components/Timer'
import { rowStyles } from '@modules/components/Tables/styles'
import { T } from '@ConstantsModule'
import RowAction from '@modules/components/Tabs/OneKs/NodeGroups/rowActions'
import clsx from 'clsx'
import { StatusCircle } from '@modules/components/Status'
import { Link as RouterLink, generatePath } from 'react-router-dom'
import { PATH } from '@modules/components/path'
import { find, isEmpty } from 'lodash'
import { WarningCircle as WarningIcon } from 'iconoir-react'

const VmLinks = memo(
  /**
   * Renders VM links.
   *
   * @param {object} props - Props
   * @param {number[]} props.ids - Array of VM IDs
   * @returns {ReactElement} VM links component
   */
  ({ ids = [] }) => {
    if (!ids?.length) return '-'

    return (
      <>
        {ids.map((id) => (
          <Link
            key={id}
            component={RouterLink}
            to={generatePath(PATH.INSTANCE.VMS.DETAIL, { id })}
          >
            {id}
          </Link>
        ))}
      </>
    )
  }
)

const StripHtml = memo(
  /**
   * Renders VM links.
   *
   * @param {object} props - Props
   * @param {string} props.children - HTML string
   * @returns {string} Plain text string
   */
  ({ children }) => {
    if (!children) return null

    return children.replace(/<[^>]*>/g, '')
  }
)
StripHtml.displayName = 'StripHtml'
StripHtml.propTypes = {
  children: PropTypes.any,
}

const RenderNodeMetadata = memo(
  /**
   * Renders node metadata.
   *
   * @param {object} props - Props
   * @param {object} props.dataObj - Object with metadata key-value pairs
   * @returns {ReactElement} Node metadata component
   */
  ({ dataObj }) => {
    const validKeys = getValidKeys(dataObj)

    return (
      <>
        {validKeys.map((key) => (
          <span
            key={key}
            data-cy={`node-card-${key}`}
            title={Tr(T[key] || key)}
          >
            {`${Tr(T[key] || key)}: ${dataObj[key]}`}
          </span>
        ))}
      </>
    )
  }
)
RenderNodeMetadata.displayName = 'RenderNodeMetadata'
RenderNodeMetadata.propTypes = {
  dataObj: PropTypes.object,
}

const NodeGroupRecordCard = memo(
  /**
   * Renders history record card.
   *
   * @param {object} props - Props
   * @param {object} props.node - node data, either HistoryRecord or row data
   * @param {number} props.id - oneKS cluster id
   * @param {object[]} props.families - node group families
   * @returns {ReactElement} History record card component
   */
  ({ node = {}, id, families = [] }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const createdTime = node?.registration_time
    const nodeId = node?.id ?? ''
    const vms = node?.vms ?? []
    const nodes = vms.length
    const state = node?.state ?? ''
    const stateInfo = getNodeGroupState(state)
    const flavour = node?.flavour ?? ''
    const family = node?.family ?? ''
    const userInputs = node?.user_inputs_values ?? {}

    const familyData = useMemo(() => {
      if (!flavour || !family || isEmpty(families)) {
        return null
      }

      const foundFamily = find(families, { family })
      if (!foundFamily) return null

      return find(foundFamily.flavours, { name: flavour })
    }, [flavour, family, families])

    return (
      <Paper
        variant="outlined"
        className={classes.root}
        data-cy={`record-${nodeId}`}
      >
        <div className={classes.main}>
          <div className={classes.title}>
            <StatusCircle color={stateInfo?.color} tooltip={stateInfo?.name} />
            <Typography noWrap component="span" data-cy="node-data">
              {node?.name ?? ''}
            </Typography>
          </div>
          <div className={classes.vmActionLayout}>
            <div className={classes.caption}>
              <span data-cy="node-card-id" title={`${Tr(T.ID)}`}>
                {`#${nodeId}`}
              </span>
              <span data-cy="node-card-nodes" title={`${Tr(T.Nodes)}`}>
                {`${Tr(T.Nodes)}: ${nodes}`}
              </span>
              <span title={`${Tr(T.Created)}`}>
                {!createdTime ? '' : <Timer initial={+createdTime} />}
              </span>
              <span title={`${Tr(T.Vms)}`}>
                {`${Tr(T.VMs)}: `}
                <VmLinks ids={vms} />
              </span>
              <span data-cy="flavour" title={`${Tr(T.Flavour)}`}>
                {`${Tr(T.Flavour)}: ${flavour}`}
                <Tooltip
                  arrow
                  placement="bottom"
                  title={
                    <Typography variant="subtitle2">
                      <StripHtml>{familyData?.description || ''}</StripHtml>
                    </Typography>
                  }
                >
                  <Box
                    component="span"
                    sx={{ display: 'inline-flex', alignItems: 'center' }}
                  >
                    <WarningIcon />
                  </Box>
                </Tooltip>
              </span>
              <RenderNodeMetadata dataObj={userInputs} />
            </div>
            <div className={clsx(classes.actions, classes.vmActions)}>
              <RowAction node={node} id={id} />
            </div>
          </div>
        </div>
      </Paper>
    )
  }
)
VmLinks.propTypes = {
  ids: PropTypes.arrayOf(PropTypes.number),
}

VmLinks.displayName = 'VmLinks'

NodeGroupRecordCard.propTypes = {
  node: PropTypes.object.isRequired,
  id: PropTypes.number.isRequired,
  families: PropTypes.arrayOf(PropTypes.object),
}

NodeGroupRecordCard.displayName = 'NodeGroupRecordCard'

export default NodeGroupRecordCard
