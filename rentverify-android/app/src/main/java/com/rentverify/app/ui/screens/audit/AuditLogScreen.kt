package com.rentverify.app.ui.screens.audit

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.ui.components.StatusBadge
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.formatRelativeTime

@Composable
fun AuditLogScreen(
    onNavigateToTimeline: (String) -> Unit,
    viewModel: AuditViewModel = hiltViewModel()
) {
    val verifications by viewModel.verifications.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        item {
            Column(modifier = Modifier.padding(top = 16.dp)) {
                Text("Audit Log", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text("${verifications.size} reviewed verifications", style = MaterialTheme.typography.bodyMedium, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))
            }
        }

        if (verifications.isEmpty()) {
            item {
                Box(Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) {
                    Text("No reviewed verifications yet", color = TextMuted)
                }
            }
        }

        items(verifications, key = { it.id }) { v ->
            Card(
                modifier = Modifier.fillMaxWidth().clickable { onNavigateToTimeline(v.id) },
                shape = RoundedCornerShape(12.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface)
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(v.guestName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.SemiBold, color = TextPrimary)
                        Text(v.refCode, style = MaterialTheme.typography.bodySmall, color = TextMuted)
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        StatusBadge(status = v.status)
                        Text(formatRelativeTime(v.reviewedAt ?: v.submittedAt), style = MaterialTheme.typography.labelSmall, color = TextMuted, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }
    }
}
