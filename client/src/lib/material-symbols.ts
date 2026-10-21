/**
 * The Material Symbols Outlined ligature names the project uses.
 *
 * The Google Fonts stylesheet is requested as a *subset*: only the glyphs
 * listed in `icon_names` are served to the browser. A ligature missing from
 * this list has no glyph in the font, so the browser cannot form the
 * ligature and renders the raw name as text ("hourglass_empty") instead of
 * an icon.
 *
 * Every `material-symbols-outlined` name used in a component must therefore
 * be listed here — otherwise it degrades to plain text, silently.
 */
export const MATERIAL_SYMBOL_ICON_NAMES = [
  "account_balance",
  "alt_route",
  "alternate_email",
  "arrow_downward",
  "arrow_forward",
  "arrow_upward",
  "assignment",
  "block",
  "cancel",
  "check",
  "check_circle",
  "chevron_left",
  "chevron_right",
  "close",
  "code",
  "code_blocks",
  "description",
  "done",
  "done_all",
  "error",
  "folder_open",
  "grading",
  "hourglass_empty",
  "inbox",
  "info",
  "layers",
  "link",
  "link_off",
  "lock",
  "login",
  "logout",
  "mark_email_read",
  "more_horiz",
  "open_in_new",
  "person",
  "public",
  "radio_button_unchecked",
  "rate_review",
  "rocket_launch",
  "schedule",
  "school",
  "search",
  "search_off",
  "security",
  "sync",
  "terminal",
  "tune",
  "unfold_more",
  "verified",
  "verified_user",
  "visibility",
  "visibility_off",
] as const;

/**
 * Stylesheet URL for the subset font.
 *
 * The variation axes are requested so the `FILL` and `GRAD` axes stay
 * available, and `display=optional` keeps the font from blocking first
 * paint — an icon that has not loaded yet is better than a stalled render.
 */
export const materialSymbolsHref =
  "https://fonts.googleapis.com/css2" +
  "?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" +
  "&display=optional" +
  `&icon_names=${MATERIAL_SYMBOL_ICON_NAMES.join(",")}`;
