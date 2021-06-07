import loadable from '@loadable/component'
import {
  Code as DevIcon,
  ViewGrid as VmIcon
} from 'iconoir-react'

const VirtualMachines = loadable(() => import('client/containers/VirtualMachines'), { ssr: false })
const TestApi = loadable(() => import('client/containers/TestApi'), { ssr: false })
const WebConsole = loadable(() => import('client/containers/WebConsole'), { ssr: false })

export const PATH = {
  VIRTUAL_MACHINES: '/vms',
  TEST_API: '/test-api',
  WEB_CONSOLE: '/webconsole'
}

export const ENDPOINTS = [
  {
    label: 'VMs',
    path: PATH.VIRTUAL_MACHINES,
    devMode: true,
    sidebar: true,
    icon: VmIcon,
    Component: VirtualMachines
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
