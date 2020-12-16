import * as React from 'react'
import { useHistory } from 'react-router'

import { AddCircle } from '@material-ui/icons'

import { useFetch, useProvision } from 'client/hooks'
import Circle from 'client/components/Widgets/SimpleCircle'

import { PATH } from 'client/router/provision'
import { T } from 'client/constants'

const cy = 'dashboard-widget-total-providers'
const title = T.Providers

const TotalProviders = () => {
  const history = useHistory()
  const { providers, getProviders } = useProvision()
  const { fetchRequest } = useFetch(getProviders)

  React.useEffect(() => { fetchRequest() }, [])

  const actions = React.useMemo(() => [{
    handleClick: () => history.push(PATH.PROVIDERS.CREATE),
    icon: <AddCircle />,
    cy: `${cy}-create`
  }], [history])

  const widget = React.useMemo(() => (
    <Circle
      label={`${providers?.length}`}
      onClick={() => history.push(PATH.PROVIDERS.LIST)}
    />
  ), [providers?.length])

  return { cy, title, actions, widget }
}

TotalProviders.displayName = 'TotalProviders'

export default TotalProviders
