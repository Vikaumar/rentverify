package com.rentverify.app.data.remote.dto

import com.google.gson.annotations.SerializedName

data class LoginRequest(
    val username: String,
    val password: String,
    val firebaseIdToken: String? = null
)

data class LoginResponse(
    val token: String,
    val user: UserProfile
)

data class UserProfile(
    val username: String,
    val role: String,
    val name: String = "",
    val email: String = "",
    val phone: String = "",
    val avatarUrl: String = "",
    val propertyName: String = ""
)

data class ProfileUpdateRequest(
    val name: String,
    val email: String,
    val phone: String,
    val avatarUrl: String,
    val propertyName: String
)

data class VerificationDto(
    val id: String,
    val refCode: String,
    val status: String,
    val guestName: String,
    val guestPhone: String,
    val guestEmail: String?,
    val guestCount: Int,
    val purpose: String,
    val bookingPlatform: String?,
    val selfieData: String?,
    val idType: String,
    val idImageData: String?,
    val checkinDate: String,
    val checkinTime: String,
    val checkoutDate: String,
    val checkoutTime: String,
    val submittedAt: String,
    val reviewedAt: String?,
    val reviewedBy: String?,
    val rejectionReason: String?,
    val flagReason: String?,
    val guardianNote: String?,
    val linkToken: String,
    val linkExpiresAt: String
)

data class AuditEventDto(
    val id: String,
    val verificationId: String,
    val eventType: String,
    val actor: String,
    val description: String,
    val timestamp: String,
    val metadata: Map<String, Any>?
)

data class DashboardStats(
    val pending: Int = 0,
    val approvedToday: Int = 0,
    val flagged: Int = 0,
    val totalThisMonth: Int = 0,
    val rejectedThisMonth: Int = 0,
    val avgResponseTimeMs: Long = 0
)

data class HealthResponse(
    val status: String,
    val database: String,
    val timestamp: String
)

data class SeedPayload(
    val verifications: List<VerificationDto>,
    val auditEvents: List<AuditEventDto>
)

data class SyncResponse(
    val success: Boolean,
    val synced: Map<String, Int>? = null
)

data class ExportResponse(
    val exportedAt: String,
    val verifications: List<VerificationDto>,
    val auditEvents: List<AuditEventDto>
)

data class GuestSubmission(
    val selfieData: String?,
    val idImageData: String?,
    val idType: String
)
