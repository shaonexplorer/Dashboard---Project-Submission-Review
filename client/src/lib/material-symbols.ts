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
  "add",
  "alt_route",
  "alternate_email",
  "archive",
  "arrow_back",
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
  "commit",
  "content_copy",
  "description",
  "done",
  "done_all",
  "edit",
  "error",
  "error_outline",
  "expand_more",
  "fact_check",
  "folder_open",
  "grading",
  "hourglass_empty",
  "hourglass_top",
  "inventory_2",
  "inbox",
  "info",
  "layers",
  "link",
  "link_off",
  "lock",
  "login",
  "logout",
  "mark_email_read",
  "menu",
  "more_horiz",
  "more_vert",
  "open_in_new",
  "person",
  "policy",
  "public",
  "radio_button_unchecked",
  "rate_review",
  "rocket_launch",
  "schedule",
  "school",
  "search",
  "search_off",
  "security",
  "source",
  "sync",
  "terminal",
  "timeline",
  "tune",
  "unfold_more",
  "upload_file",
  "verified",
  "verified_user",
  "visibility",
  "visibility_off",
] as const;

/**
 * Stylesheet URL for the subset font.
 *
 * The variation axes are requested so the `FILL` and `GRAD` axes stay
 * available.
 *
 * `display=block` is deliberate. These icons are *ligatures*: the browser
 * turns the literal text "expand_more" into a glyph. Until the font arrives
 * there is no glyph to draw, so the fallback renders the raw name — the user
 * sees "expand_more" spelled out on the page.
 *
 * `optional` is the worst possible choice here. It gives the font a ~100ms
 * block period; if the font misses it, the browser keeps the fallback for
 * the lifetime of the page and never swaps, so *every* icon on the page
 * stays spelled out even though the font has since loaded. `block` hides
 * the text for up to 3s instead, which is invisible in practice — and when
 * it fails, it fails as blank space rather than as a wall of icon names.
 */
export const materialSymbolsHref =
  "https://fonts.googleapis.com/css2" +
  "?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" +
  "&display=block" +
  `&icon_names=${MATERIAL_SYMBOL_ICON_NAMES.join(",")}`;
