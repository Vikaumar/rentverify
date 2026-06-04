package com.rentverify.app.ui.screens.invite

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.data.repository.VerificationRepository
import com.rentverify.app.util.generateId
import com.rentverify.app.util.generateRefCode
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit
import javax.inject.Inject

data class InviteUiState(
    val guestName: String = "",
    val guestPhone: String = "",
    val guestEmail: String = "",
    val guestCount: String = "1",
    val purpose: String = "Tourism",
    val bookingPlatform: String = "",
    val idType: String = "Aadhaar",
    val checkinDate: String = LocalDate.now().plusDays(1).toString(),
    val checkinTime: String = "14:00",
    val checkoutDate: String = LocalDate.now().plusDays(3).toString(),
    val checkoutTime: String = "11:00",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSuccess: Boolean = false
)

@HiltViewModel
class InviteGuestViewModel @Inject constructor(
    private val verificationRepo: VerificationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(InviteUiState())
    val uiState: StateFlow<InviteUiState> = _uiState.asStateFlow()

    fun onFieldChange(field: String, value: String) {
        _uiState.value = when (field) {
            "guestName" -> _uiState.value.copy(guestName = value)
            "guestPhone" -> _uiState.value.copy(guestPhone = value)
            "guestEmail" -> _uiState.value.copy(guestEmail = value)
            "guestCount" -> _uiState.value.copy(guestCount = value)
            "purpose" -> _uiState.value.copy(purpose = value)
            "bookingPlatform" -> _uiState.value.copy(bookingPlatform = value)
            "idType" -> _uiState.value.copy(idType = value)
            "checkinDate" -> _uiState.value.copy(checkinDate = value)
            "checkinTime" -> _uiState.value.copy(checkinTime = value)
            "checkoutDate" -> _uiState.value.copy(checkoutDate = value)
            "checkoutTime" -> _uiState.value.copy(checkoutTime = value)
            else -> _uiState.value
        }
    }

    fun submit() {
        val s = _uiState.value
        if (s.guestName.isBlank() || s.guestPhone.isBlank()) {
            _uiState.value = s.copy(error = "Guest name and phone are required")
            return
        }

        viewModelScope.launch {
            _uiState.value = s.copy(isLoading = true, error = null)
            val id = generateId()
            val verification = VerificationDto(
                id = id,
                refCode = generateRefCode(),
                status = "pending",
                guestName = s.guestName,
                guestPhone = s.guestPhone,
                guestEmail = s.guestEmail.ifBlank { null },
                guestCount = s.guestCount.toIntOrNull() ?: 1,
                purpose = s.purpose,
                bookingPlatform = s.bookingPlatform.ifBlank { null },
                selfieData = null,
                idType = s.idType,
                idImageData = null,
                checkinDate = s.checkinDate,
                checkinTime = s.checkinTime,
                checkoutDate = s.checkoutDate,
                checkoutTime = s.checkoutTime,
                submittedAt = Instant.now().toString(),
                reviewedAt = null,
                reviewedBy = null,
                rejectionReason = null,
                flagReason = null,
                guardianNote = null,
                linkToken = "tok_$id",
                linkExpiresAt = Instant.now().plus(24, ChronoUnit.HOURS).toString()
            )

            val result = verificationRepo.create(verification)
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isLoading = false, isSuccess = true) },
                onFailure = { e -> _uiState.value = _uiState.value.copy(isLoading = false, error = e.message ?: "Failed to send invite") }
            )
        }
    }
}
