package com.rentverify.app.ui.screens.guest

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rentverify.app.data.remote.dto.AuditEventDto
import com.rentverify.app.data.remote.dto.GuestSubmission
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.data.repository.AuditRepository
import com.rentverify.app.data.repository.VerificationRepository
import com.rentverify.app.util.generateId
import com.rentverify.app.util.generateRefCode
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.time.Instant
import javax.inject.Inject

enum class GuestStep {
    WELCOME, DETAILS, SELFIE, ID, DATES, REVIEW, CONFIRMATION
}

data class GuestFormData(
    val fullName: String = "",
    val phone: String = "",
    val countryCode: String = "+91",
    val email: String = "",
    val guestCount: Int = 1,
    val purpose: String = "Tourism",
    val bookingPlatform: String = "Airbnb",
    val selfieData: String? = null,
    val idType: String = "Aadhaar",
    val idImageData: String? = null,
    val checkinDate: String = "",
    val checkinTime: String = "14:00",
    val checkoutDate: String = "",
    val checkoutTime: String = "11:00"
)

@HiltViewModel
class GuestFlowViewModel @Inject constructor(
    private val verificationRepo: VerificationRepository,
    private val auditRepo: AuditRepository
) : ViewModel() {

    private val _step = MutableStateFlow(GuestStep.WELCOME)
    val step: StateFlow<GuestStep> = _step.asStateFlow()

    private val _formData = MutableStateFlow(GuestFormData())
    val formData: StateFlow<GuestFormData> = _formData.asStateFlow()

    private val _isPrefilled = MutableStateFlow(false)
    val isPrefilled: StateFlow<Boolean> = _isPrefilled.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _submitting = MutableStateFlow(false)
    val submitting: StateFlow<Boolean> = _submitting.asStateFlow()

    private val _createdRecord = MutableStateFlow<VerificationDto?>(null)
    val createdRecord: StateFlow<VerificationDto?> = _createdRecord.asStateFlow()

    private val _errorMessage = MutableSharedFlow<String>()
    val errorMessage: SharedFlow<String> = _errorMessage.asSharedFlow()

    private val _successMessage = MutableSharedFlow<String>()
    val successMessage: SharedFlow<String> = _successMessage.asSharedFlow()

    fun loadGuestInvitation(token: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val result = verificationRepo.getByToken(token)
                val record = result.getOrNull()
                if (record != null) {
                    // Extract country code if present in phone (e.g. "+91 9876543210")
                    val phoneParts = record.guestPhone.split(" ", limit = 2)
                    val cCode = if (phoneParts.size > 1 && phoneParts[0].startsWith("+")) phoneParts[0] else "+91"
                    val phoneNum = if (phoneParts.size > 1) phoneParts[1] else record.guestPhone.replace(cCode, "").trim()

                    _formData.value = GuestFormData(
                        fullName = record.guestName,
                        phone = phoneNum,
                        countryCode = cCode,
                        email = record.guestEmail ?: "",
                        guestCount = record.guestCount,
                        purpose = record.purpose,
                        bookingPlatform = record.bookingPlatform ?: "Airbnb",
                        selfieData = record.selfieData,
                        idType = record.idType ?: "Aadhaar",
                        idImageData = record.idImageData,
                        checkinDate = record.checkinDate,
                        checkinTime = record.checkinTime ?: "14:00",
                        checkoutDate = record.checkoutDate,
                        checkoutTime = record.checkoutTime ?: "11:00"
                    )
                    _isPrefilled.value = true
                    _successMessage.emit("Reservation loaded for ${record.guestName}!")
                } else {
                    _errorMessage.emit("Invitation link is invalid or expired.")
                }
            } catch (e: Exception) {
                _errorMessage.emit(e.message ?: "Failed to load invitation.")
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun updateDetails(
        fullName: String,
        phone: String,
        countryCode: String,
        email: String,
        guestCount: Int,
        purpose: String,
        bookingPlatform: String
    ) {
        _formData.value = _formData.value.copy(
            fullName = fullName,
            phone = phone,
            countryCode = countryCode,
            email = email,
            guestCount = guestCount,
            purpose = purpose,
            bookingPlatform = bookingPlatform
        )
        _step.value = GuestStep.SELFIE
    }

    fun updateSelfie(selfieData: String) {
        _formData.value = _formData.value.copy(selfieData = selfieData)
        _step.value = GuestStep.ID
    }

    fun updateId(idType: String, idImageData: String) {
        _formData.value = _formData.value.copy(idType = idType, idImageData = idImageData)
        _step.value = if (_isPrefilled.value) GuestStep.REVIEW else GuestStep.DATES
    }

    fun updateIdType(idType: String) {
        _formData.value = _formData.value.copy(idType = idType)
    }

    fun updateDates(checkinDate: String, checkinTime: String, checkoutDate: String, checkoutTime: String) {
        _formData.value = _formData.value.copy(
            checkinDate = checkinDate,
            checkinTime = checkinTime,
            checkoutDate = checkoutDate,
            checkoutTime = checkoutTime
        )
        _step.value = GuestStep.REVIEW
    }

    fun setStep(step: GuestStep) {
        _step.value = step
    }

    fun submitVerification(token: String?) {
        viewModelScope.launch {
            _submitting.value = true
            try {
                val data = _formData.value
                val nowStr = Instant.now().toString()

                if (token != null) {
                    // Update verification on server
                    val result = verificationRepo.submitGuest(token, GuestSubmission(
                        selfieData = data.selfieData,
                        idImageData = data.idImageData,
                        idType = data.idType
                    ))
                    if (result.isSuccess) {
                        val record = result.getOrNull()
                        _createdRecord.value = record
                        _successMessage.emit("Verification submitted successfully!")
                        _step.value = GuestStep.CONFIRMATION
                    } else {
                        _errorMessage.emit(result.exceptionOrNull()?.message ?: "Submission failed.")
                    }
                } else {
                    // Create new local verification (offline/self-reg)
                    val id = generateId()
                    val ref = generateRefCode()
                    val newVerification = VerificationDto(
                        id = id,
                        refCode = ref,
                        status = "pending",
                        guestName = data.fullName,
                        guestPhone = "${data.countryCode} ${data.phone}",
                        guestEmail = data.email.ifBlank { null },
                        guestCount = data.guestCount,
                        purpose = data.purpose,
                        bookingPlatform = data.bookingPlatform.ifBlank { null },
                        selfieData = data.selfieData,
                        idType = data.idType,
                        idImageData = data.idImageData,
                        checkinDate = data.checkinDate,
                        checkinTime = data.checkinTime,
                        checkoutDate = data.checkoutDate,
                        checkoutTime = data.checkoutTime,
                        submittedAt = nowStr,
                        reviewedAt = null,
                        reviewedBy = null,
                        rejectionReason = null,
                        flagReason = null,
                        guardianNote = null,
                        linkToken = "",
                        linkExpiresAt = ""
                    )

                    // Write locally
                    val result = verificationRepo.create(newVerification)
                    if (result.isSuccess) {
                        // Generate Audit Timeline Events
                        val events = listOf(
                            Pair("link_sent", "Verification link sent to ${data.fullName}"),
                            Pair("details_submitted", "Guest details submitted"),
                            Pair("selfie_uploaded", "Selfie photo uploaded"),
                            Pair("id_uploaded", "${data.idType} photo uploaded"),
                            Pair("submission_complete", "Verification submission completed")
                        )
                        events.forEachIndexed { index, (type, desc) ->
                            auditRepo.create(AuditEventDto(
                                id = generateId(),
                                verificationId = id,
                                eventType = type,
                                actor = if (type == "link_sent") "system" else "guest",
                                description = desc,
                                timestamp = Instant.now().plusMillis(index * 100L).toString(),
                                metadata = null
                            ))
                        }
                        _createdRecord.value = newVerification
                        _successMessage.emit("Verification submitted successfully!")
                        _step.value = GuestStep.CONFIRMATION
                    } else {
                        _errorMessage.emit(result.exceptionOrNull()?.message ?: "Submission failed.")
                    }
                }
            } catch (e: Exception) {
                _errorMessage.emit(e.message ?: "Failed to submit verification.")
            } finally {
                _submitting.value = false
            }
        }
    }
}
