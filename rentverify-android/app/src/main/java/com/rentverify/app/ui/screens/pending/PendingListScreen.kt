package com.rentverify.app.ui.screens.pending

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.ui.screens.dashboard.VerificationListItem
import com.rentverify.app.ui.theme.*

@Composable
fun PendingListScreen(
    onNavigateToDetail: (String) -> Unit,
    viewModel: PendingListViewModel = hiltViewModel()
) {
    val verifications by viewModel.verifications.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(Unit) {
        viewModel.actionResult.collect { message ->
            snackbarHostState.showSnackbar(message)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(DarkBg)
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // ── Header ────────────────────────────────────
            item {
                Column(modifier = Modifier.padding(top = 16.dp)) {
                    Text(
                        text = "Verifications",
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        color = TextPrimary
                    )
                    Text(
                        text = "${verifications.size} total",
                        style = MaterialTheme.typography.bodyMedium,
                        color = TextSecondary,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }

            // ── Search Bar ────────────────────────────────
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = viewModel::onSearchChange,
                    placeholder = { Text("Search guests…", color = TextMuted) },
                    leadingIcon = {
                        Icon(Icons.Default.Search, contentDescription = null, tint = TextMuted)
                    },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Purple500,
                        unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface,
                        cursorColor = Purple500
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // ── Verification List ─────────────────────────
            if (verifications.isEmpty()) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(48.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (searchQuery.isNotBlank()) "No results found"
                                   else "No verifications yet",
                            color = TextMuted,
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
            }

            items(verifications, key = { it.id }) { verification ->
                VerificationListItem(
                    verification = verification,
                    onClick = { onNavigateToDetail(verification.id) }
                )
            }
        }
    }
}
