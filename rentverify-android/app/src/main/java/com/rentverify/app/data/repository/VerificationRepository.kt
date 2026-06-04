package com.rentverify.app.data.repository

import com.rentverify.app.data.local.dao.VerificationDao
import com.rentverify.app.data.local.entity.VerificationEntity
import com.rentverify.app.data.remote.ApiService
import com.rentverify.app.data.remote.dto.DashboardStats
import com.rentverify.app.data.remote.dto.GuestSubmission
import com.rentverify.app.data.remote.dto.VerificationDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VerificationRepository @Inject constructor(
    private val api: ApiService,
    private val dao: VerificationDao
) {
    // ── Observe from Room (offline-first) ─────────────────
    fun observeAll(): Flow<List<VerificationDto>> =
        dao.observeAll().map { it.map(::entityToDto) }

    fun observePending(): Flow<List<VerificationDto>> =
        dao.observePending().map { it.map(::entityToDto) }

    fun observeApproved(): Flow<List<VerificationDto>> =
        dao.observeApproved().map { it.map(::entityToDto) }

    fun search(query: String): Flow<List<VerificationDto>> =
        dao.search(query).map { it.map(::entityToDto) }

    // ── Network + Cache sync ──────────────────────────────

    suspend fun refreshAll(): Result<List<VerificationDto>> {
        return try {
            val remote = api.getVerifications()
            dao.deleteAll()
            dao.insertAll(remote.map(::dtoToEntity))
            Result.success(remote)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getById(id: String): VerificationDto? {
        return try {
            val remote = api.getVerificationById(id)
            dao.insert(dtoToEntity(remote))
            remote
        } catch (e: Exception) {
            dao.getById(id)?.let(::entityToDto)
        }
    }

    suspend fun getByToken(token: String): Result<VerificationDto> {
        return try {
            Result.success(api.getVerificationByToken(token))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun create(verification: VerificationDto): Result<VerificationDto> {
        return try {
            val created = api.createVerification(verification)
            dao.insert(dtoToEntity(created))
            Result.success(created)
        } catch (e: Exception) {
            // Optimistic insert to Room for offline
            dao.insert(dtoToEntity(verification))
            Result.failure(e)
        }
    }

    suspend fun update(id: String, updates: Map<String, Any?>): Result<VerificationDto> {
        return try {
            val updated = api.updateVerification(id, updates)
            dao.insert(dtoToEntity(updated))
            Result.success(updated)
        } catch (e: Exception) {
            // Optimistic update in Room
            val existing = dao.getById(id)
            if (existing != null) {
                val merged = applyUpdates(existing, updates)
                dao.update(merged)
            }
            Result.failure(e)
        }
    }

    suspend fun submitGuest(token: String, submission: GuestSubmission): Result<VerificationDto> {
        return try {
            val result = api.submitGuestVerification(token, submission)
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getStats(): Result<DashboardStats> {
        return try {
            Result.success(api.getStats())
        } catch (e: Exception) {
            // Compute from local cache
            val pending = dao.countPending()
            val flagged = dao.countFlagged()
            Result.success(DashboardStats(pending = pending, flagged = flagged))
        }
    }

    // ── Mapping Helpers ───────────────────────────────────

    private fun dtoToEntity(dto: VerificationDto) = VerificationEntity(
        id = dto.id, refCode = dto.refCode, status = dto.status,
        guestName = dto.guestName, guestPhone = dto.guestPhone,
        guestEmail = dto.guestEmail, guestCount = dto.guestCount,
        purpose = dto.purpose, bookingPlatform = dto.bookingPlatform,
        selfieData = dto.selfieData, idType = dto.idType,
        idImageData = dto.idImageData, checkinDate = dto.checkinDate,
        checkinTime = dto.checkinTime, checkoutDate = dto.checkoutDate,
        checkoutTime = dto.checkoutTime, submittedAt = dto.submittedAt,
        reviewedAt = dto.reviewedAt, reviewedBy = dto.reviewedBy,
        rejectionReason = dto.rejectionReason, flagReason = dto.flagReason,
        guardianNote = dto.guardianNote, linkToken = dto.linkToken,
        linkExpiresAt = dto.linkExpiresAt
    )

    private fun entityToDto(entity: VerificationEntity) = VerificationDto(
        id = entity.id, refCode = entity.refCode, status = entity.status,
        guestName = entity.guestName, guestPhone = entity.guestPhone,
        guestEmail = entity.guestEmail, guestCount = entity.guestCount,
        purpose = entity.purpose, bookingPlatform = entity.bookingPlatform,
        selfieData = entity.selfieData, idType = entity.idType,
        idImageData = entity.idImageData, checkinDate = entity.checkinDate,
        checkinTime = entity.checkinTime, checkoutDate = entity.checkoutDate,
        checkoutTime = entity.checkoutTime, submittedAt = entity.submittedAt,
        reviewedAt = entity.reviewedAt, reviewedBy = entity.reviewedBy,
        rejectionReason = entity.rejectionReason, flagReason = entity.flagReason,
        guardianNote = entity.guardianNote, linkToken = entity.linkToken,
        linkExpiresAt = entity.linkExpiresAt
    )

    private fun applyUpdates(entity: VerificationEntity, updates: Map<String, Any?>): VerificationEntity {
        return entity.copy(
            status = (updates["status"] as? String) ?: entity.status,
            reviewedAt = (updates["reviewedAt"] as? String) ?: entity.reviewedAt,
            reviewedBy = (updates["reviewedBy"] as? String) ?: entity.reviewedBy,
            rejectionReason = (updates["rejectionReason"] as? String) ?: entity.rejectionReason,
            flagReason = (updates["flagReason"] as? String) ?: entity.flagReason,
            guardianNote = (updates["guardianNote"] as? String) ?: entity.guardianNote,
        )
    }
}
