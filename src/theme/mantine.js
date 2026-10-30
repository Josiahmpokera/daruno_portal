/** Mantine v6 theme aligned with the Shengena teal #12544f (shared with the ERP and HR desk) */

export const shengenaMantineTheme = {
  primaryColor: 'brand',
  fontFamily:
    '"Inter Variable", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  defaultRadius: 'md',
  colors: {
    brand: [
      '#e7f1f0',
      '#c4dcd9',
      '#9dc4c0',
      '#74aca6',
      '#4f938c',
      '#2f7a72',
      '#1b635c',
      '#12544f',
      '#0f4743',
      '#0c3b37',
    ],
  },
  primaryShade: 7,
  components: {
    Button: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
}
