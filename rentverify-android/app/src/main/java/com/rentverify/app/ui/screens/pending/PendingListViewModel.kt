package com.rentverify.app.ui.screens.pending

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
class PendingListViewModel @Inject constructor(
    private val verificationRepo: VerificationRepository,
    private val auditRepo: AuditRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery

    val verifications: StateFlow<List<VerificationDto>> = _searchQuery
        .debounce(300)
        .flatMapLatest { query ->
            if (query.isBlank()) verificationRepo.observeAll()
            else verificationRepo.search(query)
        }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    private val _actionResult = MutableSharedFlow<String>()
    val actionResult: SharedFlow<String> = _actionResult

    init {
        viewModelScope.launch { verificationRepo.refreshAll() }
    }

    fun onSearchChange(query: String) { _searchQuery.value = query }

    fun approve(verification: VerificationDto) {
        viewModelScope.launch {
            val now = Instant.now().toString()
            verificationRepo.update(verification.id, mapOf(
                "status" to "approved",
                "reviewedAt" to now,
                "reviewedBy" to "Guardian"
            ))
            auditRepo.create(AuditEventDto(
                id = generateId(), verificationId = verification.id,
                eventType = "approved", actor = "guardian",
                description = "Approved by Guardian", timestamp = now, metadata = null
            ))
            _actionResult.emit("${verification.guestName} has been approved!")
        }
    }

    fun reject(verification: VerificationDto, reason: String) {
        viewModelScope.launch {
            val now = Instant.now().toString()
            verificationRepo.update(verification.id, mapOf(
                "status" to "rejected",
                "reviewedAt" to now,
                "reviewedBy" to "Guardian",
                "rejectionReason" to reason
            ))
            auditRepo.create(AuditEventDto(
                id = generateId(), verificationId = verification.id,
                eventType = "rejected", actor = "guardian",
                description = "Rejected: $reason", timestamp = now, metadata = null
            ))
            _actionResult.emit("${verification.guestName} has been rejected.")
        }
    }

    fun flag(verification: VerificationDto, reason: String, note: String) {
        viewModelScope.launch {
            val now = Instant.now().toString()
            verificationRepo.update(verification.id, mapOf(
                "status" to "flagged",
                "reviewedAt" to now,
                "reviewedBy" to "Guardian",
                "flagReason" to reason,
                "guardianNote" to note
            ))
            auditRepo.create(AuditEventDto(
                id = generateId(), verificationId = verification.id,
                eventType = "flagged", actor = "guardian",
                description = "Flagged: $reason", timestamp = now, metadata = null
            ))
            _actionResult.emit("${verification.guestName} has been flagged.")
        }
    }
}
