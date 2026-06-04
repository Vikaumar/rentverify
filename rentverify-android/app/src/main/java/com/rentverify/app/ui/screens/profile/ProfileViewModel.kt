package com.rentverify.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.rentverify.app.data.remote.dto.UserProfile
import com.rentverify.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileUiState(
    val user: UserProfile? = null,
    val isEditing: Boolean = false,
    val editName: String = "",
    val editEmail: String = "",
    val editPhone: String = "",
    val editPropertyName: String = "",
    val isSaving: Boolean = false,
    val message: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val authRepo: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            authRepo.user.collect { user ->
                _uiState.value = _uiState.value.copy(
                    user = user,
                    editName = user?.name ?: "",
                    editEmail = user?.email ?: "",
                    editPhone = user?.phone ?: "",
                    editPropertyName = user?.propertyName ?: ""
                )
            }
        }
    }

    fun toggleEdit() {
        val state = _uiState.value
        _uiState.value = state.copy(isEditing = !state.isEditing)
    }

    fun onFieldChange(field: String, value: String) {
        _uiState.value = when (field) {
            "name" -> _uiState.value.copy(editName = value)
            "email" -> _uiState.value.copy(editEmail = value)
            "phone" -> _uiState.value.copy(editPhone = value)
            "propertyName" -> _uiState.value.copy(editPropertyName = value)
            else -> _uiState.value
        }
    }

    fun saveProfile() {
        val s = _uiState.value
        viewModelScope.launch {
            _uiState.value = s.copy(isSaving = true)
            val result = authRepo.updateProfile(
                name = s.editName,
                email = s.editEmail,
                phone = s.editPhone,
                avatarUrl = s.user?.avatarUrl ?: "",
                propertyName = s.editPropertyName
            )
            result.fold(
                onSuccess = { _uiState.value = _uiState.value.copy(isSaving = false, isEditing = false, message = "Profile updated!") },
                onFailure = { _uiState.value = _uiState.value.copy(isSaving = false, message = "Failed to update profile") }
            )
        }
    }

    fun logout() { authRepo.logout() }
}
