package com.rentverify.app.ui.navigation

import androidx.compose.animation.*
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.*
import androidx.navigation.compose.*
import com.rentverify.app.data.repository.AuthRepository
import com.rentverify.app.ui.components.BottomNavBar
import com.rentverify.app.ui.screens.audit.AuditLogScreen
import com.rentverify.app.ui.screens.audit.AuditTimelineScreen
import com.rentverify.app.ui.screens.analytics.AnalyticsScreen
import com.rentverify.app.ui.screens.dashboard.DashboardScreen
import com.rentverify.app.ui.screens.detail.GuestDetailScreen
import com.rentverify.app.ui.screens.guest.GuestFlowScreen
import com.rentverify.app.ui.screens.invite.InviteGuestScreen
import com.rentverify.app.ui.screens.login.LoginScreen
import com.rentverify.app.ui.screens.pending.PendingListScreen
import com.rentverify.app.ui.screens.profile.ProfileScreen
import javax.inject.Inject

@Composable
fun RentVerifyNavHost(
    guestToken: String? = null,
    authRepository: AuthRepository = hiltViewModel<NavViewModel>().authRepository
) {
    val navController = rememberNavController()
    val isLoggedIn by authRepository.isLoggedIn.collectAsState()

    // Determine start destination
    val startDestination = when {
        guestToken != null -> Screen.GuestFlow.route
        isLoggedIn -> Screen.Dashboard.route
        else -> Screen.Login.route
    }

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // Routes that show bottom nav
    val showBottomNav = isLoggedIn && currentRoute in Screen.bottomNavItems.map { it.route }

    Scaffold(
        bottomBar = {
            if (showBottomNav) {
                BottomNavBar(
                    currentRoute = currentRoute ?: "",
                    onNavigate = { route ->
                        navController.navigate(route) {
                            popUpTo(Screen.Dashboard.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = startDestination,
            modifier = Modifier.padding(paddingValues)
        ) {
            // ── Login ─────────────────────────────────────
            composable(Screen.Login.route) {
                LoginScreen(
                    onLoginSuccess = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                )
            }

            // ── Dashboard ─────────────────────────────────
            composable(Screen.Dashboard.route) {
                DashboardScreen(
                    onNavigateToPending = {
                        navController.navigate(Screen.Pending.route)
                    },
                    onNavigateToDetail = { id ->
                        navController.navigate(Screen.GuestDetail.createRoute(id))
                    }
                )
            }

            // ── Pending List ──────────────────────────────
            composable(Screen.Pending.route) {
                PendingListScreen(
                    onNavigateToDetail = { id ->
                        navController.navigate(Screen.GuestDetail.createRoute(id))
                    }
                )
            }

            // ── Guest Detail ──────────────────────────────
            composable(
                Screen.GuestDetail.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: return@composable
                GuestDetailScreen(
                    verificationId = id,
                    onBack = { navController.popBackStack() },
                    onNavigateToAudit = { vId ->
                        navController.navigate(Screen.AuditTimeline.createRoute(vId))
                    }
                )
            }

            // ── Audit Log ─────────────────────────────────
            composable(Screen.Audit.route) {
                AuditLogScreen(
                    onNavigateToTimeline = { id ->
                        navController.navigate(Screen.AuditTimeline.createRoute(id))
                    }
                )
            }

            // ── Audit Timeline ────────────────────────────
            composable(
                Screen.AuditTimeline.route,
                arguments = listOf(navArgument("id") { type = NavType.StringType })
            ) { backStackEntry ->
                val id = backStackEntry.arguments?.getString("id") ?: return@composable
                AuditTimelineScreen(
                    verificationId = id,
                    onBack = { navController.popBackStack() }
                )
            }

            // ── Invite Guest ──────────────────────────────
            composable(Screen.Invite.route) {
                InviteGuestScreen(
                    onInviteSent = {
                        navController.navigate(Screen.Pending.route) {
                            popUpTo(Screen.Invite.route) { inclusive = true }
                        }
                    }
                )
            }

            // ── Analytics ─────────────────────────────────
            composable(Screen.Analytics.route) {
                AnalyticsScreen()
            }

            // ── Profile ───────────────────────────────────
            composable(Screen.Profile.route) {
                ProfileScreen(
                    onLogout = {
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    },
                    onNavigateToAnalytics = {
                        navController.navigate(Screen.Analytics.route)
                    }
                )
            }

            // ── Guest Flow ────────────────────────────────
            composable(
                Screen.GuestFlow.route,
                arguments = listOf(navArgument("token") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = guestToken
                })
            ) { backStackEntry ->
                val token = backStackEntry.arguments?.getString("token") ?: guestToken
                GuestFlowScreen(
                    token = token,
                    onComplete = {
                        navController.navigate(Screen.Dashboard.route) {
                            popUpTo(0) { inclusive = true }
                        }
                    }
                )
            }
        }
    }
}
