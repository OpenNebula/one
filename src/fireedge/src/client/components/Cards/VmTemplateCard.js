/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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

import { useViews } from 'client/features/Auth'
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
   * @param {function(string):Promise} [props.onDeleteLabel] - Callback to delete label
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps, onDeleteLabel }) => {
    const classes = rowStyles()
    const { [RESOURCE_NAMES.VM_TEMPLATE]: templateView } = useViews()

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
        getUniqueLabels(LABELS).map((label) => ({
          text: label,
          stateColor: getColorFromString(label),
          onDelete: enableEditLabels && onDeleteLabel,
        })),
      [LABELS, enableEditLabels, onDeleteLabel]
    )

    return (
      <div {...rootProps} data-cy={`template-${ID}`}>
        <div className={classes.figure}>
          <Image
            alt="logo"
            src={logoSource}
            imgProps={{ className: classes.image }}
          />
        </div>
        <div className={classes.main}>
          <div className={classes.title}>
            <Typography noWrap component="span">
              {NAME}
            </Typography>
            <span className={classes.labels}>
              {HYPERVISOR && <StatusChip text={HYPERVISOR} />}
              {LOCK && <Lock />}
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
  onDeleteLabel: PropTypes.func,
}

VmTemplateCard.displayName = 'VmTemplateCard'

export default VmTemplateCard
