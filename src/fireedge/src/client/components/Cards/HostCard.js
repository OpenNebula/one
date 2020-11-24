import React, { memo } from 'react'
import PropTypes from 'prop-types'

import { makeStyles, Chip } from '@material-ui/core'
import { VideogameAsset as HostIcon } from '@material-ui/icons'

import SelectCard from 'client/components/Cards/SelectCard'
import Host from 'client/constants/host'

const useStyles = makeStyles(() => ({
  title: { display: 'flex', gap: '8px' },
  state: { backgroundColor: ({ stateColor }) => stateColor }
}))

const HostCard = memo(
  ({ value, isSelected, handleClick }) => {
    const { ID, NAME, STATE } = value
    const state = Host.STATES[STATE]

    const classes = useStyles({ stateColor: state.color })

    const renderChip = ({ label, ...props }) =>
      <Chip size="small" title={label} label={label} {...props} />

    return (
      <SelectCard
        stylesProps={{ minHeight: 75 }}
        icon={<HostIcon />}
        title={`${ID} - ${NAME}`}
        subheader={renderChip({ label: state.name, className: classes.state })}
        isSelected={isSelected}
        handleClick={handleClick}
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
    STATE: PropTypes.string
  }),
  isSelected: PropTypes.bool,
  handleClick: PropTypes.func
}

HostCard.defaultProps = {
  value: {},
  isSelected: false,
  handleClick: undefined
}

HostCard.displayName = 'HostCard'

export default HostCard
