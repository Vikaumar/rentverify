package com.rentverify.app.data.local.dao

import androidx.room.*
import com.rentverify.app.data.local.entity.AuditEventEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface AuditEventDao {

    @Query("SELECT * FROM audit_events ORDER BY timestamp ASC")
    fun observeAll(): Flow<List<AuditEventEntity>>

    @Query("SELECT * FROM audit_events WHERE verification_id = :verificationId ORDER BY timestamp ASC")
    fun observeByVerificationId(verificationId: String): Flow<List<AuditEventEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(events: List<AuditEventEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(event: AuditEventEntity)

    @Query("DELETE FROM audit_events")
    suspend fun deleteAll()
}
