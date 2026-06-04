package com.rentverify.app.ui.screens.guest

import android.app.DatePickerDialog
import android.app.TimePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rentverify.app.ui.theme.*
import com.rentverify.app.util.calculateNights
import com.rentverify.app.util.formatDate
import com.rentverify.app.util.formatTime
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun StayDatesStep(
    initialData: GuestFormData,
    onNext: (
        checkinDate: String,
        checkinTime: String,
        checkoutDate: String,
        checkoutTime: String
    ) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    var checkinDate by remember { mutableStateOf(initialData.checkinDate) }
    var checkinTime by remember { mutableStateOf(initialData.checkinTime) }
    var checkoutDate by remember { mutableStateOf(initialData.checkoutDate) }
    var checkoutTime by remember { mutableStateOf(initialData.checkoutTime) }

    var checkinError by remember { mutableStateOf<String?>(null) }
    var checkoutError by remember { mutableStateOf<String?>(null) }

    val nights = remember(checkinDate, checkoutDate) {
        calculateNights(checkinDate, checkoutDate)
    }

    // Date/Time Dialog Triggers
    val calendar = Calendar.getInstance()

    val showCheckinDatePicker = {
        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val dateStr = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
                checkinDate = dateStr
                checkinError = null

                // Auto-set checkout date to next day if empty or invalid
                if (checkoutDate.isBlank() || checkoutDate <= dateStr) {
                    val nextDay = Calendar.getInstance().apply {
                        set(year, month, dayOfMonth)
                        add(Calendar.DATE, 1)
                    }
                    checkoutDate = String.format(
                        "%04d-%02d-%02d",
                        nextDay.get(Calendar.YEAR),
                        nextDay.get(Calendar.MONTH) + 1,
                        nextDay.get(Calendar.DAY_OF_MONTH)
                    )
                    checkoutError = null
                }
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    val showCheckoutDatePicker = {
        val minYear: Int
        val minMonth: Int
        val minDay: Int
        if (checkinDate.isNotBlank()) {
            val parts = checkinDate.split("-")
            minYear = parts[0].toInt()
            minMonth = parts[1].toInt() - 1
            minDay = parts[2].toInt()
        } else {
            minYear = calendar.get(Calendar.YEAR)
            minMonth = calendar.get(Calendar.MONTH)
            minDay = calendar.get(Calendar.DAY_OF_MONTH)
        }

        DatePickerDialog(
            context,
            { _, year, month, dayOfMonth ->
                val dateStr = String.format("%04d-%02d-%02d", year, month + 1, dayOfMonth)
                checkoutDate = dateStr
                checkoutError = null
            },
            minYear,
            minMonth,
            minDay
        ).show()
    }

    val showCheckinTimePicker = {
        val parts = checkinTime.split(":")
        TimePickerDialog(
            context,
            { _, hourOfDay, minute ->
                checkinTime = String.format("%02d:%02d", hourOfDay, minute)
            },
            parts.getOrNull(0)?.toInt() ?: 14,
            parts.getOrNull(1)?.toInt() ?: 0,
            false
        ).show()
    }

    val showCheckoutTimePicker = {
        val parts = checkoutTime.split(":")
        TimePickerDialog(
            context,
            { _, hourOfDay, minute ->
                checkoutTime = String.format("%02d:%02d", hourOfDay, minute)
            },
            parts.getOrNull(0)?.toInt() ?: 11,
            parts.getOrNull(1)?.toInt() ?: 0,
            false
        ).show()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(DarkBg)
            .padding(16.dp)
    ) {
        ProgressHeader(step = 4, totalSteps = 4, label = "Stay Dates")

        Column(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .padding(vertical = 24.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Check-in details
            Text("Check-in Date & Time", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Check-in Date Clickable Box
                Box(
                    modifier = Modifier
                        .weight(1.5f)
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSurface)
                        .clickable { showCheckinDatePicker() }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Purple300, modifier = Modifier.size(18.dp))
                        Text(
                            text = if (checkinDate.isBlank()) "Select check-in" else formatDate(checkinDate),
                            color = if (checkinDate.isBlank()) TextMuted else TextPrimary,
                            fontSize = 14.sp
                        )
                    }
                }

                // Check-in Time Clickable Box
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSurface)
                        .clickable { showCheckinTimePicker() }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = Purple300, modifier = Modifier.size(18.dp))
                        Text(
                            text = formatTime(checkinTime),
                            color = TextPrimary,
                            fontSize = 14.sp
                        )
                    }
                }
            }
            checkinError?.let {
                Text(it, color = Red500, fontSize = 11.sp, modifier = Modifier.padding(bottom = 8.dp))
            }

            Spacer(modifier = Modifier.height(8.dp))

            // Check-out details
            Text("Check-out Date & Time", color = TextSecondary, fontSize = 13.sp, fontWeight = FontWeight.Bold)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Check-out Date Clickable Box
                Box(
                    modifier = Modifier
                        .weight(1.5f)
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSurface)
                        .clickable { showCheckoutDatePicker() }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.CalendarToday, contentDescription = null, tint = Purple300, modifier = Modifier.size(18.dp))
                        Text(
                            text = if (checkoutDate.isBlank()) "Select check-out" else formatDate(checkoutDate),
                            color = if (checkoutDate.isBlank()) TextMuted else TextPrimary,
                            fontSize = 14.sp
                        )
                    }
                }

                // Check-out Time Clickable Box
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(56.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(DarkSurface)
                        .clickable { showCheckoutTimePicker() }
                        .padding(horizontal = 16.dp),
                    contentAlignment = Alignment.CenterStart
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.Schedule, contentDescription = null, tint = Purple300, modifier = Modifier.size(18.dp))
                        Text(
                            text = formatTime(checkoutTime),
                            color = TextPrimary,
                            fontSize = 14.sp
                        )
                    }
                }
            }
            checkoutError?.let {
                Text(it, color = Red500, fontSize = 11.sp, modifier = Modifier.padding(bottom = 8.dp))
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Nights Duration Box
            if (nights > 0) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Purple500.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("🌙", fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(16.dp))
                        Text(
                            text = "$nights night${if (nights != 1) "s" else ""} stay",
                            color = Purple300,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
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
                    if (checkinDate.isBlank()) {
                        checkinError = "Check-in date is required"
                        hasError = true
                    }
                    if (checkoutDate.isBlank()) {
                        checkoutError = "Check-out date is required"
                        hasError = true
                    } else if (checkinDate.isNotBlank() && checkoutDate <= checkinDate) {
                        checkoutError = "Check-out must be after check-in"
                        hasError = true
                    }

                    if (!hasError) {
                        onNext(checkinDate, checkinTime, checkoutDate, checkoutTime)
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
                Text("Review Details →", fontWeight = FontWeight.Bold)
            }
        }
    }
}
