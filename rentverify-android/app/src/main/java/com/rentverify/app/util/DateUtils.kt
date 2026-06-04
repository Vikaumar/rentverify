package com.rentverify.app.util

import java.text.SimpleDateFormat
import java.util.*

/**
 * Format "YYYY-MM-DD" to "Jun 2, 2026"
 */
fun formatDate(dateStr: String?): String {
    if (dateStr.isNullOrBlank()) return ""
    return try {
        val parts = dateStr.split("-")
        val date = Calendar.getInstance().apply {
            set(parts[0].toInt(), parts[1].toInt() - 1, parts[2].toInt())
        }
        SimpleDateFormat("MMM d, yyyy", Locale.US).format(date.time)
    } catch (_: Exception) { dateStr }
}

/**
 * Format "HH:MM" to "2:00 PM"
 */
fun formatTime(timeStr: String?): String {
    if (timeStr.isNullOrBlank()) return ""
    return try {
        val parts = timeStr.split(":")
        val hours = parts[0].toInt()
        val minutes = parts[1].toInt()
        val period = if (hours >= 12) "PM" else "AM"
        val displayHours = if (hours % 12 == 0) 12 else hours % 12
        "$displayHours:${minutes.toString().padStart(2, '0')} $period"
    } catch (_: Exception) { timeStr }
}

/**
 * Format ISO date-time to relative time string.
 */
fun formatRelativeTime(isoString: String?): String {
    if (isoString.isNullOrBlank()) return ""
    return try {
        val formats = listOf(
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US),
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US),
            SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US),
        )
        formats.forEach { it.timeZone = TimeZone.getTimeZone("UTC") }

        var date: Date? = null
        for (fmt in formats) {
            try { date = fmt.parse(isoString); break } catch (_: Exception) {}
        }

        if (date == null) return isoString

        val diffMs = System.currentTimeMillis() - date.time
        val diffSec = diffMs / 1000
        val diffMin = diffSec / 60
        val diffHr = diffMin / 60
        val diffDay = diffHr / 24

        when {
            diffSec < 60 -> "just now"
            diffMin < 60 -> "${diffMin} minute${if (diffMin == 1L) "" else "s"} ago"
            diffHr < 24 -> "${diffHr} hour${if (diffHr == 1L) "" else "s"} ago"
            diffDay < 30 -> "${diffDay} day${if (diffDay == 1L) "" else "s"} ago"
            else -> {
                val months = diffDay / 30
                "${months} month${if (months == 1L) "" else "s"} ago"
            }
        }
    } catch (_: Exception) { isoString }
}

/**
 * Calculate nights between check-in and check-out dates.
 */
fun calculateNights(checkinDate: String?, checkoutDate: String?): Int {
    if (checkinDate.isNullOrBlank() || checkoutDate.isNullOrBlank()) return 0
    return try {
        val fmt = SimpleDateFormat("yyyy-MM-dd", Locale.US)
        val start = fmt.parse(checkinDate)!!
        val end = fmt.parse(checkoutDate)!!
        val diffMs = end.time - start.time
        maxOf(0, (diffMs / (1000 * 60 * 60 * 24)).toInt())
    } catch (_: Exception) { 0 }
}

/**
 * Generate a random hex ID (8 characters).
 */
fun generateId(): String {
    val bytes = ByteArray(4)
    Random().nextBytes(bytes)
    return bytes.joinToString("") { "%02x".format(it) }
}

/**
 * Generate a reference code like "REF-20260601-AB12"
 */
fun generateRefCode(): String {
    val cal = Calendar.getInstance()
    val y = cal.get(Calendar.YEAR)
    val m = (cal.get(Calendar.MONTH) + 1).toString().padStart(2, '0')
    val d = cal.get(Calendar.DAY_OF_MONTH).toString().padStart(2, '0')
    val chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    val suffix = (1..4).map { chars.random() }.joinToString("")
    return "REF-$y$m$d-$suffix"
}
