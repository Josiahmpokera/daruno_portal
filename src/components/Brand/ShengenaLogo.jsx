import main_logo from '../../assets/logo/shengena_full_logo_no_bg.png'
import icon_logo from '../../assets/logo/shengena_icon.png'

/**
 * Shengena brand mark.
 * - variant "icon": square stepped mark only (compact spots such as the app rail)
 * - variant "word" | "full": full logo with wordmark
 */
function ShengenaLogo({
  variant = 'full',
  className = '',
  iconClassName = 'h-24 w-24 object-contain',
  wordClassName = 'h-20 w-auto object-contain',
  alt = 'Shengena',
}) {
  const src = variant === 'icon' ? icon_logo : main_logo

  return (
    <img
      src={src}
      alt={alt}
      className={`${iconClassName} ${className}`}
    />
  )
}

export { icon_logo as shengenaIcon, main_logo as shengenaWordmark }
export default ShengenaLogo
