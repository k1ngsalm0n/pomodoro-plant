package com.pomodoroplant.ui.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pomodoroplant.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class LoginViewModel : ViewModel() {
    private val _username = MutableStateFlow("")
    val username: StateFlow<String> = _username

    private val _password = MutableStateFlow("")
    val password: StateFlow<String> = _password

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    fun onUsernameChange(value: String) {
        _username.value = value
    }

    fun onPasswordChange(value: String) {
        _password.value = value
    }

    fun login(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = NetworkClient.apiService.login(LoginRequest(_username.value, _password.value))
                if (response.isSuccessful) {
                    val body = response.body()
                    TokenManager.token = body?.token
                    TokenManager.username = body?.username
                    onSuccess()
                } else {
                    _error.value = "Invalid login"
                }
            } catch (e: Exception) {
                _error.value = "Connection error"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun register(onSuccess: () -> Unit) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = NetworkClient.apiService.register(LoginRequest(_username.value, _password.value))
                if (response.isSuccessful) {
                    val body = response.body()
                    TokenManager.token = body?.token
                    TokenManager.username = body?.username
                    onSuccess()
                } else {
                    _error.value = "Registration failed"
                }
            } catch (e: Exception) {
                _error.value = "Connection error"
            } finally {
                _isLoading.value = false
            }
        }
    }
}
