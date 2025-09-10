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
import { colors as sunstoneColors } from '@modules/providers/theme/colors'
import { alpha, colors as materialColors } from '@mui/material'

const primaryColor = sunstoneColors.blue[600]
const secondaryColor = sunstoneColors.grey[600]

export const lightPalette = {
  mode: 'light',

  // Primary color for app and MUI library
  primary: {
    main: primaryColor,
    light: sunstoneColors.blue[500],
    dark: sunstoneColors.blue[700],
    contrastText: '#FFFFFF',
  },

  // Secondary color for MUI library
  secondary: {
    main: secondaryColor,
    light: sunstoneColors.grey[500],
    dark: sunstoneColors.grey[700],
    contrastText: '#fff',
  },

  logo: {
    color: primaryColor,
    spinnerColor: sunstoneColors.white,
    textColorOpen: primaryColor,
    textColorNebula: primaryColor,
    textColorBeta: sunstoneColors.white,
  },

  // Main container of the app
  mainContainer: {
    backgroundColor: sunstoneColors.grey[100],
  },

  // Buttons used in the app
  buttons: {
    main: {
      filled: {
        normal: {
          backgroundColor: primaryColor,
          color: sunstoneColors.white,
          borderColor: primaryColor,
        },
        hover: {
          backgroundColor: sunstoneColors.blue[700],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.blue[700],
        },
        focus: {
          backgroundColor: sunstoneColors.blue[700],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.blue[700],
        },
        active: {
          backgroundColor: sunstoneColors.blue[700],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.blue[700],
        },
        disabled: {
          backgroundColor: sunstoneColors.grey[300],
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.grey[300],
        },
      },
      outlined: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        hover: {
          backgroundColor: alpha(sunstoneColors.blue[700], 0.12),
          color: sunstoneColors.darkBlue[500],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: sunstoneColors.blue[700],
          color: sunstoneColors.white,
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: sunstoneColors.blue[700],
          color: sunstoneColors.white,
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.grey[500],
        },
      },
    },
    secondary: {
      filled: {
        normal: {
          backgroundColor: sunstoneColors.grey[300],
          color: sunstoneColors.darkGrey[400],
          borderColor: sunstoneColors.grey[300],
        },
        hover: {
          backgroundColor: sunstoneColors.grey[200],
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: alpha(primaryColor, 0.1),
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: alpha(primaryColor, 0.1),
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: sunstoneColors.grey[300],
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.grey[300],
        },
      },
      outlined: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[400],
          borderColor: sunstoneColors.darkGrey[400],
        },
        hover: {
          backgroundColor: sunstoneColors.grey[200],
          color: sunstoneColors.darkBlue[500],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: alpha(sunstoneColors.blue[700], 0.12),
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: alpha(sunstoneColors.blue[700], 0.12),
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.grey[500],
        },
      },
      outlinedIcon: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[400],
          borderColor: sunstoneColors.darkGrey[400],
        },
        hover: {
          backgroundColor: sunstoneColors.grey[200],
          color: sunstoneColors.darkBlue[500],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: alpha(sunstoneColors.blue[700], 0.12),
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: alpha(sunstoneColors.blue[700], 0.12),
          color: sunstoneColors.darkGrey[400],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.grey[500],
        },
      },
      noborder: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkBlue[500],
        },
        hover: {
          backgroundColor: 'transparent',
          color: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[400],
        },
      },
    },
    danger: {
      outlined: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.red[200],
          borderColor: sunstoneColors.red[200],
        },
        hover: {
          backgroundColor: sunstoneColors.red[200],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.red[200],
        },
        active: {
          backgroundColor: sunstoneColors.red[200],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.red[200],
        },
        focus: {
          backgroundColor: sunstoneColors.red[200],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.red[200],
        },
        disabled: {
          backgroundColor: sunstoneColors.grey[300],
          textColor: sunstoneColors.grey[500],
          borderColor: sunstoneColors.grey[300],
        },
      },
    },
  },

  // Colors of Enhanced table component
  tables: {
    cards: {
      normal: {
        backgroundColor: sunstoneColors.white,
        hover: {
          backgroundColor: sunstoneColors.grey[200],
        },
      },
      pressed: {
        backgroundColor: sunstoneColors.white,
        borderColor: sunstoneColors.blue[500],
        hover: {
          backgroundColor: sunstoneColors.grey[200],
          borderColor: sunstoneColors.blue[500],
        },
      },
    },
    refreshIcon: {
      backgroundColor: 'transparent',
      color: primaryColor,
      borderColor: primaryColor,
    },
  },

  // Info tabs of resources
  tabs: {
    header: {
      borderColor: sunstoneColors.blue[500],
      insideBorderColor: sunstoneColors.grey[400],
      indicatorColor: primaryColor,
      backgroundColor: sunstoneColors.white,
      color: sunstoneColors.grey[600],
      hover: {
        backgroundColor: sunstoneColors.grey[200],
        color: sunstoneColors.grey[600],
      },
      selected: {
        backgroundColor: sunstoneColors.white,
        color: sunstoneColors.darkBlue[500],
      },
    },
    content: {
      borderColor: sunstoneColors.blue[500],
      backgroundColor: sunstoneColors.white,
    },
  },

  // Search bar of the tables
  searchBar: {
    normal: {
      backgroundColor: sunstoneColors.grey[300],
      color: sunstoneColors.grey[500],
      borderColor: sunstoneColors.grey[300],
    },
    hover: {
      backgroundColor: sunstoneColors.grey[300],
      color: sunstoneColors.grey[500],
      borderColor: primaryColor,
    },
    focus: {
      backgroundColor: alpha(primaryColor, 0.1),
      color: primaryColor,
      borderColor: primaryColor,
    },
    icon: {
      color: sunstoneColors.grey[700],
    },
  },

  // Sidebar menu colors
  sidebar: {
    backgroundColorSelectedLink: sunstoneColors.grey[300],
    backgroundColorSelectedCollapse: sunstoneColors.grey[300],
    backgroundColorHover: sunstoneColors.grey[100],
    colorTextParent: sunstoneColors.grey[600],
    colorTextChildSelected: primaryColor,
  },

  // Scrollbar color
  scrollbar: {
    color: sunstoneColors.grey[400],
  },

  // Login colors
  login: {
    backgroundColor: sunstoneColors.white,
  },

  // Switch between card and list component
  switchViewTable: {
    button: {
      normal: {
        backgroundColor: 'transparent',
        borderColor: sunstoneColors.grey[600],
        color: sunstoneColors.grey[700],
      },
      hover: {
        backgroundColor: sunstoneColors.grey[200],
      },
      selected: {
        backgroundColor: alpha(primaryColor, 0.12),
      },
    },
    icon: {
      color: sunstoneColors.grey[700],
    },
  },

  // Breadcrumb colors
  breadCrumb: {
    title: {
      color: sunstoneColors.grey[700],
    },
    navigate: {
      color: primaryColor,
    },
    navigateDeactive: {
      color: sunstoneColors.grey[500],
      hover: {
        color: sunstoneColors.blue[500],
      },
    },
  },

  accentColor: {
    main: sunstoneColors.yellow[700],
  },
  common: {
    common: {
      black: sunstoneColors.black,
      white: sunstoneColors.white,
    },
  },
  background: {
    paper: '#FFFFFF',
    default: '#F2F4F8',
  },

  // Topbar colors
  topbar: {
    backgroundColor: sunstoneColors.grey[100],
    color: sunstoneColors.grey[600],
    borderBottomColor: sunstoneColors.grey[400],
  },

  // Footer colors
  footer: {
    backgroundColor: sunstoneColors.grey[300],
    color: sunstoneColors.grey[700],
  },

  // Graphs colors
  graphs: {
    legend: '#B2B9BE',
    vm: {
      cpu: {
        real: '#0098C3',
        forecast: '#D65108',
        forecastFar: '#B2B9BE',
      },
      memory: {
        real: '#0098C3',
        forecast: '#D65108',
        forecastFar: '#B2B9BE',
      },
      diskReadBytes: {
        real: '#0098C3',
        forecast: '#D782BA',
        forecastFar: '#D65108',
      },
      diskReadIOPS: {
        real: '#0098C3',
        forecast: '#D782BA',
        forecastFar: '#D65108',
      },
      diskWriteBytes: {
        real: '#0098C3',
        forecast: '#D782BA',
        forecastFar: '#D65108',
      },
      diskWriteIOPS: {
        real: '#0098C3',
        forecast: '#D782BA',
        forecastFar: '#D65108',
      },
      netDownloadSpeed: {
        real: '#0098C3',
        forecast: '#D782BA',
        forecastFar: '#D65108',
      },
      netUploadSpeed: {
        real: '#0098C3',
        forecast: '#D782BA',
        forecastFar: '#D65108',
      },
    },
    host: {
      cpu: {
        free: {
          real: '#67FFA7',
          forecast: '#23CE6B',
          forecastFar: '#00461E',
        },
        used: {
          real: '#FF5779',
          forecast: '#A20021',
          forecastFar: '#500010',
        },
      },
      memory: {
        free: {
          real: '#67FFA7',
          forecast: '#23CE6B',
          forecastFar: '#00461E',
        },
        used: {
          real: '#FF5779',
          forecast: '#A20021',
          forecastFar: '#500010',
        },
      },
    },
    cloud: {
      titles: {
        color: primaryColor,
      },
      bars: {
        used: primaryColor,
        total: sunstoneColors.grey[300],
      },
      cpu: {
        real: primaryColor,
      },
      memory: {
        real: primaryColor,
      },
      networks: {
        netDownloadSpeed: primaryColor,
        netUploadSpeed: sunstoneColors.grey[600],
      },
      disks: {
        diskReadIOPS: primaryColor,
        diskWriteIOPS: sunstoneColors.grey[600],
      },
      hostCpu: {
        real: primaryColor,
      },
      hostMemory: {
        real: primaryColor,
      },
    },
    axis: {
      color: sunstoneColors.black,
    },
  },
  sunstoneColors: sunstoneColors,

  error: {
    100: '#e98e7f',
    200: '#ee6d58',
    300: '#e95f48',
    400: '#e34e3b',
    500: '#dd452c',
    600: '#d73727',
    700: '#cf231c',
    800: '#c61414',
    light: '#ee6d58',
    main: '#cf231c',
    dark: '#c61414',
    contrastText: '#FFFFFF',
  },
  warning: {
    100: '#fff4db',
    200: '#ffedc2',
    300: '#ffe4a3',
    400: '#ffc980',
    500: '#fcc419',
    600: '#fab005',
    700: '#f1a204',
    800: '#db9a00',
    light: '#ffe4a3',
    main: '#f1a204',
    dark: '#f1a204',
    contrastText: '#000000',
  },
  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#01579b',
    contrastText: '#000000',
  },
  success: {
    100: '#bce1bd',
    200: '#a6d7a8',
    300: '#8fcd92',
    400: '#79c37c',
    500: '#62b966',
    600: '#4caf50',
    700: '#419b46',
    800: '#388e3c',
    light: '#3adb76',
    main: '#4caf50',
    dark: '#388e3c',
    contrastText: '#000000',
  },
  debug: {
    light: materialColors.grey[300],
    main: materialColors.grey[600],
    dark: materialColors.grey[700],
    contrastText: '#FFFFFF',
  },
}
