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

import MultipleTags from '@modules/components/MultipleTags'
import { Typography, useTheme } from '@mui/material'
import { useMemo } from 'react'
import { EmptyPage, Group, ModernTv, User } from 'iconoir-react'

import { rowStyles } from '@modules/components/Tables/styles'
import { getResourceLabels } from '@UtilsModule'
import { useAuth } from '@FeaturesModule'

import { Tr } from '@modules/components/HOC'
import { RESOURCE_NAMES, T } from '@ConstantsModule'
import { getColorFromString } from '@ModelsModule'

const Row = ({
  original,
  value,
  onClickLabel,
  headerList,
  rowDataCy,
  isSelected,
  toggleRowSelected,
  ...props
}) => {
  const { labels } = useAuth()
  const LABELS = getResourceLabels(labels, original?.ID, RESOURCE_NAMES.VROUTER)

  const userLabels = useMemo(
    () =>
      LABELS?.user?.map((label) => ({
        text: label?.replace(/\$/g, ''),
        dataCy: `label-${label}`,
        stateColor: getColorFromString(label),
        onClick: onClickLabel,
      })) || [],
    [LABELS, onClickLabel]
  )

  const groupLabels = useMemo(
    () =>
      Object.entries(LABELS?.group || {}).flatMap(([group, gLabels]) =>
        gLabels.map((gLabel) => ({
          text: gLabel?.replace(/\$/g, ''),
          dataCy: `group-label-${group}-${gLabel}`,
          stateColor: getColorFromString(gLabel),
          onClick: onClickLabel,
        }))
      ),
    [LABELS, onClickLabel]
  )

  const theme = useTheme()
  const classes = useMemo(() => rowStyles(theme), [theme])
  const { ID, NAME, UNAME, GNAME, VMS, TEMPLATE_ID } = value

  return (
    <div {...props} data-cy={`vrouter-${ID}`}>
      <div className={classes.main}>
        <div className={classes.title}>
          <Typography noWrap component="span">
            {NAME}
          </Typography>

          <span className={classes.labels}>
            <MultipleTags limitTags={1} tags={userLabels} />
            <MultipleTags limitTags={1} tags={groupLabels} />
          </span>
        </div>
        <div className={classes.caption}>
          <span>{`#${ID}`}</span>
          <span title={`${Tr(T.Owner)}: ${UNAME}`}>
            <User />
            <span>{` ${UNAME}`}</span>
          </span>
          <span title={`${Tr(T.Group)}: ${GNAME}`}>
            <Group />
            <span>{` ${GNAME}`}</span>
          </span>
          <span title={`${Tr(T.Template)}${Tr(T.ID)}: ${TEMPLATE_ID}`}>
            <EmptyPage />
            <span>{` ${TEMPLATE_ID}`}</span>
          </span>
          <span title={`${Tr(T.TotalVms)}: ${VMS}`}>
            <ModernTv />
            <span>{` ${VMS}`}</span>
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
  onClickLabel: PropTypes.func,
  headerList: PropTypes.oneOfType([PropTypes.array, PropTypes.bool]),
  rowDataCy: PropTypes.string,
  toggleRowSelected: PropTypes.func,
}

export default Row
