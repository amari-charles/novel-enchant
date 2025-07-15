import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}

export function Card({ children, className = '', onClick, hover = false }: CardProps) {
  const baseClasses = 'bg-white rounded-lg border border-gray-200 shadow-sm'
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
  const clickableClasses = onClick ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
  
  const classes = `${baseClasses} ${hoverClasses} ${clickableClasses} ${className}`
  
  if (onClick) {
    return (
      <div className={classes} onClick={onClick} role="button" tabIndex={0}>
        {children}
      </div>
    )
  }
  
  return <div className={classes}>{children}</div>
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-b border-gray-200 ${className}`}>{children}</div>
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 border-t border-gray-200 ${className}`}>{children}</div>
}