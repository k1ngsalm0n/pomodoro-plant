package com.pomodoroplant.ui.timer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pomodoroplant.api.*
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import org.json.JSONObject

class TimerViewModel : ViewModel(), SocketManager.SocketListener {
    private val _seconds = MutableStateFlow(25 * 60)
    val seconds: StateFlow<Int> = _seconds

    private val _pomodoroCount = MutableStateFlow(0)
    val pomodoroCount: StateFlow<Int> = _pomodoroCount

    private val _isRunning = MutableStateFlow(false)
    val isRunning: StateFlow<Boolean> = _isRunning

    private val _onBreak = MutableStateFlow(false)
    val onBreak: StateFlow<Boolean> = _onBreak

    private val _currentPlant = MutableStateFlow<Plant?>(null)
    val currentPlant: StateFlow<Plant?> = _currentPlant

    private var timerJob: Job? = null
    private val studyMinutes = 25.0
    private val shortBreakMinutes = 5.0
    private val longBreakMinutes = 15.0

    private var isSyncingFromRemote = false

    init {
        loadPlantState()
        SocketManager.setListener(this)
        SocketManager.connect(TokenManager.token)
    }

    override fun onTimerUpdate(data: JSONObject) {
        viewModelScope.launch {
            isSyncingFromRemote = true
            _seconds.value = data.optInt("seconds", _seconds.value)
            _pomodoroCount.value = data.optInt("pomodoroCount", _pomodoroCount.value)
            _onBreak.value = data.optBoolean("onBreak", _onBreak.value)
            
            val remoteIsRunning = data.optBoolean("isRunning", false)
            if (remoteIsRunning && !_isRunning.value) {
                startTimer(broadcast = false)
            } else if (!remoteIsRunning && _isRunning.value) {
                pauseTimer(broadcast = false)
            }
            
            isSyncingFromRemote = false
        }
    }

    override fun onPlantUpdate(data: JSONObject) {
        viewModelScope.launch {
            _pomodoroCount.value = data.optInt("growth_stage", _pomodoroCount.value)
            // Note: In a real app, you'd parse the flower object too
        }
    }

    private fun loadPlantState() {
        viewModelScope.launch {
            try {
                val response = NetworkClient.apiService.getPlantState(TokenManager.getAuthHeader())
                if (response.isSuccessful) {
                    val state = response.body()
                    _pomodoroCount.value = state?.growthStage ?: 0
                    _currentPlant.value = state?.flower
                    _seconds.value = (studyMinutes * 60).toInt()
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    fun toggleTimer() {
        if (_isRunning.value) {
            pauseTimer()
        } else {
            startTimer()
        }
    }

    private fun startTimer(broadcast: Boolean = true) {
        if (_isRunning.value) return
        _isRunning.value = true
        if (broadcast) broadcastState()
        timerJob = viewModelScope.launch {
            while (_seconds.value > 0) {
                delay(1000)
                _seconds.value -= 1
            }
            onTimerFinished()
        }
    }

    private fun pauseTimer(broadcast: Boolean = true) {
        _isRunning.value = false
        timerJob?.cancel()
        if (broadcast) broadcastState()
    }

    fun resetTimer() {
        pauseTimer()
        _seconds.value = (studyMinutes * 60).toInt()
        _pomodoroCount.value = 0
        _onBreak.value = false
        broadcastState()
    }

    private suspend fun onTimerFinished() {
        _isRunning.value = false
        if (!_onBreak.value) {
            // Study finished
            _pomodoroCount.value += 1
            growPlant()
            completePomodoro()

            if (_pomodoroCount.value % 4 == 0) {
                _seconds.value = (longBreakMinutes * 60).toInt()
            } else {
                _seconds.value = (shortBreakMinutes * 60).toInt()
            }
            _onBreak.value = true
        } else {
            // Break finished
            _seconds.value = (studyMinutes * 60).toInt()
            _onBreak.value = false
        }
        startTimer() // Auto continue
    }

    private fun growPlant() {
        viewModelScope.launch {
            try {
                val body = mapOf("flowerId" to (_currentPlant.value?.id ?: 0))
                val response = NetworkClient.apiService.growPlant(TokenManager.getAuthHeader(), body)
                if (response.isSuccessful) {
                    _currentPlant.value = response.body()?.flower
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun completePomodoro() {
        viewModelScope.launch {
            try {
                val startResponse = NetworkClient.apiService.startPomodoro(
                    TokenManager.getAuthHeader(),
                    PomodoroStartRequest(studyMinutes, "study")
                )
                if (startResponse.isSuccessful) {
                    val sessionId = startResponse.body()?.sessionId ?: return@launch
                    NetworkClient.apiService.completePomodoro(
                        TokenManager.getAuthHeader(),
                        PomodoroCompleteRequest(sessionId)
                    )
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun broadcastState() {
        if (isSyncingFromRemote) return
        val data = JSONObject().apply {
            put("seconds", _seconds.value)
            put("pomodoroCount", _pomodoroCount.value)
            put("onBreak", _onBreak.value)
            put("isRunning", _isRunning.value)
            put("currentFlowerId", _currentPlant.value?.id)
        }
        SocketManager.syncTimer(data)
    }

    override fun onCleared() {
        super.onCleared()
        SocketManager.setListener(null)
        SocketManager.disconnect()
    }
}
