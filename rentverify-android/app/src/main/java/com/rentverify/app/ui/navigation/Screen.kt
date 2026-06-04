package com.rentverify.app.ui.navigation

/**
 * Sealed class defining all navigation destinations.
 */
sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Dashboard : Screen("dashboard")
    data object Pending : Screen("pending")
    data object Audit : Screen("audit")
    data object Invite : Screen("invite")
    data object Analytics : Screen("analytics")
    data object Profile : Screen("profile")
    data object GuestDetail : Screen("detail/{id}") {
        fun createRoute(id: String) = "detail/$id"
    }
    data object AuditTimeline : Screen("audit-timeline/{id}") {
        fun createRoute(id: String) = "audit-timeline/$id"
    }
    data object GuestFlow : Screen("guest-flow?token={token}") {
        fun createRoute(token: String?) = if (token != null) "guest-flow?token=$token" else "guest-flow"
    }

    companion object {
        /** Bottom nav destinations */
        val bottomNavItems = listOf(Dashboard, Pending, Invite, Audit, Profile)
    }
}
