import { render, screen } from '@testing-library/react'
import LoadingSpinner from '../components/LoadingSpinner'

describe('LoadingSpinner', () => {
  test('renders spinner with default props', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId('loading-spinner')
    expect(spinner).toBeInTheDocument()
  })

  test('renders with text', () => {
    render(<LoadingSpinner text="Loading..." />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  test('renders full screen', () => {
    render(<LoadingSpinner fullScreen />)
    const container = document.querySelector('.fixed.inset-0')
    expect(container).toBeInTheDocument()
  })

  test('applies correct size classes', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = screen.getByTestId('loading-spinner').querySelector('.animate-spin')
    expect(spinner).toHaveClass('h-12', 'w-12')
  })
})