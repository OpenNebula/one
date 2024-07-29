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
import { ReactElement, memo, useMemo } from 'react'
import PropTypes from 'prop-types'

import { User, Group, Lock } from 'iconoir-react'
import { Typography } from '@mui/material'

import { useAuth, useViews } from 'client/features/Auth'
import MultipleTags from 'client/components/MultipleTags'
import Timer from 'client/components/Timer'
import Image from 'client/components/Image'
import { StatusChip } from 'client/components/Status'
import { Tr } from 'client/components/HOC'
import { rowStyles } from 'client/components/Tables/styles'

import {
  timeFromMilliseconds,
  getUniqueLabels,
  getColorFromString,
  stringToBoolean,
} from 'client/models/Helper'
import { isExternalURL } from 'client/utils'
import {
  T,
  VM,
  ACTIONS,
  RESOURCE_NAMES,
  STATIC_FILES_URL,
  DEFAULT_TEMPLATE_LOGO,
} from 'client/constants'

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
    const classes = rowStyles()
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
          padding: 'calc(1vh - 0.3vw)',
          minHeight: '110px',
          minWidth: '400px',
        }}
      >
        <div
          className="label-container"
          style={{
            position: 'absolute',
            top: '-9px',
            right: '-7px',
            padding: '8px',
          }}
        >
          <MultipleTags tags={labels} />
        </div>
        <div
          className={classes.figure}
          style={{ flexBasis: '10%', aspectRatio: '1.33/1' }}
        >
          <Image
            alt="logo"
            src={logoSource}
            imgProps={{
              className: classes.image,
            }}
          />
        </div>
        <div
          className={classes.main}
          style={{ paddingTop: labels && labels.length > 0 ? '20px' : '0' }}
        >
          <div className={classes.title}>
            <Typography noWrap component="span" title={NAME}>
              {NAME}
            </Typography>
            <span className={classes.labels}>
              {HYPERVISOR && <StatusChip text={HYPERVISOR} />}
              {LOCK && <Lock />}
              {isVR && <StatusChip text={'VROUTER'} />}
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
