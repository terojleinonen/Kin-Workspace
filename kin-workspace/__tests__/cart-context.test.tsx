import React from 'react'
import { render, screen, act, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CartProvider, useCart } from '../app/contexts/CartContext'
import { Product } from '../app/lib/types'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Test component that uses the cart context
function TestComponent() {
  const { 
    cart, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    isOpen,
    openCart,
    closeCart
  } = useCart()

  const mockProduct: Product = {
    id: 'test-product-1',
    name: 'Test Desk',
    price: 299.99,
    image: '/test-image.jpg',
    category: 'Desks',
    slug: 'test-desk'
  }

  return (
    <div>
      <div data-testid="cart-total">{cart.total}</div>
      <div data-testid="cart-count">{cart.itemCount}</div>
      <div data-testid="cart-items-length">{cart.items.length}</div>
      <div data-testid="cart-open">{isOpen ? 'open' : 'closed'}</div>
      
      <button onClick={() => addToCart(mockProduct)} data-testid="add-to-cart">
        Add to Cart
      </button>
      <button onClick={() => addToCart(mockProduct, 3)} data-testid="add-multiple">
        Add 3 to Cart
      </button>
      <button onClick={() => removeFromCart('test-product-1')} data-testid="remove-from-cart">
        Remove from Cart
      </button>
      <button onClick={() => updateQuantity('test-product-1', 5)} data-testid="update-quantity">
        Update Quantity
      </button>
      <button onClick={clearCart} data-testid="clear-cart">
        Clear Cart
      </button>
      <button onClick={openCart} data-testid="open-cart">
        Open Cart
      </button>
      <button onClick={closeCart} data-testid="close-cart">
        Close Cart
      </button>
    </div>
  )
}

describe('CartContext', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
  })

  test('should provide initial cart state', () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
    expect(screen.getByTestId('cart-items-length')).toHaveTextContent('0')
    expect(screen.getByTestId('cart-open')).toHaveTextContent('closed')
  })

  test('should add product to cart', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    await user.click(screen.getByTestId('add-to-cart'))

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('299.99')
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
      expect(screen.getByTestId('cart-items-length')).toHaveTextContent('1')
    })
  })

  test('should add multiple quantities to cart', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    await user.click(screen.getByTestId('add-multiple'))

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('899.97') // 299.99 * 3
      expect(screen.getByTestId('cart-count')).toHaveTextContent('3')
      expect(screen.getByTestId('cart-items-length')).toHaveTextContent('1')
    })
  })

  test('should remove product from cart', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add item first
    await user.click(screen.getByTestId('add-to-cart'))
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-items-length')).toHaveTextContent('1')
    })

    // Remove item
    await user.click(screen.getByTestId('remove-from-cart'))

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-items-length')).toHaveTextContent('0')
    })
  })

  test('should update item quantity', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add item first
    await user.click(screen.getByTestId('add-to-cart'))
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('1')
    })

    // Update quantity
    await user.click(screen.getByTestId('update-quantity'))

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('1499.95') // 299.99 * 5
      expect(screen.getByTestId('cart-count')).toHaveTextContent('5')
    })
  })

  test('should clear cart', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    // Add items first
    await user.click(screen.getByTestId('add-to-cart'))
    await user.click(screen.getByTestId('add-to-cart'))
    
    await waitFor(() => {
      expect(screen.getByTestId('cart-count')).toHaveTextContent('2')
    })

    // Clear cart
    await user.click(screen.getByTestId('clear-cart'))

    await waitFor(() => {
      expect(screen.getByTestId('cart-total')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-count')).toHaveTextContent('0')
      expect(screen.getByTestId('cart-items-length')).toHaveTextContent('0')
    })
  })

  test('should open and close cart', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('cart-open')).toHaveTextContent('closed')

    await user.click(screen.getByTestId('open-cart'))
    expect(screen.getByTestId('cart-open')).toHaveTextContent('open')

    await user.click(screen.getByTestId('close-cart'))
    expect(screen.getByTestId('cart-open')).toHaveTextContent('closed')
  })

  test('should persist cart to localStorage', async () => {
    const user = userEvent.setup()
    
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    await user.click(screen.getByTestId('add-to-cart'))

    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'kin-workspace-cart',
        expect.stringContaining('test-product-1')
      )
    })
  })

  test('should load cart from localStorage', () => {
    const savedCart = JSON.stringify({
      items: [{
        id: 'test-item-1',
        product: {
          id: 'test-product-1',
          name: 'Test Desk',
          price: 299.99,
          image: '/test-image.jpg',
          category: 'Desks',
          slug: 'test-desk'
        },
        quantity: 2
      }],
      total: 599.98,
      itemCount: 2
    })

    localStorageMock.getItem.mockReturnValue(savedCart)

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    )

    expect(screen.getByTestId('cart-total')).toHaveTextContent('599.98')
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2')
    expect(screen.getByTestId('cart-items-length')).toHaveTextContent('1')
  })
})