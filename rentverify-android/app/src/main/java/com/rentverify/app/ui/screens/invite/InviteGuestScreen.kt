package com.rentverify.app.ui.screens.invite

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.ui.theme.*

@Composable
fun InviteGuestScreen(
    onInviteSent: () -> Unit,
    viewModel: InviteGuestViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(uiState.isSuccess) {
        if (uiState.isSuccess) onInviteSent()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header
        Column(modifier = Modifier.padding(top = 16.dp)) {
            Text("Invite Guest", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
            Text("Send a verification invitation", style = MaterialTheme.typography.bodyMedium, color = TextSecondary, modifier = Modifier.padding(top = 4.dp))
        }

        // Form Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                FormField("Guest Name *", uiState.guestName) { viewModel.onFieldChange("guestName", it) }
                FormField("Phone Number *", uiState.guestPhone) { viewModel.onFieldChange("guestPhone", it) }
                FormField("Email (optional)", uiState.guestEmail) { viewModel.onFieldChange("guestEmail", it) }
                FormField("Guest Count", uiState.guestCount) { viewModel.onFieldChange("guestCount", it) }
                FormField("Purpose", uiState.purpose) { viewModel.onFieldChange("purpose", it) }
                FormField("Booking Platform", uiState.bookingPlatform) { viewModel.onFieldChange("bookingPlatform", it) }
                FormField("ID Type", uiState.idType) { viewModel.onFieldChange("idType", it) }
                FormField("Check-in Date", uiState.checkinDate) { viewModel.onFieldChange("checkinDate", it) }
                FormField("Check-out Date", uiState.checkoutDate) { viewModel.onFieldChange("checkoutDate", it) }
            }
        }

        // Error
        uiState.error?.let {
            Text(it, color = Red500, style = MaterialTheme.typography.bodySmall)
        }

        // Submit Button
        Button(
            onClick = viewModel::submit,
            enabled = !uiState.isLoading,
            modifier = Modifier.fillMaxWidth().height(52.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Purple500)
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(Modifier.size(22.dp), color = TextPrimary, strokeWidth = 2.dp)
            } else {
                Icon(Icons.Default.Send, contentDescription = null, modifier = Modifier.size(20.dp))
                Spacer(Modifier.width(8.dp))
                Text("Send Invitation", fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(16.dp))
    }
}

@Composable
fun FormField(label: String, value: String, onValueChange: (String) -> Unit) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        singleLine = true,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = Purple500,
            unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
            focusedLabelColor = Purple500,
            cursorColor = Purple500
        ),
        shape = RoundedCornerShape(10.dp),
        modifier = Modifier.fillMaxWidth()
    )
}
