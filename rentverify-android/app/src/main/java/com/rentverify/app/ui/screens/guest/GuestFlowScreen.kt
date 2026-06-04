package com.rentverify.app.ui.screens.guest

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import com.rentverify.app.ui.theme.DarkBg
import com.rentverify.app.ui.theme.Purple500

@Composable
fun GuestFlowScreen(
    token: String?,
    onComplete: () -> Unit,
    viewModel: GuestFlowViewModel = hiltViewModel()
) {
    val step by viewModel.step.collectAsState()
    val formData by viewModel.formData.collectAsState()
    val isPrefilled by viewModel.isPrefilled.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val submitting by viewModel.submitting.collectAsState()
    val createdRecord by viewModel.createdRecord.collectAsState()

    val snackbarHostState = remember { SnackbarHostState() }

    LaunchedEffect(token) {
        if (token != null) {
            viewModel.loadGuestInvitation(token)
        }
    }

    LaunchedEffect(Unit) {
        viewModel.errorMessage.collect { msg ->
            snackbarHostState.showSnackbar(
                message = msg,
                duration = SnackbarDuration.Long
            )
        }
    }

    LaunchedEffect(Unit) {
        viewModel.successMessage.collect { msg ->
            snackbarHostState.showSnackbar(
                message = msg,
                duration = SnackbarDuration.Short
            )
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        modifier = Modifier.fillMaxSize()
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(DarkBg)
                .padding(paddingValues)
        ) {
            if (isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator(color = Purple500)
                }
            } else {
                when (step) {
                    GuestStep.WELCOME -> {
                        WelcomeStep(
                            guestName = if (isPrefilled) formData.fullName else null,
                            bookingPlatform = if (isPrefilled) formData.bookingPlatform else null,
                            onNext = {
                                viewModel.setStep(if (isPrefilled) GuestStep.SELFIE else GuestStep.DETAILS)
                            }
                        )
                    }
                    GuestStep.DETAILS -> {
                        DetailsStep(
                            initialData = formData,
                            onNext = { name, phone, code, email, count, purpose, platform ->
                                viewModel.updateDetails(name, phone, code, email, count, purpose, platform)
                            },
                            onBack = {
                                viewModel.setStep(GuestStep.WELCOME)
                            }
                        )
                    }
                    GuestStep.SELFIE -> {
                        PhotoUploadStep(
                            type = "selfie",
                            initialImage = formData.selfieData,
                            onNext = { selfie ->
                                viewModel.updateSelfie(selfie)
                            },
                            onBack = {
                                viewModel.setStep(if (isPrefilled) GuestStep.WELCOME else GuestStep.DETAILS)
                            }
                        )
                    }
                    GuestStep.ID -> {
                        PhotoUploadStep(
                            type = "id",
                            initialImage = formData.idImageData,
                            idType = formData.idType,
                            onIdTypeChange = { type ->
                                viewModel.updateIdType(type)
                            },
                            onNext = { idImage ->
                                viewModel.updateId(formData.idType, idImage)
                            },
                            onBack = {
                                viewModel.setStep(GuestStep.SELFIE)
                            }
                        )
                    }
                    GuestStep.DATES -> {
                        StayDatesStep(
                            initialData = formData,
                            onNext = { checkin, checkinTime, checkout, checkoutTime ->
                                viewModel.updateDates(checkin, checkinTime, checkout, checkoutTime)
                            },
                            onBack = {
                                viewModel.setStep(GuestStep.ID)
                            }
                        )
                    }
                    GuestStep.REVIEW -> {
                        ReviewSubmitStep(
                            formData = formData,
                            submitting = submitting,
                            onEditStep = { targetStep ->
                                viewModel.setStep(targetStep)
                            },
                            onSubmit = {
                                viewModel.submitVerification(token)
                            }
                        )
                    }
                    GuestStep.CONFIRMATION -> {
                        ConfirmationStep(
                            record = createdRecord,
                            isGuest = isPrefilled,
                            onReturnToDashboard = onComplete
                        )
                    }
                }
            }
        }
    }
}
