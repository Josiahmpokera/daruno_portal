import icon from '../../assets/logo/no_bg_shengena.png'
import wordmark from '../../assets/logo/shengena_words.png'

/**
 * Shengena brand mark.
 * Icon: no_bg_shengena.png | Word: shengena_words.png
 * - variant "icon" | "word" | "full" (icon + word)
 */
function ShengenaLogo({
  variant = 'full',
  className = '',
  iconClassName = 'h-8 w-8 object-contain',
  wordClassName = 'h-7 w-auto object-contain',
  alt = 'Shengena',
}) {
  if (variant === 'icon') {
    return (
      <img src={icon} alt={alt} className={`${iconClassName} ${className}`} />
    )
  }

  if (variant === 'word') {
    return (
      <img
        src={wordmark}
        alt={alt}
        className={`${wordClassName} ${className}`}
      />
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img src={icon} alt="" className={iconClassName} aria-hidden="true" />
      <img src={wordmark} alt={alt} className={wordClassName} />
    </span>
  )
}

export { icon as shengenaIcon, wordmark as shengenaWordmark }
export default ShengenaLogo
