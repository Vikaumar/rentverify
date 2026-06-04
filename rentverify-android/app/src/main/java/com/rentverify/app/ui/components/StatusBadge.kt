package com.rentverify.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rentverify.app.ui.theme.*

@Composable
fun StatusBadge(
    status: String,
    modifier: Modifier = Modifier
) {
    val (bgColor, textColor, label) = when (status.lowercase()) {
        "pending" -> Triple(StatusPending.copy(alpha = 0.15f), StatusPending, "Pending")
        "approved" -> Triple(StatusApproved.copy(alpha = 0.15f), StatusApproved, "Approved")
        "rejected" -> Triple(StatusRejected.copy(alpha = 0.15f), StatusRejected, "Rejected")
        "flagged" -> Triple(StatusFlagged.copy(alpha = 0.15f), StatusFlagged, "Flagged")
        else -> Triple(Color.Gray.copy(alpha = 0.15f), Color.Gray, status)
    }

    Text(
        text = label,
        color = textColor,
        fontSize = 11.sp,
        fontWeight = FontWeight.SemiBold,
        modifier = modifier
            .background(bgColor, RoundedCornerShape(6.dp))
            .padding(horizontal = 8.dp, vertical = 3.dp)
    )
}

fun getStatusEmoji(status: String): String = when (status.lowercase()) {
    "pending" -> "🟡"
    "approved" -> "✅"
    "rejected" -> "❌"
    "flagged" -> "⚠️"
    else -> "🟡"
}
