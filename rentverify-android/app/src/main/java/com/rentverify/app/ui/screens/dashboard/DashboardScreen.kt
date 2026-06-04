package com.rentverify.app.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.ui.components.StatusBadge
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.formatDate
import com.rentverify.app.util.formatRelativeTime

@Composable
fun DashboardScreen(
    onNavigateToPending: () -> Unit,
    onNavigateToDetail: (String) -> Unit,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // ── Header ────────────────────────────────────────
        item {
            Column(modifier = Modifier.padding(top = 16.dp)) {
                Text(
                    text = "Dashboard",
                    style = MaterialTheme.typography.headlineMedium,
                    fontWeight = FontWeight.Bold,
                    color = TextPrimary
                )
                Text(
                    text = "Guest verification overview",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }

        // ── Stats Cards ───────────────────────────────────
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                item {
                    StatsCard(
                        title = "Pending",
                        value = "${uiState.stats.pending}",
                        icon = Icons.Default.PendingActions,
                        gradient = listOf(Purple500, Purple700),
                        onClick = onNavigateToPending
                    )
                }
                item {
                    StatsCard(
                        title = "Approved Today",
                        value = "${uiState.stats.approvedToday}",
                        icon = Icons.Default.CheckCircle,
                        gradient = listOf(Green500, Color(0xFF00A381))
                    )
                }
                item {
                    StatsCard(
                        title = "Flagged",
                        value = "${uiState.stats.flagged}",
                        icon = Icons.Default.Flag,
                        gradient = listOf(StatusFlagged, Red500)
                    )
                }
                item {
                    StatsCard(
                        title = "This Month",
                        value = "${uiState.stats.totalThisMonth}",
                        icon = Icons.Default.CalendarMonth,
                        gradient = listOf(Blue500, Color(0xFF0669B5))
                    )
                }
            }
        }

        // ── Upcoming Arrivals ─────────────────────────────
        item {
            Text(
                text = "Recent Approvals",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = TextPrimary,
                modifier = Modifier.padding(top = 8.dp)
            )
        }

        if (uiState.upcomingArrivals.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = "No recent approvals",
                        color = TextMuted,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        } else {
            items(uiState.upcomingArrivals) { verification ->
                VerificationListItem(
                    verification = verification,
                    onClick = { onNavigateToDetail(verification.id) }
                )
            }
        }
    }
}

@Composable
fun StatsCard(
    title: String,
    value: String,
    icon: ImageVector,
    gradient: List<Color>,
    onClick: (() -> Unit)? = null
) {
    Card(
        modifier = Modifier
            .width(160.dp)
            .height(100.dp)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color.Transparent)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(
                    Brush.linearGradient(colors = gradient),
                    RoundedCornerShape(16.dp)
                )
                .padding(16.dp)
        ) {
            Column {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = Color.White.copy(alpha = 0.8f),
                    modifier = Modifier.size(22.dp)
                )
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    text = value,
                    color = Color.White,
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    lineHeight = 32.sp
                )
                Text(
                    text = title,
                    color = Color.White.copy(alpha = 0.8f),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Medium
                )
            }
        }
    }
}

@Composable
fun VerificationListItem(
    verification: VerificationDto,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar circle
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(RoundedCornerShape(22.dp))
                    .background(Purple500.copy(alpha = 0.2f)),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = verification.guestName.take(2).uppercase(),
                    color = Purple500,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp
                )
            }

            Spacer(modifier = Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = verification.guestName,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = TextPrimary
                )
                Text(
                    text = "${formatDate(verification.checkinDate)} • ${verification.purpose}",
                    style = MaterialTheme.typography.bodySmall,
                    color = TextSecondary
                )
            }

            Column(horizontalAlignment = Alignment.End) {
                StatusBadge(status = verification.status)
                Text(
                    text = formatRelativeTime(verification.submittedAt),
                    style = MaterialTheme.typography.labelSmall,
                    color = TextMuted,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}
