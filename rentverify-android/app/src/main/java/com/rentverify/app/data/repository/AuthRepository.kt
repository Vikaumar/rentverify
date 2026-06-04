package com.rentverify.app.data.repository

import android.content.SharedPreferences
import com.google.firebase.auth.FirebaseAuth
import com.rentverify.app.data.remote.ApiService
import com.rentverify.app.data.remote.AuthInterceptor
import com.rentverify.app.data.remote.dto.LoginRequest
import com.rentverify.app.data.remote.dto.ProfileUpdateRequest
import com.rentverify.app.data.remote.dto.UserProfile
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepository @Inject constructor(
    private val api: ApiService,
    private val authInterceptor: AuthInterceptor,
    private val firebaseAuth: FirebaseAuth,
    private val prefs: SharedPreferences
) {
    private val _user = MutableStateFlow<UserProfile?>(null)
    val user: StateFlow<UserProfile?> = _user.asStateFlow()

    private val _isLoggedIn = MutableStateFlow(false)
    val isLoggedIn: StateFlow<Boolean> = _isLoggedIn.asStateFlow()

    init {
        // Restore session from SharedPreferences
        val savedToken = prefs.getString("auth_token", null)
        val savedUsername = prefs.getString("auth_username", null)
        if (savedToken != null && savedUsername != null) {
            authInterceptor.token = savedToken
            _isLoggedIn.value = true
            _user.value = UserProfile(
                username = savedUsername,
                role = prefs.getString("auth_role", "guardian") ?: "guardian",
                name = prefs.getString("auth_name", "") ?: "",
                email = prefs.getString("auth_email", "") ?: "",
                phone = prefs.getString("auth_phone", "") ?: "",
                avatarUrl = prefs.getString("auth_avatar", "") ?: "",
                propertyName = prefs.getString("auth_property", "") ?: ""
            )
        }
    }

    /**
     * Login with username/password via the backend API.
     */
    suspend fun login(username: String, password: String): Result<UserProfile> {
        return try {
            val response = api.login(LoginRequest(username = username, password = password))
            saveSession(response.token, response.user)
            Result.success(response.user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Login with Firebase Authentication, then exchange Firebase ID token for backend JWT.
     */
    suspend fun loginWithFirebase(email: String, password: String): Result<UserProfile> {
        return try {
            val result = firebaseAuth.signInWithEmailAndPassword(email, password).await()
            val idToken = result.user?.getIdToken(true)?.await()?.token
                ?: throw Exception("Failed to get Firebase ID token")

            val response = api.login(LoginRequest(username = email, password = password, firebaseIdToken = idToken))
            saveSession(response.token, response.user)
            Result.success(response.user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Fetch and refresh user profile from backend.
     */
    suspend fun refreshProfile(): Result<UserProfile> {
        return try {
            val profile = api.getProfile()
            _user.value = profile
            saveUserToPrefs(profile)
            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    /**
     * Update user profile.
     */
    suspend fun updateProfile(
        name: String, email: String, phone: String,
        avatarUrl: String, propertyName: String
    ): Result<UserProfile> {
        return try {
            val updated = api.updateProfile(
                ProfileUpdateRequest(name, email, phone, avatarUrl, propertyName)
            )
            _user.value = updated
            saveUserToPrefs(updated)
            Result.success(updated)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        authInterceptor.token = null
        _user.value = null
        _isLoggedIn.value = false
        firebaseAuth.signOut()
        prefs.edit().apply {
            remove("auth_token")
            remove("auth_username")
            remove("auth_role")
            remove("auth_name")
            remove("auth_email")
            remove("auth_phone")
            remove("auth_avatar")
            remove("auth_property")
            apply()
        }
    }

    private fun saveSession(token: String, user: UserProfile) {
        authInterceptor.token = token
        _user.value = user
        _isLoggedIn.value = true
        prefs.edit().apply {
            putString("auth_token", token)
            apply()
        }
        saveUserToPrefs(user)
    }

    private fun saveUserToPrefs(user: UserProfile) {
        prefs.edit().apply {
            putString("auth_username", user.username)
            putString("auth_role", user.role)
            putString("auth_name", user.name)
            putString("auth_email", user.email)
            putString("auth_phone", user.phone)
            putString("auth_avatar", user.avatarUrl)
            putString("auth_property", user.propertyName)
            apply()
        }
    }
}
