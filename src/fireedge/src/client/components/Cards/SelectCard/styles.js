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
      },
      '& $subheader': { color: 'inherit' }
    })
  }),
  actionArea: {
    height: '100%',
    minHeight: ({ minHeight = 140 }) => minHeight
  },
  mediaActionArea: {
    display: 'flex',
    height: ({ mediaHeight = 140 }) => mediaHeight,
    '&:hover': {
      backgroundColor: theme.palette.secondary.contrastText,
      '& $media': { filter: 'none' }
    }
  },
  media: {
    transition: theme.transitions.create('filter', { duration: '0.2s' }),
    filter: ({ isSelected }) => (theme.palette.type === 'dark' || isSelected)
      ? 'contrast(0) brightness(2)'
      : 'contrast(0) brightness(0.8)'
  },
  headerRoot: { alignItems: 'end' },
  headerContent: { overflow: 'auto' },
  headerAvatar: {
    display: 'flex',
    color: ({ isSelected }) => isSelected
      ? theme.palette.secondary.contrastText
      : theme.palette.text.primary
  },
  subheader: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  }
}))
