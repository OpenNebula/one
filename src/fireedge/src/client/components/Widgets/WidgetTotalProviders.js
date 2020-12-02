import * as React from 'react'
import { useHistory } from 'react-router'

import { ViewList, Add } from '@material-ui/icons'

import useFetch from 'client/hooks/useFetch'
import useProvision from 'client/hooks/useProvision'
import Circle from 'client/components/Widgets/SimpleCircle'

import { PATH } from 'client/router/provision'
import { T } from 'client/constants'

const cy = 'dashboard-widget-total-providers'
const title = T.Providers

const WidgetTotalProviders = () => {
  const history = useHistory()
  const { providers, getProviders } = useProvision()
  const { fetchRequest } = useFetch(getProviders)

  React.useEffect(() => { fetchRequest() }, [])

  const actions = React.useMemo(() => [
    {
      handleClick: () => history.push(PATH.PROVIDERS.LIST),
      icon: <ViewList />,
      cy: `${cy}-gotolist`
    },
    {
      handleClick: () => history.push(PATH.PROVIDERS.CREATE),
      icon: <Add color='primary' />,
      cy: `${cy}-create`
    }
  ], [history])

  const widget = React.useMemo(() => (
    <Circle label={`${providers?.length}`} color='#49457b' />
  ), [providers?.length])

  return { cy, title, actions, widget }
}

WidgetTotalProviders.displayName = 'WidgetTotalProviders'

export default WidgetTotalProviders
