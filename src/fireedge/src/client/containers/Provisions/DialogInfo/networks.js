import React, { memo, useEffect } from 'react'
import PropTypes from 'prop-types'

import useFetchAll from 'client/hooks/useFetchAll'
import useOpennebula from 'client/hooks/useOpennebula'
import ListCards from 'client/components/List/ListCards'
import { SelectCard } from 'client/components/Cards'

const Networks = memo(({ hidden, data }) => {
  const {
    networks
  } = data?.TEMPLATE?.PROVISION_BODY?.provision?.infrastructure

  const { getVNetwork } = useOpennebula()
  const { data: list, fetchRequestAll, loading } = useFetchAll()

  useEffect(() => {
    if (!list && !hidden) {
      const reqs = networks?.map(({ id }) => getVNetwork({ id }))
      fetchRequestAll(reqs)
    }
  }, [hidden])

  return (
    <ListCards
      list={list}
      isLoading={loading}
      CardComponent={SelectCard}
      cardsProps={({ value: { ID, NAME } }) => ({
        title: `${ID} - ${NAME}`,
        stylesProps: { minHeight: 75 }
      })}
      displayEmpty
      breakpoints={{ xs: 12, md: 6 }}
    />
  )
}, (prev, next) => prev.hidden === next.hidden)

Networks.propTypes = {
  data: PropTypes.object.isRequired,
  hidden: PropTypes.bool
}

Networks.defaultProps = {
  data: {},
  hidden: false
}

Networks.displayName = 'Networks'

export default Networks
