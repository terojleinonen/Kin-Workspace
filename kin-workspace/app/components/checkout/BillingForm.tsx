'use client'

import { useState, useEffect } from 'react'
import { ShippingAddress, BillingAddress } from '@/app/lib/checkout-types'
import { validateEmail, validatePhone, validateZipCode } from '@/app/lib/checkout-utils'

interface BillingFormProps {
  shippingData: ShippingAddress
  data: BillingAddress
  onChange: (data: BillingAddress) => void
  onNext: () => void
  onPrev: () => void
}

export default function BillingForm({ shippingData, data, onChange, onNext, onPrev }: BillingFormProps) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Update billing data when "same as shipping" changes
  useEffect(() => {
    if (data.sameAsShipping) {
      onChange({
        ...shippingData,
        sameAsShipping: true
      })
    }
  }, [data.sameAsShipping, shippingData, onChange])

  const handleChange = (field: keyof BillingAddress, value: string | boolean) => {
    onChange({ ...data, [field]: value })
    // Clear error when user starts typing
    if (errors[field as string]) {
      setErrors({ ...errors, [field as string]: '' })
    }
  }

  const validateForm = (): boolean => {
    if (data.sameAsShipping) return true

    const newErrors: Record<string, string> = {}

    if (!data.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!data.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(data.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    if (!data.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    } else if (!validatePhone(data.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }
    if (!data.address.trim()) newErrors.address = 'Address is required'
    if (!data.city.trim()) newErrors.city = 'City is required'
    if (!data.state.trim()) newErrors.state = 'State is required'
    if (!data.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required'
    } else if (!validateZipCode(data.zipCode, data.country)) {
      newErrors.zipCode = 'Please enter a valid ZIP code'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onNext()
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <h2 className="font-satoshi font-bold text-2xl text-matte-black mb-6">
        Billing Information
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Same as Shipping Checkbox */}
        <div className="flex items-center space-x-3 p-4 bg-warm-beige/20 rounded-lg">
          <input
            type="checkbox"
            id="sameAsShipping"
            checked={data.sameAsShipping}
            onChange={(e) => handleChange('sameAsShipping', e.target.checked)}
            className="w-4 h-4 text-matte-black border-warm-beige rounded focus:ring-matte-black"
          />
          <label htmlFor="sameAsShipping" className="font-satoshi font-medium text-matte-black">
            Same as shipping address
          </label>
        </div>

        {!data.sameAsShipping && (
          <>
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={data.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.firstName ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  placeholder="Enter your first name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={data.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.lastName ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  placeholder="Enter your last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Contact Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={data.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.email ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={data.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.phone ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  placeholder="Enter your phone number"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>
            </div>

            {/* Address Fields */}
            <div>
              <label className="block font-satoshi font-medium text-matte-black mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={data.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.address ? 'border-red-500' : 'border-warm-beige'
                  }`}
                placeholder="Enter your street address"
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div>
              <label className="block font-satoshi font-medium text-matte-black mb-2">
                Apartment, suite, etc. (optional)
              </label>
              <input
                type="text"
                value={data.apartment}
                onChange={(e) => handleChange('apartment', e.target.value)}
                className="w-full px-4 py-3 border border-warm-beige rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black"
                placeholder="Apartment, suite, etc."
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.city ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label htmlFor="billing-state" className="block font-satoshi font-medium text-matte-black mb-2">
                  State *
                </label>
                <select
                  id="billing-state"
                  value={data.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.state ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  aria-label="Select billing state"
                >
                  <option value="">Select State</option>
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                  {/* Add more states as needed */}
                </select>
                {errors.state && (
                  <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                )}
              </div>

              <div>
                <label className="block font-satoshi font-medium text-matte-black mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  value={data.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-matte-black ${errors.zipCode ? 'border-red-500' : 'border-warm-beige'
                    }`}
                  placeholder="ZIP Code"
                />
                {errors.zipCode && (
                  <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <button
            type="button"
            onClick={onPrev}
            className="flex-1 btn-secondary py-3"
          >
            Back to Shipping
          </button>
          <button
            type="submit"
            className="flex-1 btn-primary py-3"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  )
}