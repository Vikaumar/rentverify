package com.rentverify.app.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rentverify.app.data.remote.dto.DashboardStats
import com.rentverify.app.data.remote.dto.VerificationDto
import com.rentverify.app.data.repository.VerificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class DashboardUiState(
    val stats: DashboardStats = DashboardStats(),
    val upcomingArrivals: List<VerificationDto> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val verificationRepo: VerificationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    init {
        loadDashboard()
        observeApproved()
    }

    private fun observeApproved() {
        verificationRepo.observeApproved()
            .onEach { arrivals ->
                _uiState.value = _uiState.value.copy(upcomingArrivals = arrivals.take(5))
            }
            .launchIn(viewModelScope)
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)

            // Refresh data from API
            verificationRepo.refreshAll()

            // Get stats
            val statsResult = verificationRepo.getStats()
            statsResult.fold(
                onSuccess = { stats ->
                    _uiState.value = _uiState.value.copy(
                        stats = stats,
                        isLoading = false,
                        error = null
                    )
                },
                onFailure = { e ->
                    _uiState.value = _uiState.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            )
        }
    }
}
