package com.rentverify.app.ui.navigation

import androidx.lifecycle.ViewModel
import com.rentverify.app.data.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject

@HiltViewModel
class NavViewModel @Inject constructor(
    val authRepository: AuthRepository
) : ViewModel()
