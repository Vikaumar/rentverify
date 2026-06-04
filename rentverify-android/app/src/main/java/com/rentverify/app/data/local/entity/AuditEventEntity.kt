package com.rentverify.app.data.local.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "audit_events")
data class AuditEventEntity(
    @PrimaryKey val id: String,
    @ColumnInfo(name = "verification_id") val verificationId: String,
    @ColumnInfo(name = "event_type") val eventType: String,
    val actor: String,
    val description: String,
    val timestamp: String,
    val metadata: String? // JSON string
)
