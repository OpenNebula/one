import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: ({ isSelected }) => ({
    height: '100%',
    transition: theme.transitions.create(
      ['background-color', 'box-shadow'], { duration: '0.2s' }
    ),
    '&:hover': {
      boxShadow: theme.shadows['5']
    },
    ...(isSelected && {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.main,
      '& .badge': {
        color: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.contrastText
      }
    })
  }),
  actionArea: {
    '&:disabled': {
      filter: 'brightness(0.5)'
    }
  },
  mediaActionArea: {
    '&:hover': {
      backgroundColor: theme.palette.secondary.contrastText,
      '& $media': { filter: 'none' }
    }
  },
  media: {
    width: '100%',
    paddingTop: '38.85%',
    overflow: 'hidden',
    position: 'relative',
    '& img': {
      width: '100%',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    },
    transition: theme.transitions.create('filter', { duration: '0.2s' }),
    filter: ({ isSelected, disableFilterImage }) => {
      return disableFilterImage
        ? 'none'
        : (theme.palette.type === 'dark' || isSelected)
          ? 'contrast(0) brightness(2)'
          : 'contrast(0) brightness(0.8)'
    }
  },
  headerRoot: {
    // align header icon to top
    alignItems: 'end'
  },
  headerContent: { overflow: 'auto' },
  headerAvatar: {
    display: 'flex',
    color: ({ isSelected }) => isSelected
      ? theme.palette.secondary.contrastText
      : theme.palette.text.primary
  },
  subheader: {
    color: ({ isSelected }) =>
      isSelected ? 'inherit' : theme.palette.text.secondary,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  }
}))
