import { render, screen } from '@testing-library/react'
import Header from '../../components/Header'

// Mock the ConnectButton component
jest.mock('../../components/ConnectButton', () => {
  return function MockConnectButton() {
    return <div data-testid="connect-button">Connect Wallet</div>
  }
})

describe('Header', () => {
  it('renders the logo and title', () => {
    render(<Header />)
    
    expect(screen.getByText('FX-Remit')).toBeInTheDocument()
    expect(screen.getByAltText('FX-Remit Logo')).toBeInTheDocument()
  })

  it('renders the connect button', () => {
    render(<Header />)
    
    expect(screen.getByTestId('connect-button')).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    render(<Header />)
    
    expect(screen.getByText('Send')).toBeInTheDocument()
    expect(screen.getByText('History')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    render(<Header />)
    
    const header = screen.getByRole('banner')
    expect(header).toHaveClass('bg-white', 'shadow-sm', 'border-b')
  })
}) 