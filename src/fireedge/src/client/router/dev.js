import loadable from '@loadable/component'
import {
  Code as DevIcon,
  ViewGrid as NewstoneIcon
} from 'iconoir-react'

const Newstone = loadable(() => import('client/containers/Newstone'), { ssr: false })
const TestApi = loadable(() => import('client/containers/TestApi'), { ssr: false })
const WebConsole = loadable(() => import('client/containers/WebConsole'), { ssr: false })

export const PATH = {
  NEWSTONE: '/newstone/:resource',
  TEST_API: '/test-api',
  WEB_CONSOLE: '/webconsole'
}

export const ENDPOINTS = [
  {
    label: 'Newstone',
    path: PATH.NEWSTONE,
    sidebar: true,
    icon: NewstoneIcon,
    Component: Newstone
  },
  {
    label: 'Test API',
    path: PATH.TEST_API,
    devMode: true,
    sidebar: true,
    icon: DevIcon,
    Component: TestApi
  },
  {
    label: 'Web Console',
    path: PATH.WEB_CONSOLE,
    devMode: true,
    sidebar: true,
    icon: DevIcon,
    Component: WebConsole
  }
]

export default { PATH, ENDPOINTS }
