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
import Timer from '@modules/components/Timer'
import { Tr } from '@modules/components/HOC'
import { LOGO_DRIVERS_IMAGES_URL, T } from '@ConstantsModule'
import { timeFromMilliseconds } from '@ModelsModule'
import { Package } from 'iconoir-react'

const ProviderCard = memo(
  /**
   * @param {object} props - Props
   * @param {object} props.rootProps - Props to root component
   * @param {ReactElement} [props.actions] - Actions
   * @param {object} props.provider - Driver data
   * @returns {ReactElement} - Card
   */
  ({ provider, rootProps, actions }) => {
    const theme = useTheme()
    const classes = useMemo(() => rowStyles(theme), [theme])

    // Get data from provider
    const {
      ID,
      NAME,
      TEMPLATE: {
        PROVIDER_BODY: {
          registration_time: regTime,
          provision_ids: provisionIds,
          fireedge = {},
        } = {},
      },
    } = provider

    const numberOfProvisions = useMemo(
      () => provisionIds.length,
      [provisionIds]
    )

    const time = useMemo(() => timeFromMilliseconds(+regTime), [regTime])

    // Get logo for the provider
    const logoSource = useMemo(() => {
      if (!fireedge?.logo) return `${LOGO_DRIVERS_IMAGES_URL}/default.png`
      if (fireedge?.logo.includes(LOGO_DRIVERS_IMAGES_URL))
        return `${fireedge.logo}`

      return `${LOGO_DRIVERS_IMAGES_URL}/${fireedge?.logo}`
    }, [fireedge])

    return (
      <div {...rootProps} data-cy={`provider-${NAME}`}>
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
            <Typography noWrap component="span">
              {NAME}
            </Typography>
          </div>
          <div className={classes.caption}>
            <span data-cy="id">{`#${ID}`}</span>
            <span title={time.toFormat('ff')}>
              <Timer translateWord={T.RegisteredAt} initial={time} />
            </span>
            <span title={`${Tr(T.NumberProvisions)}: ${numberOfProvisions}`}>
              <Package width={20} height={20} />
              <span data-cy="total-provisions">{numberOfProvisions}</span>
            </span>
          </div>
        </div>
        {actions && <div className={classes.actions}>{actions}</div>}
      </div>
    )
  }
)

ProviderCard.propTypes = {
  provider: PropTypes.object,
  rootProps: PropTypes.shape({
    className: PropTypes.string,
  }),
  onDeleteLabel: PropTypes.func,
  actions: PropTypes.any,
}

ProviderCard.displayName = 'ProviderCard'

export default ProviderCard
