package com.rentverify.app.data.repository

import com.google.gson.Gson
import com.rentverify.app.data.local.dao.AuditEventDao
import com.rentverify.app.data.local.entity.AuditEventEntity
import com.rentverify.app.data.remote.ApiService
import com.rentverify.app.data.remote.dto.AuditEventDto
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuditRepository @Inject constructor(
    private val api: ApiService,
    private val dao: AuditEventDao,
    private val gson: Gson
) {
    fun observeAll(): Flow<List<AuditEventDto>> =
        dao.observeAll().map { it.map(::entityToDto) }

    fun observeByVerificationId(verificationId: String): Flow<List<AuditEventDto>> =
        dao.observeByVerificationId(verificationId).map { it.map(::entityToDto) }

    suspend fun refreshAll(): Result<List<AuditEventDto>> {
        return try {
            val remote = api.getAuditEvents()
            dao.deleteAll()
            dao.insertAll(remote.map(::dtoToEntity))
            Result.success(remote)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshByVerificationId(verificationId: String): Result<List<AuditEventDto>> {
        return try {
            val remote = api.getAuditEvents(verificationId)
            dao.insertAll(remote.map(::dtoToEntity))
            Result.success(remote)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun create(event: AuditEventDto): Result<AuditEventDto> {
        return try {
            val created = api.createAuditEvent(event)
            dao.insert(dtoToEntity(created))
            Result.success(created)
        } catch (e: Exception) {
            dao.insert(dtoToEntity(event))
            Result.failure(e)
        }
    }

    @Suppress("UNCHECKED_CAST")
    private fun dtoToEntity(dto: AuditEventDto) = AuditEventEntity(
        id = dto.id,
        verificationId = dto.verificationId,
        eventType = dto.eventType,
        actor = dto.actor,
        description = dto.description,
        timestamp = dto.timestamp,
        metadata = dto.metadata?.let { gson.toJson(it) }
    )

    @Suppress("UNCHECKED_CAST")
    private fun entityToDto(entity: AuditEventEntity) = AuditEventDto(
        id = entity.id,
        verificationId = entity.verificationId,
        eventType = entity.eventType,
        actor = entity.actor,
        description = entity.description,
        timestamp = entity.timestamp,
        metadata = entity.metadata?.let {
            try { gson.fromJson(it, Map::class.java) as Map<String, Any> } catch (_: Exception) { null }
        }
    )
}
