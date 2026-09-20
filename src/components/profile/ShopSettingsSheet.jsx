import { useState } from 'react'
import { COUNTRIES, countryByName } from '../../data/countries'
import { CharCount, Icon, Notice, PrimaryButton, SectionLabel, Sheet, inputClass } from './Sheet'

// `profile` is the seller's sign-up profile: it pre-fills the address of a shop that has never saved one.
const ShopSettingsSheet = ({ seller, profile, onClose, onSave, onSaved }) => {
  const address = seller.address || {}
  const startCountry = address.country || profile?.country || ''
  const [form, setForm] = useState({
    shopName: seller.shopName || '',
    phoneCountry: seller.phoneCountry || countryByName(startCountry)?.code || 'US',
    phone: seller.phone || '',
    street: address.street ?? profile?.streetAddress ?? '',
    city: address.city ?? profile?.city ?? '',
    state: address.state ?? profile?.state ?? '',
    country: startCountry,
    postalCode: address.postalCode || '',
    metaTitle: seller.metaTitle || '',
    metaDescription: seller.metaDescription || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))
  const field = (key) => ({ value: form[key], onChange: (event) => update(key, event.target.value) })

  // A country stored at sign-up that is not in the list still has to show up in the picker.
  const countryOptions = form.country && !countryByName(form.country) ? [...COUNTRIES, { code: '', name: form.country, dial: '' }] : COUNTRIES
  const selectedCountry = countryByName(form.country)

  const save = async () => {
    if (saving) return
    if (!form.shopName.trim()) {
      setError('Enter a shop name.')
      return
    }
    setError('')
    setSaving(true)
    const result = await onSave(form)
    setSaving(false)
    if (result.success) onSaved('Shop settings saved')
    else setError(result.error)
  }

  return (
    <Sheet
      title="Shop settings"
      subtitle="Update your shop name, phone & SEO details."
      onClose={onClose}
      footer={
        <div className="space-y-2">
          <Notice>{error}</Notice>
          <PrimaryButton icon="save" busy={saving} onClick={save} className="w-full">
            Save changes
          </PrimaryButton>
        </div>
      }
    >
      <div>
        <SectionLabel icon="shop">Shop identity</SectionLabel>
        <input {...field('shopName')} maxLength={80} placeholder="Shop name" aria-label="Shop name" className={inputClass} />
        <CharCount value={form.shopName} max={80} />
      </div>

      <div>
        <SectionLabel icon="phone" tone="blue">Contact</SectionLabel>
        <div className="flex gap-2">
          <div className="w-28 shrink-0">
            <select {...field('phoneCountry')} aria-label="Phone country code" className={`${inputClass} cursor-pointer px-3`}>
              {COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.code} {country.dial} {country.name}
                </option>
              ))}
            </select>
          </div>
          <input {...field('phone')} type="tel" inputMode="tel" maxLength={30} placeholder="Phone number" aria-label="Phone number" className={inputClass} />
        </div>
      </div>

      <div>
        <SectionLabel icon="pin" tone="orange">Address</SectionLabel>
        <div className="space-y-2">
          <input {...field('street')} maxLength={200} placeholder="Street address" aria-label="Street address" className={inputClass} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input {...field('city')} maxLength={80} placeholder="City" aria-label="City" className={inputClass} />
            <input {...field('state')} maxLength={80} placeholder="State / region" aria-label="State or region" className={inputClass} />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-gray-500">
                {selectedCountry?.code || '--'}
              </span>
              <select {...field('country')} aria-label="Country" className={`${inputClass} cursor-pointer appearance-none pl-10 pr-9`}>
                {!form.country && <option value="">Select country</option>}
                {countryOptions.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Icon name="chevronDown" />
              </span>
            </div>
            <input {...field('postalCode')} maxLength={20} placeholder="Postal code" aria-label="Postal code" className={inputClass} />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel icon="doc" tone="emerald">Search appearance</SectionLabel>
        <input {...field('metaTitle')} maxLength={60} placeholder="Meta title" aria-label="Meta title" className={inputClass} />
        <CharCount value={form.metaTitle} max={60} />
        <textarea
          {...field('metaDescription')}
          maxLength={160}
          rows={3}
          placeholder="Meta description"
          aria-label="Meta description"
          className={`${inputClass} mt-2 resize-none`}
        />
        <CharCount value={form.metaDescription} max={160} />
      </div>
    </Sheet>
  )
}

export default ShopSettingsSheet
