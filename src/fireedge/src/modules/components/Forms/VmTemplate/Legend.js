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

import { T, UNITS } from '@ConstantsModule'
import { SystemAPI } from '@FeaturesModule'
import { css } from '@emotion/css'
import { Translate } from '@modules/components/HOC'
import { Typography, useTheme } from '@mui/material'
import clsx from 'clsx'
import PropTypes from 'prop-types'
import { ReactElement, memo, useMemo } from 'react'
import { useFormContext } from 'react-hook-form'

const ARRAY_UNITS = Object.values(UNITS)
ARRAY_UNITS.splice(0, 1) // remove KB
const DEFAULT_UNIT = ARRAY_UNITS[0]

/**
 * Parse value in MB.
 *
 * @param {number} value - value
 * @param {string} unit - unit
 * @returns {number} value in unit
 */
export const valueInMB = (value = 0, unit = DEFAULT_UNIT) => {
  const idxUnit = ARRAY_UNITS.indexOf(unit)
  const numberValue = +value

  return Math.round(numberValue * (idxUnit <= 0 ? 1 : 1024 ** idxUnit))
}

const useStyles = () => ({
  cost: css({
    display: 'inline',
    marginLeft: '.5rem',
    textTransform: 'uppercase',
    color: '#a0a0a0',
    fontSize: '.8rem',
  }),
  costUnit: css({
    fontSize: '.5rem',
    marginLeft: '.3rem',
  }),
})

/**
 * Capacity title Memory and CPU.
 *
 * @param {object} props - Props
 * @param {object} props.data - vmTemplate
 * @returns {ReactElement} title
 */
export const CapacityMemoryLabel = memo(({ data }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { watch } = useFormContext()
  const formValues = watch('general')
  const { data: oneConfig = {} } = SystemAPI.useGetOneConfigQuery()

  const cpuCost =
    data?.TEMPLATE?.CPU_COST || oneConfig?.DEFAULT_COST?.CPU_COST || '0'
  const memoryCost =
    data?.TEMPLATE?.MEMORY_COST || oneConfig?.DEFAULT_COST?.MEMORY_COST || '0'
  const memoryUnitCost = data?.TEMPLATE?.MEMORY_UNIT_COST || 'MB'

  const memoryUnitCostMB = valueInMB(memoryCost, memoryUnitCost)

  const memory = formValues?.MEMORY || '0'
  const cpu = formValues?.CPU || '0'

  return (
    <>
      <Translate word={T.Capacity} />
      <Typography className={classes.cost}>
        {`${(memory * memoryUnitCostMB + cpu * cpuCost).toFixed(6)}`}
      </Typography>
      <Typography className={clsx(classes.cost, classes.costUnit)}>
        {`${T.CostPerHour}`}
      </Typography>
    </>
  )
})

/**
 * Capacity title Disks.
 *
 * @param {object} props - Props
 * @param {object} props.data - vmTemplate
 * @returns {ReactElement} Title
 */
export const CapacityDisksLabel = memo(({ data }) => {
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { watch } = useFormContext()
  const formValues = watch('extra')
  const { data: oneConfig = {} } = SystemAPI.useGetOneConfigQuery()

  const diskCost =
    data?.TEMPLATE?.DISK_COST || oneConfig?.DEFAULT_COST?.DISK_COST || '0'
  const disks = formValues?.DISK || []

  const cost = disks.reduce((total, { SIZE }) => total + SIZE * diskCost, 0)

  return (
    <>
      <Typography
        className={classes.cost}
        data-cy="legend-capacity-disks"
      >{`${cost.toFixed(6)}`}</Typography>
      <Typography className={clsx(classes.cost, classes.costUnit)}>
        {`${T.CostPerHour}`}
      </Typography>
    </>
  )
})

const TitlePropTypes = {
  data: PropTypes.any,
}
CapacityMemoryLabel.propTypes = TitlePropTypes
CapacityMemoryLabel.displayName = 'CapacityMemoryLabel'

CapacityDisksLabel.propTypes = TitlePropTypes
CapacityDisksLabel.displayName = 'CapacityDisksLabel'
