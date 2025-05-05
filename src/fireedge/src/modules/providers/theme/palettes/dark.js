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
import { colors as materialColors, alpha } from '@mui/material'
import { colors as sunstoneColors } from '@modules/providers/theme/colors'

const primaryColor = sunstoneColors.blue[400]
const secondaryColor = sunstoneColors.darkBlue[400]

export const darkPalette = {
  mode: 'dark',

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
    light: sunstoneColors.darkBlue[300],
    dark: sunstoneColors.darkBlue[500],
    contrastText: '#fff',
  },

  // Main container of the app
  mainContainer: {
    backgroundColor: sunstoneColors.darkBlue[500],
  },

  // Buttons used in the app
  buttons: {
    main: {
      filled: {
        normal: {
          backgroundColor: primaryColor,
          color: sunstoneColors.darkBlue[500],
          borderColor: primaryColor,
        },
        hover: {
          backgroundColor: sunstoneColors.blue[300],
          color: sunstoneColors.darkBlue[500],
          borderColor: sunstoneColors.blue[300],
        },
        focus: {
          backgroundColor: sunstoneColors.blue[300],
          color: sunstoneColors.darkBlue[500],
          borderColor: sunstoneColors.blue[300],
        },
        active: {
          backgroundColor: sunstoneColors.blue[300],
          color: sunstoneColors.darkBlue[500],
          borderColor: sunstoneColors.blue[300],
        },
        disabled: {
          backgroundColor: sunstoneColors.darkGrey[400],
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.darkGrey[400],
        },
      },
      outlined: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        hover: {
          backgroundColor: 'transparent',
          color: sunstoneColors.blue[100],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: 'transparent',
          color: sunstoneColors.blue[100],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: 'transparent',
          color: sunstoneColors.blue[100],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[100],
          borderColor: sunstoneColors.darkGrey[100],
        },
      },
    },
    secondary: {
      filled: {
        normal: {
          backgroundColor: sunstoneColors.darkBlue[300],
          color: sunstoneColors.grey[100],
          borderColor: sunstoneColors.darkBlue[300],
        },
        hover: {
          backgroundColor: sunstoneColors.darkBlue[200],
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: sunstoneColors.darkGrey[400],
          color: sunstoneColors.grey[500],
          borderColor: sunstoneColors.darkGrey[400],
        },
      },
      outlined: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[200],
          borderColor: sunstoneColors.grey[200],
        },
        hover: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[100],
          borderColor: sunstoneColors.darkGrey[100],
        },
      },
      outlinedIcon: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[200],
          borderColor: sunstoneColors.grey[200],
        },
        hover: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        active: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        focus: {
          backgroundColor: alpha(primaryColor, 0.12),
          color: sunstoneColors.grey[100],
          borderColor: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[100],
          borderColor: sunstoneColors.darkGrey[100],
        },
      },
      noborder: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.grey[200],
        },
        hover: {
          backgroundColor: 'transparent',
          color: primaryColor,
        },
        disabled: {
          backgroundColor: 'transparent',
          color: sunstoneColors.darkGrey[100],
        },
      },
    },
    danger: {
      outlined: {
        normal: {
          backgroundColor: 'transparent',
          color: sunstoneColors.red[100],
          borderColor: sunstoneColors.red[100],
        },
        hover: {
          backgroundColor: sunstoneColors.red[100],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.red[100],
        },
        active: {
          backgroundColor: sunstoneColors.red[100],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.red[100],
        },
        focus: {
          backgroundColor: sunstoneColors.red[100],
          color: sunstoneColors.white,
          borderColor: sunstoneColors.red[100],
        },
        disabled: {
          backgroundColor: 'transparent',
          textColor: sunstoneColors.grey[100],
          borderColor: sunstoneColors.grey[100],
        },
      },
    },
  },

  // Colors of Enhanced table component
  tables: {
    cards: {
      normal: {
        backgroundColor: sunstoneColors.darkBlue[400],
        hover: {
          backgroundColor: sunstoneColors.darkBlue[300],
        },
      },
      pressed: {
        backgroundColor: sunstoneColors.darkBlue[400],
        borderColor: sunstoneColors.blue[500],
        hover: {
          backgroundColor: sunstoneColors.darkBlue[300],
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
      borderColor: primaryColor,
      insideBorderColor: sunstoneColors.darkBlue[400],
      indicatorColor: sunstoneColors.blue[600],
      backgroundColor: sunstoneColors.darkBlue[400],
      color: sunstoneColors.grey[400],
      hover: {
        backgroundColor: sunstoneColors.darkBlue[300],
        color: sunstoneColors.grey[400],
      },
      selected: {
        backgroundColor: sunstoneColors.darkBlue[400],
        color: sunstoneColors.grey[200],
      },
    },
    content: {
      borderColor: primaryColor,
      backgroundColor: sunstoneColors.darkBlue[400],
    },
  },

  // Search bar of the tables
  searchBar: {
    normal: {
      backgroundColor: sunstoneColors.darkBlue[300],
      color: sunstoneColors.grey[300],
      borderColor: sunstoneColors.darkBlue[300],
    },
    hover: {
      backgroundColor: sunstoneColors.darkBlue[200],
      color: sunstoneColors.grey[300],
      borderColor: primaryColor,
    },
    focus: {
      backgroundColor: alpha(primaryColor, 0.12),
      color: primaryColor,
      borderColor: primaryColor,
    },
    icon: {
      color: sunstoneColors.grey[300],
    },
  },

  // Sidebar menu colors
  sidebar: {
    backgroundColorSelectedLink: sunstoneColors.darkBlue[200],
    backgroundColorSelectedCollapse: sunstoneColors.darkBlue[200],
    backgroundColorHover: sunstoneColors.darkBlue[100],
  },

  // Scrollbar color
  scrollbar: {
    color: sunstoneColors.grey[400],
  },

  // Login colors
  login: {
    backgroundColor: sunstoneColors.darkBlue[400],
  },

  // Switch between card and list component
  switchViewTable: {
    button: {
      normal: {
        backgroundColor: 'transparent',
        borderColor: sunstoneColors.grey[200],
        color: sunstoneColors.grey[100],
      },
      hover: {
        backgroundColor: sunstoneColors.darkBlue[400],
      },
      selected: {
        backgroundColor: alpha(primaryColor, 0.4),
      },
    },
    icon: {
      color: sunstoneColors.grey[100],
    },
  },

  // Breadcrumb colors
  breadCrumb: {
    title: {
      color: sunstoneColors.grey[100],
    },
  },

  accentColor: {
    main: sunstoneColors.yellow[700],
  },
  common: {
    black: sunstoneColors.black,
    white: sunstoneColors.white,
  },
  background: {
    paper: '#2a2d3d',
    default: '#222431',
  },

  // Topbar colors
  topbar: {
    backgroundColor: sunstoneColors.darkBlue[500],
    color: primaryColor,
    borderBottomColor: sunstoneColors.darkBlue[100],
  },

  // Footer colors
  footer: {
    backgroundColor: sunstoneColors.darkBlue[400],
    color: sunstoneColors.grey[200],
  },

  // Graphs colors
  graphs: {
    vm: {
      cpu: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      memory: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      diskReadBytes: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      diskReadIOPS: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      diskWriteBytes: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      diskWriteIOPS: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      netDownloadSpeed: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
      netUploadSpeed: {
        real: primaryColor,
        forecast: sunstoneColors.grey[300],
        forecastFar: '#DEA700',
      },
    },
    host: {
      cpu: {
        free: {
          real: '#C93F7A',
          forecast: '#A892E1',
          forecastFar: '#FF7D2E	',
        },
        used: {
          real: primaryColor,
          forecast: sunstoneColors.grey[300],
          forecastFar: '#DEA700',
        },
      },
      memory: {
        free: {
          real: '#C93F7A',
          forecast: '#A892E1',
          forecastFar: '#FF7D2E',
        },
        used: {
          real: primaryColor,
          forecast: sunstoneColors.grey[300],
          forecastFar: '#DEA700',
        },
      },
    },
    cloud: {
      cpu: {
        real: primaryColor,
      },
      memory: {
        real: primaryColor,
      },
      networks: {
        netDownloadSpeed: primaryColor,
        netUploadSpeed: sunstoneColors.grey[300],
      },
      disks: {
        diskReadIOPS: primaryColor,
        diskWriteIOPS: sunstoneColors.grey[300],
      },
      hostCpu: {
        real: primaryColor,
      },
      hostMemory: {
        real: primaryColor,
      },
    },
    axis: {
      color: sunstoneColors.white,
    },
  },

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
    contrastText: '#FFFFFF',
  },
  info: {
    light: '#64b5f6',
    main: '#2196f3',
    dark: '#01579b',
    contrastText: '#FFFFFF',
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
    contrastText: '#FFFFFF',
  },
  debug: {
    light: materialColors.grey[300],
    main: materialColors.grey[600],
    dark: materialColors.grey[700],
    contrastText: '#FFFFFF',
  },
}
