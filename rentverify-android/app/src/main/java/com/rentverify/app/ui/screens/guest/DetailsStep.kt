package com.rentverify.app.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Group
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rentverify.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailsStep(
    initialData: GuestFormData,
    onNext: (
        fullName: String,
        phone: String,
        countryCode: String,
        email: String,
        guestCount: Int,
        purpose: String,
        bookingPlatform: String
    ) -> Unit,
    onBack: () -> Unit
) {
    var fullName by remember { mutableStateOf(initialData.fullName) }
    var phone by remember { mutableStateOf(initialData.phone) }
    var countryCode by remember { mutableStateOf(initialData.countryCode) }
    var email by remember { mutableStateOf(initialData.email) }
    var guestCount by remember { mutableStateOf(initialData.guestCount) }
    var purpose by remember { mutableStateOf(initialData.purpose) }
    var bookingPlatform by remember { mutableStateOf(initialData.bookingPlatform) }

    var fullNameError by remember { mutableStateOf<String?>(null) }
    var phoneError by remember { mutableStateOf<String?>(null) }

    var cCodeExpanded by remember { mutableStateOf(false) }
    var purposeExpanded by remember { mutableStateOf(false) }
    var platformExpanded by remember { mutableStateOf(false) }

    val countryCodes = listOf("+91" to "🇮🇳 +91", "+1" to "🇺🇸 +1", "+44" to "🇬🇧 +44", "+61" to "🇦🇺 +61", "+971" to "🇦🇪 +971")
    val purposes = listOf("Tourism", "Business", "Family Visit", "Event", "Other")
    val platforms = listOf("Airbnb", "Booking.com", "MakeMyTrip", "Direct", "Other")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp)
    ) {
        // Progress header
        ProgressHeader(step = 1, totalSteps = 4, label = "Your Details")

        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Full name field
            Column {
                Text("Full Name *", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
                OutlinedTextField(
                    value = fullName,
                    onValueChange = {
                        fullName = it
                        fullNameError = null
                    },
                    placeholder = { Text("Enter your full name", color = TextMuted) },
                    isError = fullNameError != null,
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Purple500,
                        unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
                fullNameError?.let {
                    Text(it, color = Red500, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }

            // Phone field
            Column {
                Text("Phone Number *", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .width(100.dp)
                            .height(56.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(DarkSurface)
                            .clickable { cCodeExpanded = true }
                            .padding(horizontal = 12.dp),
                        contentAlignment = Alignment.CenterStart
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = countryCodes.find { it.first == countryCode }?.second?.split(" ")?.firstOrNull() ?: countryCode,
                                color = TextPrimary,
                                fontSize = 14.sp
                            )
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextSecondary)
                        }
                        DropdownMenu(
                            expanded = cCodeExpanded,
                            onDismissRequest = { cCodeExpanded = false },
                            modifier = Modifier.background(DarkSurface)
                        ) {
                            countryCodes.forEach { (code, display) ->
                                DropdownMenuItem(
                                    text = { Text(display, color = TextPrimary) },
                                    onClick = {
                                        countryCode = code
                                        cCodeExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Spacer(modifier = Modifier.width(8.dp))

                    OutlinedTextField(
                        value = phone,
                        onValueChange = {
                            phone = it
                            phoneError = null
                        },
                        placeholder = { Text("98765 43210", color = TextMuted) },
                        isError = phoneError != null,
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Purple500,
                            unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                            focusedContainerColor = DarkSurface,
                            unfocusedContainerColor = DarkSurface,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.weight(1f)
                    )
                }
                phoneError?.let {
                    Text(it, color = Red500, fontSize = 11.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }

            // Email Address
            Column {
                Text("Email Address", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("you@example.com", color = TextMuted) },
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Purple500,
                        unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                        focusedContainerColor = DarkSurface,
                        unfocusedContainerColor = DarkSurface,
                        focusedTextColor = TextPrimary,
                        unfocusedTextColor = TextPrimary
                    ),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth()
                )
            }

            // Number of Guests Stepper
            Column {
                Text("Number of Guests *", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSurface)
                        .padding(horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    IconButton(
                        onClick = { if (guestCount > 1) guestCount-- },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(DarkBg)
                    ) {
                        Text("−", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Group, contentDescription = null, tint = Purple300, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("$guestCount", color = TextPrimary, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                    }

                    IconButton(
                        onClick = { if (guestCount < 10) guestCount++ },
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(DarkBg)
                    ) {
                        Text("+", color = TextPrimary, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            // Purpose of Stay Dropdown
            Column {
                Text("Purpose of Stay *", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
                Box {
                    OutlinedTextField(
                        value = purpose,
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextSecondary) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Purple500,
                            unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                            focusedContainerColor = DarkSurface,
                            unfocusedContainerColor = DarkSurface,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { purposeExpanded = true }
                    )
                    DropdownMenu(
                        expanded = purposeExpanded,
                        onDismissRequest = { purposeExpanded = false },
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DarkSurface)
                    ) {
                        purposes.forEach { p ->
                            DropdownMenuItem(
                                text = { Text(p, color = TextPrimary) },
                                onClick = {
                                    purpose = p
                                    purposeExpanded = false
                                }
                            )
                        }
                    }
                }
            }

            // Booking Platform Dropdown
            Column {
                Text("Booking Platform", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.padding(bottom = 6.dp))
                Box {
                    OutlinedTextField(
                        value = bookingPlatform,
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = TextSecondary) },
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = Purple500,
                            unfocusedBorderColor = TextMuted.copy(alpha = 0.3f),
                            focusedContainerColor = DarkSurface,
                            unfocusedContainerColor = DarkSurface,
                            focusedTextColor = TextPrimary,
                            unfocusedTextColor = TextPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { platformExpanded = true }
                    )
                    DropdownMenu(
                        expanded = platformExpanded,
                        onDismissRequest = { platformExpanded = false },
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(DarkSurface)
                    ) {
                        platforms.forEach { pl ->
                            DropdownMenuItem(
                                text = { Text(pl, color = TextPrimary) },
                                onClick = {
                                    bookingPlatform = pl
                                    platformExpanded = false
                                }
                            )
                        }
                    }
                }
            }
        }

        // Form Actions
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Button(
                onClick = onBack,
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color.Transparent,
                    contentColor = TextSecondary
                )
            ) {
                Text("← Back", fontWeight = FontWeight.Bold)
            }

            Button(
                onClick = {
                    var hasError = false
                    if (fullName.trim().length < 2) {
                        fullNameError = "Please enter your full name (at least 2 characters)"
                        hasError = true
                    }
                    if (phone.trim().isBlank()) {
                        phoneError = "Phone number is required"
                        hasError = true
                    }

                    if (!hasError) {
                        onNext(fullName, phone, countryCode, email, guestCount, purpose, bookingPlatform)
                    }
                },
                modifier = Modifier
                    .weight(1f)
                    .height(48.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Purple500,
                    contentColor = Color.White
                )
            ) {
                Text("Continue →", fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun ProgressHeader(
    step: Int,
    totalSteps: Int,
    label: String
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            for (i in 1..totalSteps) {
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(4.dp)
                        .clip(RoundedCornerShape(2.dp))
                        .background(
                            if (i < step) Green500
                            else if (i == step) Purple500
                            else TextMuted.copy(alpha = 0.2f)
                        )
                )
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Step $step of $totalSteps — $label",
            style = MaterialTheme.typography.labelMedium,
            color = Purple300,
            fontWeight = FontWeight.SemiBold
        )
    }
}
