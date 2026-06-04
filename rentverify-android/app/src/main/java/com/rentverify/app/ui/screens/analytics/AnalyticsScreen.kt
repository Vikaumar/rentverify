package com.rentverify.app.ui.screens.analytics

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.data.remote.dto.DashboardStats
import com.rentverify.app.data.repository.VerificationRepository
import com.rentverify.app.ui.theme.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope

@HiltViewModel
class AnalyticsViewModel @Inject constructor(
    private val verificationRepo: VerificationRepository
) : ViewModel() {
    private val _stats = MutableStateFlow(DashboardStats())
    val stats: StateFlow<DashboardStats> = _stats

    init {
        viewModelScope.launch {
            verificationRepo.getStats().onSuccess { _stats.value = it }
        }
    }
}

@Composable
fun AnalyticsScreen(viewModel: AnalyticsViewModel = hiltViewModel()) {
    val stats by viewModel.stats.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Column(modifier = Modifier.padding(top = 16.dp)) {
            Text("Analytics", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Monthly performance overview", style = MaterialTheme.typography.bodyMedium, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))
        }

        // Stats Grid
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AnalyticCard("Total Reviews", "${stats.totalThisMonth}", Purple500, Modifier.weight(1f))
            AnalyticCard("Rejected", "${stats.rejectedThisMonth}", Red500, Modifier.weight(1f))
        }

        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            AnalyticCard("Pending", "${stats.pending}", Yellow500, Modifier.weight(1f))
            AnalyticCard("Flagged", "${stats.flagged}", StatusFlagged, Modifier.weight(1f))
        }

        // Response Time Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(Modifier.padding(20.dp)) {
                Text("Avg Response Time", color = TextSecondary, fontSize = 13.sp)
                val hours = stats.avgResponseTimeMs / 3_600_000
                val minutes = (stats.avgResponseTimeMs % 3_600_000) / 60_000
                Text(
                    text = if (hours > 0) "${hours}h ${minutes}m" else "${minutes}m",
                    color = TextPrimary,
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold
                )
                Text("Average time from submission to review", color = TextMuted, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
            }
        }

        // Approval Rate
        val total = stats.totalThisMonth.coerceAtLeast(1)
        val approvalRate = ((total - stats.rejectedThisMonth).toFloat() / total * 100).toInt()

        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.Bottom) {
                    Text("$approvalRate%", color = Green500, fontSize = 40.sp, fontWeight = FontWeight.Bold)
                    Spacer(Modifier.width(8.dp))
                    Text("Approval Rate", color = TextSecondary, fontSize = 14.sp, modifier = Modifier.padding(bottom = 8.dp))
                }
                Spacer(Modifier.height(12.dp))
                LinearProgressIndicator(
                    progress = { approvalRate / 100f },
                    modifier = Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)),
                    color = Green500,
                    trackColor = DarkCard,
                )
            }
        }
    }
}

@Composable
fun AnalyticCard(title: String, value: String, accentColor: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = DarkSurface)
    ) {
        Column(Modifier.padding(20.dp)) {
            Text(title, color = TextSecondary, fontSize = 12.sp)
            Text(value, color = accentColor, fontSize = 32.sp, fontWeight = FontWeight.Bold)
        }
    }
}
