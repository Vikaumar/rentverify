package com.rentverify.app.ui.screens.dashboard

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.ui.components.StatusBadge
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.formatDate
import com.rentverify.app.util.formatRelativeTime
import kotlinx.coroutines.delay
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onNavigateToPending: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val isRefreshing = uiState.isLoading

    PullToRefreshBox(
        isRefreshing = isRefreshing,
        onRefresh = { viewModel.loadDashboard() },
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
    ) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(bottom = 100.dp),
            verticalArrangement = Arrangement.spacedBy(0.dp)
        ) {
            // ── Hero Header with Greeting ──────────────────────
            item {
                HeroHeader()
            }

            // ── Stats Grid (2x2) ──────────────────────────────
            item {
                if (uiState.isLoading) {
                    StatsShimmer()
                } else {
                    StatsGrid(
                        stats = uiState.stats,
                        onPendingClick = onNavigateToPending
                    )
                }
            }

            // ── Quick Actions ─────────────────────────────────
            item {
                QuickActions(onNavigateToPending = onNavigateToPending)
            }

            // ── Recent Activity Section Header ────────────────
            item {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 20.dp, vertical = 4.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Recent Activity",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    if (uiState.upcomingArrivals.isNotEmpty()) {
                        TextButton(onClick = onNavigateToPending) {
                            Text("View All", color = Purple300, fontSize = 13.sp)
                        }
                    }
                }
            }

            // ── Verification List ─────────────────────────────
            if (uiState.isLoading) {
                items(3) {
                    ListItemShimmer()
                }
            } else if (uiState.upcomingArrivals.isEmpty()) {
                item {
                    EmptyState()
                }
            } else {
                itemsIndexed(uiState.upcomingArrivals) { index, verification ->
                    AnimatedVerificationItem(
                        verification = verification,
                        index = index,
                        onClick = { onNavigateToDetail(verification.id) }
                    )
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Hero Header ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

@Composable
private fun HeroHeader() {
    val greeting = remember {
        when (LocalTime.now().hour) {
            in 5..11 -> "Good Morning"
            in 12..16 -> "Good Afternoon"
            in 17..20 -> "Good Evening"
            else -> "Good Night"
        }
    }
    val greetingEmoji = remember {
        when (LocalTime.now().hour) {
            in 5..11 -> "☀️"
            in 12..16 -> "🌤️"
            in 17..20 -> "🌆"
            else -> "🌙"
        }
    }
    val today = remember {
        LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy", Locale.ENGLISH))
    }

    // Subtle pulsing glow animation
    val infiniteTransition = rememberInfiniteTransition(label = "headerGlow")
    val glowAlpha by infiniteTransition.animateFloat(
        initialValue = 0.08f,
        targetValue = 0.18f,
        animationSpec = infiniteRepeatable(
            animation = tween(3000, easing = EaseInOutSine),
            repeatMode = RepeatMode.Reverse
        ),
        label = "glowAlpha"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .drawBehind {
                // Animated gradient orb behind the header
                drawCircle(
                    brush = Brush.radialGradient(
                        colors = listOf(
                            Purple500.copy(alpha = glowAlpha),
                            Color.Transparent
                        ),
                        center = Offset(size.width * 0.8f, size.height * 0.3f),
                        radius = size.width * 0.6f
                    ),
                    radius = size.width * 0.6f,
                    center = Offset(size.width * 0.8f, size.height * 0.3f)
                )
            }
            .padding(horizontal = 20.dp, vertical = 24.dp)
            .padding(top = 16.dp)
    ) {
        Column {
            // Date pill
            Surface(
                shape = RoundedCornerShape(20.dp),
                color = DarkSurface,
                modifier = Modifier.padding(bottom = 16.dp)
            ) {
                Text(
                    text = "📅  $today",
                    color = TextSecondary,
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium,
                    modifier = Modifier.padding(horizontal = 14.dp, vertical = 6.dp)
                )
            }

            // Greeting
            Text(
                text = "$greetingEmoji $greeting",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary,
                lineHeight = 34.sp
            )
            Text(
                text = "Property Guardian",
                fontSize = 30.sp,
                fontWeight = FontWeight.ExtraBold,
                color = Purple300,
                lineHeight = 36.sp
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Manage your guest verifications effortlessly",
                fontSize = 14.sp,
                color = TextSecondary,
                fontWeight = FontWeight.Normal
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Stats Grid (2x2 Glassmorphism Cards) ──────────────────────────
// ═══════════════════════════════════════════════════════════════════

@Composable
private fun StatsGrid(
    stats: com.rentverify.app.data.remote.dto.DashboardStats,
    onPendingClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .padding(bottom = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            GlassStatCard(
                title = "Pending",
                value = "${stats.pending}",
                icon = Icons.Outlined.Schedule,
                accentColor = Yellow500,
                gradient = listOf(
                    Color(0xFF2D2A10).copy(alpha = 0.6f),
                    DarkSurface.copy(alpha = 0.9f)
                ),
                modifier = Modifier.weight(1f),
                onClick = onPendingClick
            )
            GlassStatCard(
                title = "Approved",
                value = "${stats.approvedToday}",
                icon = Icons.Outlined.CheckCircle,
                accentColor = Green500,
                gradient = listOf(
                    Color(0xFF0A2E22).copy(alpha = 0.6f),
                    DarkSurface.copy(alpha = 0.9f)
                ),
                modifier = Modifier.weight(1f)
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            GlassStatCard(
                title = "Flagged",
                value = "${stats.flagged}",
                icon = Icons.Outlined.Flag,
                accentColor = StatusFlagged,
                gradient = listOf(
                    Color(0xFF2E1510).copy(alpha = 0.6f),
                    DarkSurface.copy(alpha = 0.9f)
                ),
                modifier = Modifier.weight(1f)
            )
            GlassStatCard(
                title = "This Month",
                value = "${stats.totalThisMonth}",
                icon = Icons.Outlined.CalendarMonth,
                accentColor = Blue500,
                gradient = listOf(
                    Color(0xFF0A1A2E).copy(alpha = 0.6f),
                    DarkSurface.copy(alpha = 0.9f)
                ),
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
private fun GlassStatCard(
    title: String,
    value: String,
    icon: ImageVector,
    accentColor: Color,
    gradient: List<Color>,
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null
) {
    // Count-up animation
    val targetValue = remember(value) { value.toIntOrNull() ?: 0 }
    var animatedValue by remember { mutableIntStateOf(0) }

    LaunchedEffect(targetValue) {
        animatedValue = 0
        if (targetValue > 0) {
            val steps = minOf(targetValue, 30)
            val delayPerStep = 400L / steps
            for (i in 1..targetValue) {
                delay(delayPerStep)
                animatedValue = i
            }
        }
    }

    Card(
        modifier = modifier
            .height(120.dp)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.verticalGradient(colors = gradient),
                    RoundedCornerShape(20.dp)
                )
                .border(
                    width = 1.dp,
                    brush = Brush.verticalGradient(
                        colors = listOf(
                            GlassBorder,
                            Color.Transparent
                        )
                    ),
                    shape = RoundedCornerShape(20.dp)
                )
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Icon with subtle glow background
                Box(
                    modifier = Modifier
                        .size(36.dp)
                        .clip(RoundedCornerShape(10.dp))
                        .background(accentColor.copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = accentColor,
                        modifier = Modifier.size(20.dp)
                    )
                }

                Column {
                    Text(
                        text = if (targetValue > 0) "$animatedValue" else value,
                        color = TextPrimary,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 36.sp
                    )
                    Text(
                        text = title,
                        color = TextSecondary,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            // Subtle accent dot
            Box(
                modifier = Modifier
                    .align(Alignment.TopEnd)
                    .size(8.dp)
                    .clip(CircleShape)
                    .background(accentColor.copy(alpha = 0.5f))
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Quick Actions ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

@Composable
private fun QuickActions(onNavigateToPending: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Surface(
            modifier = Modifier
                .weight(1f)
                .height(48.dp)
                .clickable(onClick = onNavigateToPending),
            shape = RoundedCornerShape(14.dp),
            color = Purple500.copy(alpha = 0.12f),
            border = androidx.compose.foundation.BorderStroke(
                1.dp, Purple500.copy(alpha = 0.3f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    Icons.Outlined.PendingActions,
                    contentDescription = null,
                    tint = Purple300,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "Review Pending",
                    color = Purple300,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }

        Surface(
            modifier = Modifier
                .weight(1f)
                .height(48.dp),
            shape = RoundedCornerShape(14.dp),
            color = Green500.copy(alpha = 0.12f),
            border = androidx.compose.foundation.BorderStroke(
                1.dp, Green500.copy(alpha = 0.3f)
            )
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    Icons.Outlined.Verified,
                    contentDescription = null,
                    tint = Green500,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    "All Verified",
                    color = Green500,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Verification List Item (Animated) ─────────────────────────────
// ═══════════════════════════════════════════════════════════════════

@Composable
private fun AnimatedVerificationItem(
    verification: VerificationDto,
    index: Int,
    onClick: () -> Unit
) {
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(Unit) {
        delay(index * 80L)
        visible = true
    }

    AnimatedVisibility(
        visible = visible,
        enter = fadeIn(tween(300)) + slideInVertically(
            initialOffsetY = { it / 3 },
            animationSpec = tween(300)
        )
    ) {
        VerificationListItem(
            verification = verification,
            onClick = onClick
        )
    }
}

@Composable
fun VerificationListItem(
    verification: VerificationDto,
    onClick: () -> Unit
) {
    val statusColor = when (verification.status.lowercase()) {
        "pending" -> Yellow500
        "approved" -> Green500
        "rejected" -> Red500
        "flagged" -> StatusFlagged
        else -> TextMuted
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp)
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar with status ring
            Box(contentAlignment = Alignment.Center) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(
                            Brush.linearGradient(
                                colors = listOf(
                                    Purple500.copy(alpha = 0.3f),
                                    Purple700.copy(alpha = 0.2f)
                                )
                            )
                        )
                        .border(2.dp, statusColor.copy(alpha = 0.5f), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = verification.guestName.take(2).uppercase(),
                        color = Purple200,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }

                // Small status dot
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .offset(x = 2.dp, y = 2.dp)
                        .size(14.dp)
                        .clip(CircleShape)
                        .background(DarkSurface)
                        .padding(2.dp)
                        .clip(CircleShape)
                        .background(statusColor)
                )
            }

            Spacer(modifier = Modifier.width(14.dp))

            // Guest info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = verification.guestName,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(3.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Outlined.CalendarMonth,
                        contentDescription = null,
                        tint = TextMuted,
                        modifier = Modifier.size(13.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = formatDate(verification.checkinDate),
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Text(
                        text = "  •  ",
                        fontSize = 12.sp,
                        color = TextMuted
                    )
                    Text(
                        text = verification.purpose,
                        fontSize = 12.sp,
                        color = TextSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Right section
            Column(
                horizontalAlignment = Alignment.End,
                verticalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                StatusBadge(status = verification.status)
                Text(
                    text = formatRelativeTime(verification.submittedAt),
                    fontSize = 11.sp,
                    color = TextMuted
                )
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Empty State ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

@Composable
private fun EmptyState() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 40.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(CircleShape)
                    .background(DarkSurface),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Outlined.Inbox,
                    contentDescription = null,
                    tint = TextMuted,
                    modifier = Modifier.size(36.dp)
                )
            }
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = "No recent activity",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = TextSecondary
            )
            Text(
                text = "Guest verifications will appear here",
                fontSize = 13.sp,
                color = TextMuted,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}

// ═══════════════════════════════════════════════════════════════════
// ── Shimmer Loading Skeletons ─────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════

@Composable
private fun ShimmerBrush(): Brush {
    val shimmerTransition = rememberInfiniteTransition(label = "shimmer")
    val translateX by shimmerTransition.animateFloat(
        initialValue = -300f,
        targetValue = 800f,
        animationSpec = infiniteRepeatable(
            animation = tween(1200, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "shimmerX"
    )
    return Brush.linearGradient(
        colors = listOf(
            DarkSurface,
            DarkSurfaceVariant.copy(alpha = 0.7f),
            DarkSurface
        ),
        start = Offset(translateX, 0f),
        end = Offset(translateX + 300f, 0f)
    )
}

@Composable
private fun StatsShimmer() {
    val brush = ShimmerBrush()
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp)
            .padding(bottom = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(brush)
            )
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(brush)
            )
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(brush)
            )
            Box(
                modifier = Modifier
                    .weight(1f)
                    .height(120.dp)
                    .clip(RoundedCornerShape(20.dp))
                    .background(brush)
            )
        }
    }
}

@Composable
private fun ListItemShimmer() {
    val brush = ShimmerBrush()
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 4.dp),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(48.dp)
                    .clip(CircleShape)
                    .background(brush)
            )
            Spacer(modifier = Modifier.width(14.dp))
            Column(modifier = Modifier.weight(1f)) {
                Box(
                    modifier = Modifier
                        .width(120.dp)
                        .height(14.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(brush)
                )
                Spacer(modifier = Modifier.height(8.dp))
                Box(
                    modifier = Modifier
                        .width(180.dp)
                        .height(10.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(brush)
                )
            }
            Box(
                modifier = Modifier
                    .width(60.dp)
                    .height(22.dp)
                    .clip(RoundedCornerShape(6.dp))
                    .background(brush)
            )
        }
    }
}
