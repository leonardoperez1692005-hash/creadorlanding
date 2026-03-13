'use client'

import { useState, useEffect, useCallback } from 'react'
import type { UserPermissions, AllowedModule, IntelView } from '@/lib/permissions'
import { getUserPermissionsAction } from '@/features/admin/actions'

interface UsePermissionsReturn {
    permissions: UserPermissions | null
    loading: boolean
    canAccessModule: (module: AllowedModule) => boolean
    canAccessIntelView: (view: IntelView) => boolean
}

/** Hook que carga los permisos del usuario autenticado y provee helpers de acceso a módulos/vistas. */
export function usePermissions(): UsePermissionsReturn {
    const [permissions, setPermissions] = useState<UserPermissions | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let cancelled = false

        getUserPermissionsAction().then((result) => {
            if (cancelled) return
            if (result.success && result.data) {
                setPermissions(result.data)
            }
            setLoading(false)
        })

        return () => {
            cancelled = true
        }
    }, [])

    const canAccessModule = useCallback(
        (module: AllowedModule): boolean => {
            if (!permissions) return false
            if (permissions.isSuperadmin) return true
            return permissions.features.modules.includes(module)
        },
        [permissions],
    )

    const canAccessIntelView = useCallback(
        (view: IntelView): boolean => {
            if (!permissions) return false
            if (permissions.isSuperadmin) return true
            if (!permissions.features.modules.includes('intelligence')) return false
            return permissions.features.intelViews.includes(view)
        },
        [permissions],
    )

    return { permissions, loading, canAccessModule, canAccessIntelView }
}
