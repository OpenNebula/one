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

import { useAuth, useViews } from '@FeaturesModule'
import { Tr } from '@modules/components/HOC'
import Image from '@modules/components/Image'
import MultipleTags from '@modules/components/MultipleTagsCard'
import { StatusChip } from '@modules/components/Status'
import { rowStyles } from '@modules/components/Tables/styles'
import Timer from '@modules/components/Timer'

import {
  ACTIONS,
  DEFAULT_TEMPLATE_LOGO,
  RESOURCE_NAMES,
  STATIC_FILES_URL,
  T,
  VM,
} from '@ConstantsModule'
import {
  getColorFromString,
  getUniqueLabels,
  stringToBoolean,
  timeFromMilliseconds,
} from '@ModelsModule'
import { isExternalURL } from '@UtilsModule'

const VmTemplateCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.template - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @param {function(string):Promise} [props.onClickLabel] - Callback to click label
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps, onClickLabel, onDeleteLabel }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])
    const { [RESOURCE_NAMES.VM_TEMPLATE]: templateView } = useViews()
    const { labels: userLabels } = useAuth()

    const enableEditLabels =
      templateView?.actions?.[ACTIONS.EDIT_LABELS] === true && !!onDeleteLabel

    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      REGTIME,
      LOCK,
      TEMPLATE: { VROUTER, HYPERVISOR, LABELS, LOGO = '' } = {},
    } = template

    const isExternalImage = useMemo(() => isExternalURL(LOGO), [LOGO])
    const time = useMemo(() => timeFromMilliseconds(+REGTIME), [REGTIME])
    const isVR = useMemo(() => stringToBoolean(VROUTER), [VROUTER])

    const logoSource = useMemo(() => {
      if (!LOGO) return `${STATIC_FILES_URL}/${DEFAULT_TEMPLATE_LOGO}`

      return isExternalImage ? LOGO : `${STATIC_FILES_URL}/${LOGO}`
    }, [isExternalImage, LOGO])

    const labels = useMemo(
      () =>
        getUniqueLabels(LABELS).reduce((acc, label) => {
          if (userLabels?.includes(label)) {
            acc.push({
              text: label,
              dataCy: `label-${label}`,
              stateColor: getColorFromString(label),
              onClick: onClickLabel,
              onDelete: enableEditLabels && onDeleteLabel,
            })
          }

          return acc
        }, []),
      [LABELS, enableEditLabels, onClickLabel, onDeleteLabel]
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
              <MultipleTags tags={labels} />
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
