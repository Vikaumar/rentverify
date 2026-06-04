package com.rentverify.app.ui.screens.guest

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.rememberAsyncImagePainter
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.calculateNights
import com.rentverify.app.util.formatDate
import com.rentverify.app.util.formatTime

@Composable
fun ReviewSubmitStep(
    formData: GuestFormData,
    submitting: Boolean,
    onEditStep: (GuestStep) -> Unit,
    onSubmit: () -> Unit
) {
    val nights = calculateNights(formData.checkinDate, formData.checkoutDate)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(bottom = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Review Your Details",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "Please verify everything looks correct before submitting.",
                style = MaterialTheme.typography.bodyMedium,
                color = TextSecondary
            )

            // 1. Photos Section
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Photos", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        TextButton(onClick = { onEditStep(GuestStep.SELFIE) }) {
                            Text("Edit", color = Purple300, fontSize = 13.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        // Selfie Thumbnail
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .aspectRatio(1f)
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DarkBg),
                                contentAlignment = Alignment.Center
                            ) {
                                if (formData.selfieData != null) {
                                    Image(
                                        painter = rememberAsyncImagePainter(model = formData.selfieData),
                                        contentDescription = null,
                                        contentScale = ContentScale.Crop,
                                        modifier = Modifier.fillMaxSize()
                                    )
                                } else {
                                    Text("No Selfie", color = TextMuted, fontSize = 12.sp)
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text("Selfie", color = TextSecondary, fontSize = 12.sp)
                        }

                        // ID Thumbnail
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.weight(1f)
                        ) {
                            Box(
                                modifier = Modifier
                                    .aspectRatio(1f)
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(DarkBg),
                                contentAlignment = Alignment.Center
                            ) {
                                if (formData.idImageData != null) {
                                    Image(
                                        painter = rememberAsyncImagePainter(model = formData.idImageData),
                                        contentDescription = null,
                                        contentScale = ContentScale.Fit,
                                        modifier = Modifier
                                            .fillMaxSize()
                                            .padding(6.dp)
                                    )
                                } else {
                                    Text("No ID", color = TextMuted, fontSize = 12.sp)
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(formData.idType, color = TextSecondary, fontSize = 12.sp)
                        }
                    }
                }
            }

            // 2. Personal Details Section
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Personal Details", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        TextButton(onClick = { onEditStep(GuestStep.DETAILS) }) {
                            Text("Edit", color = Purple300, fontSize = 13.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    ReviewFieldRow(label = "Name", value = formData.fullName)
                    ReviewFieldRow(label = "Phone", value = "${formData.countryCode} ${formData.phone}")
                    ReviewFieldRow(label = "Email", value = formData.email.ifBlank { "—" })
                    ReviewFieldRow(label = "Guests", value = "${formData.guestCount}")
                    ReviewFieldRow(label = "Purpose", value = formData.purpose)
                    ReviewFieldRow(label = "Platform", value = formData.bookingPlatform.ifBlank { "—" })
                }
            }

            // 3. Stay Dates Section
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = DarkSurface),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Stay Dates", color = TextPrimary, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        TextButton(onClick = { onEditStep(GuestStep.DATES) }) {
                            Text("Edit", color = Purple300, fontSize = 13.sp)
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    ReviewFieldRow(
                        label = "Check-in",
                        value = "${formatDate(formData.checkinDate)} at ${formatTime(formData.checkinTime)}"
                    )
                    ReviewFieldRow(
                        label = "Check-out",
                        value = "${formatDate(formData.checkoutDate)} at ${formatTime(formData.checkoutTime)}"
                    )
                    ReviewFieldRow(label = "Duration", value = "$nights night${if (nights != 1) "s" else ""}")
                }
            }
        }

        // Submit Button
        Button(
            onClick = onSubmit,
            enabled = !submitting,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            shape = RoundedCornerShape(14.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Purple500,
                contentColor = Color.White
            )
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = if (submitting) "Submitting..." else "Submit for Verification",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun ReviewFieldRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(label, color = TextSecondary, fontSize = 13.sp)
        Text(value, color = TextPrimary, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
    }
}
