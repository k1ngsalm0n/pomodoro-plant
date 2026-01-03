package com.pomodoroplant.api

import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject
import java.net.URISyntaxException

object SocketManager {
    private var socket: Socket? = null
    private const val SOCKET_URL = "http://10.0.2.2:5001"

    interface SocketListener {
        fun onTimerUpdate(data: JSONObject)
        fun onPlantUpdate(data: JSONObject)
    }

    private var listener: SocketListener? = null

    fun setListener(listener: SocketListener?) {
        this.listener = listener
    }

    fun connect(token: String?) {
        if (socket != null) return

        try {
            val options = IO.Options().apply {
                auth = mapOf("token" to (token ?: ""))
                reconnection = true
            }
            socket = IO.socket(SOCKET_URL, options)

            socket?.on(Socket.EVENT_CONNECT) {
                println("[Socket] Connected")
            }

            socket?.on("timer:update") { args ->
                val data = args[0] as JSONObject
                println("[Socket] Timer update: $data")
                listener?.onTimerUpdate(data)
            }

            socket?.on("plant:update") { args ->
                val data = args[0] as JSONObject
                println("[Socket] Plant update: $data")
                listener?.onPlantUpdate(data)
            }

            socket?.connect()
        } catch (e: URISyntaxException) {
            e.printStackTrace()
        }
    }

    fun syncTimer(data: JSONObject) {
        socket?.emit("timer:sync", data)
    }

    fun syncPlant(data: JSONObject) {
        socket?.emit("plant:sync", data)
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }
}
