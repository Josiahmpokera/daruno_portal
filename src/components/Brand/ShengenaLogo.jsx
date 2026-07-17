import main_logo from '../../assets/logo/shengena_full_logo_no_bg.png'

/**
 * Shengena brand mark.
 * Uses main_logo for all variants
 * - variant "icon" | "word" | "full" (all display the same main logo)
 */
function ShengenaLogo({
  variant = 'full',
  className = '',
  iconClassName = 'h-24 w-24 object-contain',
  wordClassName = 'h-20 w-auto object-contain',
  alt = 'Shengena',
}) {
  // All variants use the same main_logo
  return (
    <img 
      src={main_logo} 
      alt={alt} 
      className={`${iconClassName} ${className}`} 
    />
  )
}

export { main_logo as shengenaIcon, main_logo as shengenaWordmark }
export default ShengenaLogo