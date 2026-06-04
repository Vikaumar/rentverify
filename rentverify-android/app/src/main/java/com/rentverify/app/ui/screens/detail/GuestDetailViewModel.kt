package com.rentverify.app.ui.screens.detail

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rentverify.app.data.remote.dto.AuditEventDto
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.data.repository.AuditRepository
import com.rentverify.app.data.repository.VerificationRepository
import com.rentverify.app.util.generateId
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

@HiltViewModel
class GuestDetailViewModel @Inject constructor(
    private val verificationRepo: VerificationRepository,
    private val auditRepo: AuditRepository
) : ViewModel() {

    private val _verification = MutableStateFlow<VerificationDto?>(null)
    val verification: StateFlow<VerificationDto?> = _verification.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _actionMessage = MutableSharedFlow<String>()
    val actionMessage: SharedFlow<String> = _actionMessage

    fun loadVerification(id: String) {
        viewModelScope.launch {
            _isLoading.value = true
            val result = verificationRepo.getById(id)
            _verification.value = result
            _isLoading.value = false
        }
    }

    fun approve(note: String = "") {
        val v = _verification.value ?: return
        viewModelScope.launch {
            val now = Instant.now().toString()
            val result = verificationRepo.update(v.id, mapOf(
                "status" to "approved",
                "reviewedAt" to now,
                "reviewedBy" to "Guardian",
                "guardianNote" to note.ifBlank { null }
            ))
            result.onSuccess { _verification.value = it }
            auditRepo.create(AuditEventDto(
                id = generateId(), verificationId = v.id,
                eventType = "approved", actor = "guardian",
                description = "Approved by Guardian", timestamp = now, metadata = null
            ))
            _actionMessage.emit("${v.guestName} has been approved!")
        }
    }

    fun reject(reason: String, note: String = "") {
        val v = _verification.value ?: return
        viewModelScope.launch {
            val now = Instant.now().toString()
            val result = verificationRepo.update(v.id, mapOf(
                "status" to "rejected",
                "reviewedAt" to now,
                "reviewedBy" to "Guardian",
                "rejectionReason" to reason,
                "guardianNote" to note.ifBlank { null }
            ))
            result.onSuccess { _verification.value = it }
            auditRepo.create(AuditEventDto(
                id = generateId(), verificationId = v.id,
                eventType = "rejected", actor = "guardian",
                description = "Rejected: $reason", timestamp = now, metadata = null
            ))
            _actionMessage.emit("${v.guestName} has been rejected.")
        }
    }

    fun flag(reason: String, note: String) {
        val v = _verification.value ?: return
        viewModelScope.launch {
            val now = Instant.now().toString()
            val result = verificationRepo.update(v.id, mapOf(
                "status" to "flagged",
                "reviewedAt" to now,
                "reviewedBy" to "Guardian",
                "flagReason" to reason,
                "guardianNote" to note
            ))
            result.onSuccess { _verification.value = it }
            auditRepo.create(AuditEventDto(
                id = generateId(), verificationId = v.id,
                eventType = "flagged", actor = "guardian",
                description = "Flagged: $reason", timestamp = now, metadata = null
            ))
            _actionMessage.emit("${v.guestName} has been flagged.")
        }
    }
}
