package com.rentverify.app.data.local.dao

import androidx.room.*
import com.rentverify.app.data.local.entity.VerificationEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface VerificationDao {

    @Query("SELECT * FROM verifications ORDER BY submitted_at DESC")
    fun observeAll(): Flow<List<VerificationEntity>>

    @Query("SELECT * FROM verifications WHERE status = :status ORDER BY submitted_at DESC")
    fun observeByStatus(status: String): Flow<List<VerificationEntity>>

    @Query("SELECT * FROM verifications WHERE id = :id")
    suspend fun getById(id: String): VerificationEntity?

    @Query("SELECT * FROM verifications WHERE status = 'pending' ORDER BY submitted_at ASC")
    fun observePending(): Flow<List<VerificationEntity>>

    @Query("SELECT * FROM verifications WHERE status = 'approved' ORDER BY reviewed_at DESC")
    fun observeApproved(): Flow<List<VerificationEntity>>

    @Query("""
        SELECT * FROM verifications 
        WHERE guest_name LIKE '%' || :query || '%' 
        OR guest_phone LIKE '%' || :query || '%' 
        OR ref_code LIKE '%' || :query || '%'
        OR guest_email LIKE '%' || :query || '%'
        ORDER BY submitted_at DESC
    """)
    fun search(query: String): Flow<List<VerificationEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(verifications: List<VerificationEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(verification: VerificationEntity)

    @Update
    suspend fun update(verification: VerificationEntity)

    @Query("DELETE FROM verifications")
    suspend fun deleteAll()

    // ── Stats Queries ─────────────────────────────────────
    @Query("SELECT COUNT(*) FROM verifications WHERE status = 'pending'")
    suspend fun countPending(): Int

    @Query("SELECT COUNT(*) FROM verifications WHERE status = 'flagged'")
    suspend fun countFlagged(): Int

    @Query("SELECT COUNT(*) FROM verifications WHERE status = 'approved' AND reviewed_at >= :since")
    suspend fun countApprovedSince(since: String): Int
}
