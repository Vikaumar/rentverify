package com.rentverify.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.ui.screens.invite.FormField
import com.rentverify.app.ui.theme.*

@Composable
fun ProfileScreen(
    onLogout: () -> Unit,
    onNavigateToAnalytics: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val user = uiState.user

    LaunchedEffect(uiState.user) {
        if (uiState.user == null && !uiState.isSaving) {
            // User logged out
        }
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
            Text("Profile", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = TextPrimary)
        }

        // Avatar + Name Card
        Card(
            shape = RoundedCornerShape(16.dp),
            colors = CardDefaults.cardColors(containerColor = DarkSurface)
        ) {
            Column(
                modifier = Modifier.padding(24.dp).fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier.size(80.dp).clip(CircleShape).background(Purple500.copy(alpha = 0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = (user?.name ?: user?.username ?: "?").take(2).uppercase(),
                        color = Purple500,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Spacer(Modifier.height(12.dp))
                Text(user?.name ?: "", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = TextPrimary)
                Text(user?.username ?: "", style = MaterialTheme.typography.bodyMedium, color = TextSecondary)
                Text(user?.role?.replace("_", " ")?.replaceFirstChar { it.uppercase() } ?: "", style = MaterialTheme.typography.labelMedium, color = Purple200)
            }
        }

        // Editable Fields
        if (uiState.isEditing) {
            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = DarkSurface)) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    FormField("Name", uiState.editName) { viewModel.onFieldChange("name", it) }
                    FormField("Email", uiState.editEmail) { viewModel.onFieldChange("email", it) }
                    FormField("Phone", uiState.editPhone) { viewModel.onFieldChange("phone", it) }
                    FormField("Property Name", uiState.editPropertyName) { viewModel.onFieldChange("propertyName", it) }

                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        OutlinedButton(
                            onClick = viewModel::toggleEdit,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp)
                        ) { Text("Cancel", color = TextMuted) }

                        Button(
                            onClick = viewModel::saveProfile,
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(12.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = Purple500),
                            enabled = !uiState.isSaving
                        ) {
                            if (uiState.isSaving) CircularProgressIndicator(Modifier.size(18.dp), color = TextPrimary, strokeWidth = 2.dp)
                            else Text("Save", fontWeight = FontWeight.SemiBold)
                        }
                    }
                }
            }
        } else {
            // Info Display
            Card(shape = RoundedCornerShape(16.dp), colors = CardDefaults.cardColors(containerColor = DarkSurface)) {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    ProfileInfoRow("Email", user?.email ?: "")
                    ProfileInfoRow("Phone", user?.phone ?: "")
                    ProfileInfoRow("Property", user?.propertyName ?: "")
                }
            }
        }

        // Action Buttons
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            if (!uiState.isEditing) {
                Button(
                    onClick = viewModel::toggleEdit,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = DarkSurface)
                ) {
                    Icon(Icons.Default.Edit, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Edit Profile", color = TextPrimary)
                }
            }

            Button(
                onClick = onNavigateToAnalytics,
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = DarkSurface)
            ) {
                Icon(Icons.Default.BarChart, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("View Analytics", color = TextPrimary)
            }

            Button(
                onClick = { viewModel.logout(); onLogout() },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Red500.copy(alpha = 0.15f))
            ) {
                Icon(Icons.Default.Logout, contentDescription = null, tint = Red500, modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(8.dp))
                Text("Sign Out", color = Red500, fontWeight = FontWeight.SemiBold)
            }
        }

        Spacer(Modifier.height(16.dp))
    }
}

@Composable
fun ProfileInfoRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, color = TextMuted, fontSize = 13.sp, modifier = Modifier.width(80.dp))
        Text(value.ifBlank { "—" }, color = TextPrimary, fontSize = 14.sp, fontWeight = FontWeight.Medium)
    }
}
