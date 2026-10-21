// Switches for parts of the site that are not open yet.
// School sets restart in March 2027: change SETS_OPEN to true then, and the tabs, pages and Home card come back.
export const SETS_OPEN = false
export const BOOKS_OPEN = false

// Sellers must confirm their WhatsApp number with a code before listing.
// Needs the Meta template "pageplus_otp" (Approved) and META_OTP_TEMPLATE set in Vercel. Change to false to switch the code check off again.
export const PHONE_OTP_REQUIRED = true