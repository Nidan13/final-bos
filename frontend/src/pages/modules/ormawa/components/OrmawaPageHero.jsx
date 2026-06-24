import React from 'react'
import { DashboardHero } from '@/components/ui/dashboard'
import { useSuperAdminOrmawa } from '@/contexts/SuperAdminOrmawaContext'
import useAuthStore from '@/store/useAuthStore'

export function OrmawaPageHero({ title, subtitle, icon, actions }) {
  let selectedOrmawa = null
  
  // Attempt to safely get Super Admin context if available
  try {
    const context = useSuperAdminOrmawa()
    selectedOrmawa = context?.selectedOrmawa
  } catch (e) {
    // Context not available, meaning this is accessed by a regular Ormawa Admin
  }

  // Get current user role
  const user = useAuthStore(state => state.user)
  const isSuperAdmin = user?.role?.includes('super_admin') || window.__SUPER_ADMIN_ORMAWA_ID_OVERRIDE__



  // Split title to dynamically highlight the last word
  let displayTitle = title || ''
  let displayHighlighted = ''
  
  if (displayTitle.includes(' ')) {
    const words = displayTitle.split(' ')
    displayHighlighted = words.pop()
    displayTitle = words.join(' ')
  }

  return (
    <DashboardHero
      title={displayTitle}
      highlightedTitle={displayHighlighted}
      subtitle={subtitle}
      icon={icon}

      actions={actions}
    />
  )
}
