package com.pomodoroplant.ui.garden

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pomodoroplant.api.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class GardenViewModel : ViewModel() {
    private val _plants = MutableStateFlow<List<Plant>>(emptyList())
    val plants: StateFlow<List<Plant>> = _plants

    private val _totalAvailable = MutableStateFlow(0)
    val totalAvailable: StateFlow<Int> = _totalAvailable

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        loadCollection()
    }

    fun loadCollection() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = NetworkClient.apiService.getCollection(TokenManager.getAuthHeader())
                if (response.isSuccessful) {
                    val body = response.body()
                    _plants.value = body?.plants ?: emptyList()
                    _totalAvailable.value = body?.totalAvailable ?: 0
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
}
