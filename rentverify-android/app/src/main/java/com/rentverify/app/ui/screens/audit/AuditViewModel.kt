package com.rentverify.app.ui.screens.audit

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rentverify.app.data.remote.dto.AuditEventDto
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.data.repository.AuditRepository
import com.rentverify.app.data.repository.VerificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuditViewModel @Inject constructor(
    private val auditRepo: AuditRepository,
    private val verificationRepo: VerificationRepository
) : ViewModel() {

    val verifications: StateFlow<List<VerificationDto>> = verificationRepo.observeAll()
        .map { list -> list.filter { it.status != "pending" } }
        .stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    private val _events = MutableStateFlow<List<AuditEventDto>>(emptyList())
    val events: StateFlow<List<AuditEventDto>> = _events.asStateFlow()

    init {
        viewModelScope.launch {
            verificationRepo.refreshAll()
            auditRepo.refreshAll()
        }
    }

    fun loadEventsForVerification(verificationId: String) {
        viewModelScope.launch {
            auditRepo.refreshByVerificationId(verificationId)
        }
    }

    fun observeEventsForVerification(verificationId: String): Flow<List<AuditEventDto>> =
        auditRepo.observeByVerificationId(verificationId)
}
