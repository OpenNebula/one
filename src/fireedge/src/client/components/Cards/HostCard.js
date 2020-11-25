import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Chip, Box, Typography } from '@material-ui/core'
import { VideogameAsset as HostIcon } from '@material-ui/icons'

import SelectCard from 'client/components/Cards/SelectCard'
import Host from 'client/constants/host'

const useStyles = makeStyles(() => ({
  title: { display: 'flex', gap: '8px' },
  state: { backgroundColor: ({ stateColor }) => stateColor }
}))

const HostCard = memo(
  ({ value, isSelected, handleClick, actions }) => {
    const { ID, NAME, STATE, IM_MAD: imMad, VM_MAD: vmMad } = value
    const state = Host.STATES[STATE]
    const mad = imMad === vmMad ? imMad : `${imMad}/${vmMad}`

    const classes = useStyles({ stateColor: state?.color })

    const renderChip = ({ label, ...props }) =>
      <Chip size="small" title={label} label={label} {...props} />

    return (
      <SelectCard
        stylesProps={{ minHeight: 160 }}
        icon={<HostIcon />}
        title={(
          <Box component="span" className={classes.title}>
            <Typography noWrap>{`${ID} - ${NAME}`}</Typography>
            {renderChip({ label: mad })}
          </Box>
        )}
        subheader={
          renderChip({ label: state?.name, className: classes.state })
        }
        isSelected={isSelected}
        handleClick={handleClick}
        actions={actions}
      />
    )
  },
  (prev, next) => prev.isSelected === next.isSelected
)

HostCard.propTypes = {
  value: PropTypes.shape({
    ID: PropTypes.string.isRequired,
    NAME: PropTypes.string.isRequired,
    TYPE: PropTypes.string,
    STATE: PropTypes.string,
    IM_MAD: PropTypes.string,
    VM_MAD: PropTypes.string
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      handleClick: PropTypes.func.isRequired,
      icon: PropTypes.object.isRequired,
      iconColor: PropTypes.oneOf([
        'inherit', 'primary', 'secondary', 'action', 'error', 'disabled'
      ]),
      cy: PropTypes.string
    })
  )
}

HostCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined,
  actions: undefined
}

HostCard.displayName = 'HostCard'

export default HostCard
