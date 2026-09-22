import { Link } from 'react-router-dom'

const Page = ({ title, intro, sections, updated = 'September 2026' }) => (
  <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
    <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#0a3d62] mb-2">Legal</p>
    <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">{title}</h1>
    <p className="text-sm text-gray-500 mb-6">Last updated {updated}</p>
    <p className="text-gray-600 leading-relaxed mb-10">{intro}</p>
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{section.heading}</h2>
          {section.body.map((paragraph, i) => (
            <p key={i} className="text-gray-600 leading-relaxed mb-3">{paragraph}</p>
          ))}
        </section>
      ))}
    </div>
    <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-6 text-sm font-semibold text-[#0a3d62]">
      <Link to="/privacy" className="hover:underline">Privacy</Link>
      <Link to="/terms" className="hover:underline">Terms</Link>
      <Link to="/cookies" className="hover:underline">Cookies</Link>
      <Link to="/" className="hover:underline ml-auto">Back to store</Link>
    </div>
  </div>
)

export const Privacy = () => (
  <Page
    title="Privacy Policy"
    intro="This policy explains what information U Seller Store collects when you use the store, how we use it, and the choices you have."
    sections={[
      {
        heading: 'Information we collect',
        body: [
          'Account details you give us, such as your name and email address when you sign up, and delivery details when you place an order.',
          'Basic usage information, such as the pages you visit and the items you add to your cart or wishlist, so the store works as expected.',
        ],
      },
      {
        heading: 'How we use it',
        body: [
          'To create and manage your account, process and deliver your orders, answer your questions, and keep the store secure.',
          'We do not sell your personal information.',
        ],
      },
      {
        heading: 'Your choices',
        body: [
          'You can review or update your account details from your profile, remove items from your wishlist and cart at any time, and log out whenever you like. To ask for your data to be corrected or deleted, contact us using the address in the footer.',
        ],
      },
    ]}
  />
)

export const Terms = () => (
  <Page
    title="Terms of Service"
    intro="By using U Seller Store you agree to these terms. Please read them before placing an order."
    sections={[
      {
        heading: 'Using the store',
        body: [
          'You must provide accurate information when you create an account or place an order, and keep your login details private.',
          'Product descriptions, images and prices are provided in good faith and may change without notice.',
        ],
      },
      {
        heading: 'Orders and payment',
        body: [
          'An order is confirmed once we have accepted it. We may cancel an order if an item is unavailable or an error in the listing is found; in that case you will not be charged.',
        ],
      },
      {
        heading: 'Returns',
        body: [
          'We offer a 30-day return window on eligible items. Items should be returned in their original condition.',
        ],
      },
    ]}
  />
)

export const Cookies = () => (
  <Page
    title="Cookie Policy"
    intro="We use a small amount of browser storage to make the store work and to remember your choices."
    sections={[
      {
        heading: 'What we store',
        body: [
          'Your cart, wishlist and login session are kept in your browser so they are still there when you come back.',
        ],
      },
      {
        heading: 'Managing storage',
        body: [
          'You can clear this data at any time from your browser settings. Doing so will empty your cart and wishlist and log you out.',
        ],
      },
    ]}
  />
)
