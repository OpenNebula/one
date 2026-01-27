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
import { rowStyles } from '@modules/components/Tables/styles'
import Image from '@modules/components/Image'
import { DRIVER_STATES, LOGO_DRIVERS_IMAGES_URL } from '@ConstantsModule'
import { StatusCircle } from '@modules/components/Status'
import { find } from 'lodash'

const DriverCard = memo(
  /**
   * @param {object} props - Props
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} [props.actions] - Actions
   * @param {object} props.driver - Driver data
   * @returns {ReactElement} - Card
   */
  ({ driver, rootProps, actions }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    // Get data from driver
    const { name, description, state, fireedge } = driver

    // Get the color os the driver status
    const { color: stateColor, name: stateName } =
      find(DRIVER_STATES, { name: state }) || {}

    // Get logo for the driver
    const logoSource = useMemo(() => {
      if (!fireedge?.logo) return `${LOGO_DRIVERS_IMAGES_URL}/default.png`
      if (fireedge?.logo.includes(LOGO_DRIVERS_IMAGES_URL))
        return `${fireedge.logo}`

      return `${LOGO_DRIVERS_IMAGES_URL}/${fireedge?.logo}`
    }, [fireedge])

    return (
      <div {...rootProps} data-cy={`driver-${name}`}>
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
            <StatusCircle color={stateColor} tooltip={stateName} />
            <Typography noWrap component="span">
              {name}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span>{description}</span>
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

DriverCard.propTypes = {
  driver: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

DriverCard.displayName = 'DriverCard'

export default DriverCard
