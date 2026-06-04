package com.rentverify.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "verifications")
data class VerificationEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "ref_code") val refCode: String,
    val status: String,
    @ColumnInfo(name = "guest_name") val guestName: String,
    @ColumnInfo(name = "guest_phone") val guestPhone: String,
    @ColumnInfo(name = "guest_email") val guestEmail: String?,
    @ColumnInfo(name = "guest_count") val guestCount: Int,
    val purpose: String,
    @ColumnInfo(name = "booking_platform") val bookingPlatform: String?,
    @ColumnInfo(name = "selfie_data") val selfieData: String?,
    @ColumnInfo(name = "id_type") val idType: String,
    @ColumnInfo(name = "id_image_data") val idImageData: String?,
    @ColumnInfo(name = "checkin_date") val checkinDate: String,
    @ColumnInfo(name = "checkin_time") val checkinTime: String,
    @ColumnInfo(name = "checkout_date") val checkoutDate: String,
    @ColumnInfo(name = "checkout_time") val checkoutTime: String,
    @ColumnInfo(name = "submitted_at") val submittedAt: String,
    @ColumnInfo(name = "reviewed_at") val reviewedAt: String?,
    @ColumnInfo(name = "reviewed_by") val reviewedBy: String?,
    @ColumnInfo(name = "rejection_reason") val rejectionReason: String?,
    @ColumnInfo(name = "flag_reason") val flagReason: String?,
    @ColumnInfo(name = "guardian_note") val guardianNote: String?,
    @ColumnInfo(name = "link_token") val linkToken: String,
    @ColumnInfo(name = "link_expires_at") val linkExpiresAt: String
)
