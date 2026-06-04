package com.rentverify.app.ui.screens.audit

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
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
import com.rentverify.app.data.remote.dto.AuditEventDto
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.formatRelativeTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AuditTimelineScreen(
    verificationId: String,
    onBack: () -> Unit,
    viewModel: AuditViewModel = hiltViewModel()
) {
    val events by viewModel.observeEventsForVerification(verificationId).collectAsState(initial = emptyList())

    LaunchedEffect(verificationId) { viewModel.loadEventsForVerification(verificationId) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Audit Timeline", color = TextPrimary) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back", tint = TextPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = DarkBg)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().background(DarkBg).padding(padding),
            contentPadding = PaddingValues(16.dp)
        ) {
            itemsIndexed(events) { index, event ->
                TimelineItem(event = event, isLast = index == events.lastIndex)
            }

            if (events.isEmpty()) {
                item {
                    Box(Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) {
                        Text("No audit events found", color = TextMuted)
                    }
                }
            }
        }
    }
}

@Composable
fun TimelineItem(event: AuditEventDto, isLast: Boolean) {
    val dotColor = when (event.eventType) {
        "approved" -> Green500
        "rejected" -> Red500
        "flagged" -> StatusFlagged
        "submission_complete" -> Purple500
        else -> TextMuted
    }

    Row(modifier = Modifier.fillMaxWidth()) {
        // Timeline line + dot
        Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(32.dp)) {
            Box(
                modifier = Modifier.size(12.dp).clip(CircleShape).background(dotColor)
            )
            if (!isLast) {
                Box(
                    modifier = Modifier.width(2.dp).height(48.dp).background(TextMuted.copy(alpha = 0.3f))
                )
            }
        }

        Spacer(Modifier.width(12.dp))

        // Event content
        Column(modifier = Modifier.weight(1f).padding(bottom = if (isLast) 0.dp else 8.dp)) {
            Text(
                text = event.description,
                color = TextPrimary,
                fontSize = 14.sp,
                fontWeight = FontWeight.Medium
            )
            Row(modifier = Modifier.padding(top = 2.dp)) {
                Text(
                    text = event.actor.replaceFirstChar { it.uppercase() },
                    color = Purple200,
                    fontSize = 11.sp,
                    fontWeight = FontWeight.SemiBold
                )
                Text(" • ", color = TextMuted, fontSize = 11.sp)
                Text(
                    text = formatRelativeTime(event.timestamp),
                    color = TextMuted,
                    fontSize = 11.sp
                )
            }
        }
    }
}
