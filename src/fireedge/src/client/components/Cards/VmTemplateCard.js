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

import Timer from 'client/components/Timer'
import { StatusChip } from 'client/components/Status'
import { rowStyles } from 'client/components/Tables/styles'
import Image from 'client/components/Image'

import { timeFromMilliseconds } from 'client/models/Helper'
import { isExternalURL } from 'client/utils'
import { VM, STATIC_FILES_URL } from 'client/constants'

const VmTemplateCard = memo(
  /**
   * @param {object} props - Props
   * @param {VM} props.template - Virtual machine resource
   * @param {object} props.rootProps - Props to root component
   * @returns {ReactElement} - Card
   */
  ({ template, rootProps }) => {
    const classes = rowStyles()
    const {
      ID,
      NAME,
      UNAME,
      GNAME,
      REGTIME,
      LOCK,
      VROUTER,
      TEMPLATE: { LOGO = '' } = {},
    } = template

    const logoSource = useMemo(
      () => (isExternalURL(LOGO) ? LOGO : `${STATIC_FILES_URL}/${LOGO}`),
      [LOGO]
    )

    const time = timeFromMilliseconds(+REGTIME)

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
            <Typography component="span">{NAME}</Typography>
            <span className={classes.labels}>
              {LOCK && <Lock />}
              {VROUTER && <StatusChip text={VROUTER} />}
            </span>
          </div>
          <div className={classes.caption}>
            <span title={time.toFormat('ff')} className="full-width">
              {`#${ID} registered `}
              <Timer initial={time} />
            </span>
            <span title={`Owner: ${UNAME}`}>
              <User />
              <span>{` ${UNAME}`}</span>
            </span>
            <span title={`Group: ${GNAME}`}>
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
}

VmTemplateCard.displayName = 'VmTemplateCard'

export default VmTemplateCard
