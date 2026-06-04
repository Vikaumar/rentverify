package com.rentverify.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import com.rentverify.app.data.local.dao.AuditEventDao
import com.rentverify.app.data.local.dao.VerificationDao
import com.rentverify.app.data.local.entity.AuditEventEntity
import com.rentverify.app.data.local.entity.VerificationEntity

@Database(
    entities = [VerificationEntity::class, AuditEventEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun verificationDao(): VerificationDao
    abstract fun auditEventDao(): AuditEventDao
}
