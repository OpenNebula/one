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
import { Typography, useTheme } from '@mui/material'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'

import { Group, Lock, User } from 'iconoir-react'

import { useAuth } from '@FeaturesModule'
import { getResourceLabels, isExternalURL } from '@UtilsModule'
import { Tr } from '@modules/components/HOC'
import Image from '@modules/components/Image'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { StatusChip } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'

import {
  DEFAULT_TEMPLATE_LOGO,
  RESOURCE_NAMES,
  STATIC_FILES_URL,
  T,
  VM,
} from '@ConstantsModule'

import {
  getColorFromString,
  stringToBoolean,
  timeFromMilliseconds,
} from '@ModelsModule'

const VmTemplateCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.template - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps, onClickLabel }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { labels } = useAuth()
    const LABELS = getResourceLabels(
      labels,
      template?.ID,
      RESOURCE_NAMES.VM_TEMPLATE
    )

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      REGTIME,
      LOCK,
      TEMPLATE: { VROUTER, HYPERVISOR, LOGO = '' } = {},
    } = template

    const isExternalImage = useMemo(() => isExternalURL(LOGO), [LOGO])
    const time = useMemo(() => timeFromMilliseconds(+REGTIME), [REGTIME])
    const isVR = useMemo(() => stringToBoolean(VROUTER), [VROUTER])

    const logoSource = useMemo(() => {
      if (!LOGO) return `${STATIC_FILES_URL}/${DEFAULT_TEMPLATE_LOGO}`

      return isExternalImage ? LOGO : `${STATIC_FILES_URL}/${LOGO}`
    }, [isExternalImage, LOGO])

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

    return (
      <div
        {...rootProps}
        data-cy={`template-${ID}`}
        style={{
          position: 'relative',
          minHeight: '110px',
          minWidth: '400px',
        }}
      >
        <div
          className={classes.figure}
          style={{
            margin: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'left',
          }}
        >
          <Image
            alt="logo"
            src={logoSource}
            imgProps={{
              className: classes.image,
            }}
          />
        </div>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span" title={NAME}>
              {NAME}
            </Typography>
            <span className={classes.labels}>
              {HYPERVISOR && <StatusChip text={HYPERVISOR} />}
              {LOCK && <Lock data-cy="lock" />}
              {isVR && <StatusChip text={'VROUTER'} />}
              <MultipleTags limitTags={1} tags={userLabels} />
              <MultipleTags limitTags={1} tags={groupLabels} />
            </span>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={time.toFormat('ff')}>
              <Timer translateWord={T.RegisteredAt} initial={time} />
            </span>
            <span title={`${Tr(T.Owner)}: ${UNAME}`}>
              <User />
              <span>{` ${UNAME}`}</span>
            </span>
            <span title={`${Tr(T.Group)}: ${GNAME}`}>
              <Group />
              <span>{` ${GNAME}`}</span>
            </span>
          </div>
        </div>
      </div>
    )
  }
)

VmTemplateCard.propTypes = {
  template: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onClickLabel: PropTypes.func,
  onDeleteLabel: PropTypes.func,
}

VmTemplateCard.displayName = 'VmTemplateCard'

export default VmTemplateCard
