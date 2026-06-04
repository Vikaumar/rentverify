package com.rentverify.app.data.remote

import com.rentverify.app.data.remote.dto.*
import retrofit2.http.*

/**
 * Retrofit API service interface mirroring all backend endpoints.
 */
interface ApiService {

    // ── Health ─────────────────────────────────────────────
    @GET("health")
    suspend fun checkHealth(): HealthResponse

    // ── Auth ──────────────────────────────────────────────
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): LoginResponse

    @GET("auth/profile")
    suspend fun getProfile(): UserProfile

    @PUT("auth/profile")
    suspend fun updateProfile(@Body profile: ProfileUpdateRequest): UserProfile

    // ── Verifications ─────────────────────────────────────
    @GET("verifications")
    suspend fun getVerifications(
        @Query("status") status: String? = null,
        @Query("search") search: String? = null,
        @Query("fromDate") fromDate: String? = null,
        @Query("toDate") toDate: String? = null,
        @Query("sort") sort: String? = null
    ): List<VerificationDto>

    @GET("verifications/{id}")
    suspend fun getVerificationById(@Path("id") id: String): VerificationDto

    @GET("verifications/by-token/{token}")
    suspend fun getVerificationByToken(@Path("token") token: String): VerificationDto

    @POST("verifications")
    suspend fun createVerification(@Body verification: VerificationDto): VerificationDto

    @PUT("verifications/{id}")
    suspend fun updateVerification(
        @Path("id") id: String,
        @Body updates: Map<String, @JvmSuppressWildcards Any?>
    ): VerificationDto

    @PUT("verifications/by-token/{token}")
    suspend fun submitGuestVerification(
        @Path("token") token: String,
        @Body submission: GuestSubmission
    ): VerificationDto

    // ── Audit Events ──────────────────────────────────────
    @GET("audit-events")
    suspend fun getAuditEvents(
        @Query("verificationId") verificationId: String? = null
    ): List<AuditEventDto>

    @POST("audit-events")
    suspend fun createAuditEvent(@Body event: AuditEventDto): AuditEventDto

    // ── Stats ─────────────────────────────────────────────
    @GET("stats")
    suspend fun getStats(): DashboardStats

    // ── Data Management ───────────────────────────────────
    @POST("seed")
    suspend fun seedData(@Body payload: SeedPayload): SyncResponse

    @POST("sync")
    suspend fun syncData(@Body payload: SeedPayload): SyncResponse

    @GET("export")
    suspend fun exportData(): ExportResponse
}
