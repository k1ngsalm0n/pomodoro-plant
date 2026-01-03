import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  // Use 10.0.2.2 for Android emulator to access host machine's localhost
  static const String serverUrl = 'http://10.0.2.2:5001';
  io.Socket? _socket;

  bool get isConnected => _socket?.connected ?? false;

  void initialize({String? token}) {
    _socket = io.io(
      serverUrl,
      io.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setAuth(token != null ? {'token': token} : {})
          .enableReconnection()
          .setReconnectionDelay(1000)
          .setReconnectionAttempts(5)
          .build(),
    );

    _setupEventListeners();
  }

  void _setupEventListeners() {
    _socket?.on('connect', (_) {
      print('Connected to WebSocket server');
    });

    _socket?.on('disconnect', (reason) {
      print('Disconnected from WebSocket server: $reason');
    });

    _socket?.on('connect_error', (error) {
      print('Connection error: $error');
    });

    _socket?.on('reconnect_attempt', (attemptNumber) {
      print('Reconnecting... Attempt $attemptNumber');
    });

    _socket?.on('reconnect', (attemptNumber) {
      print('Reconnected after $attemptNumber attempts');
    });

    _socket?.on('reconnect_failed', (_) {
      print('Reconnection failed after max attempts');
    });

    _socket?.on('authenticated', (data) {
      print('Authenticated: $data');
    });

    _socket?.on('authentication_error', (error) {
      print('Authentication error: $error');
    });
  }

  void connect() {
    _socket?.connect();
  }

  void disconnect() {
    _socket?.disconnect();
  }

  void authenticate(String token) {
    _socket?.emit('authenticate', token);
  }

  void syncTimer(Map<String, dynamic> timerData) {
    if (isConnected) {
      _socket?.emit('timer:sync', timerData);
    }
  }

  void syncPlant(Map<String, dynamic> plantData) {
    if (isConnected) {
      _socket?.emit('plant:sync', plantData);
    }
  }

  void onTimerUpdate(Function(Map<String, dynamic>) callback) {
    _socket?.on('timer:update', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      } else if (data is List && data.isNotEmpty) {
        callback(data[0] as Map<String, dynamic>);
      }
    });
  }

  void onPlantUpdate(Function(Map<String, dynamic>) callback) {
    _socket?.on('plant:update', (data) {
      if (data is Map<String, dynamic>) {
        callback(data);
      } else if (data is List && data.isNotEmpty) {
        callback(data[0] as Map<String, dynamic>);
      }
    });
  }

  void dispose() {
    _socket?.dispose();
  }
}
