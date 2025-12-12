/**
 * Push Notifications for Pomodoro Plant
 * Browser notification API wrapper
 */

class PomodoroNotifications {
    constructor() {
        this.enabled = true;
        // Sync permission state on construction
        if ('Notification' in window) {
            this.permission = Notification.permission;
        } else {
            this.permission = 'denied';
        }
    }

    // Request permission for notifications
    async requestPermission() {
        if (!('Notification' in window)) {
            console.log('[Notifications] This browser does not support notifications');
            return false;
        }

        console.log('[Notifications] Current permission:', Notification.permission);

        if (Notification.permission === 'granted') {
            this.permission = 'granted';
            console.log('[Notifications] Permission already granted');
            return true;
        }

        if (Notification.permission !== 'denied') {
            try {
                const permission = await Notification.requestPermission();
                this.permission = permission;
                console.log('[Notifications] Permission result:', permission);
                return permission === 'granted';
            } catch (err) {
                console.error('[Notifications] Error requesting permission:', err);
                return false;
            }
        }

        console.log('[Notifications] Permission denied');
        return false;
    }

    // Show a notification
    show(title, body, icon = '/assets/flower-img.png') {
        // Re-sync permission state
        if ('Notification' in window) {
            this.permission = Notification.permission;
        }

        console.log('[Notifications] Attempting to show:', title, 'Permission:', this.permission, 'Enabled:', this.enabled);

        if (!this.enabled) {
            console.log('[Notifications] Notifications disabled');
            return null;
        }

        if (this.permission !== 'granted') {
            console.log('[Notifications] Permission not granted');
            return null;
        }

        try {
            const notification = new Notification(title, {
                body: body,
                icon: icon,
                tag: 'pomodoro-plant-' + Date.now(),
                requireInteraction: false
            });

            console.log('[Notifications] Notification created successfully');

            // Auto-close after 5 seconds
            setTimeout(() => notification.close(), 5000);

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            return notification;
        } catch (err) {
            console.error('[Notifications] Error creating notification:', err);
            return null;
        }
    }

    // Timer complete notification
    showTimerComplete(sessionType) {
        if (sessionType === 'study') {
            return this.show(
                '🌱 Study Session Complete!',
                'Great work! Your plant is growing. Take a well-deserved break.'
            );
        } else {
            return this.show(
                '⏰ Break Time Over!',
                'Ready to focus again? Your plant needs more care!'
            );
        }
    }

    // Plant grown notification
    showPlantGrown(stage) {
        return this.show(
            `☕ Plant Grew! Stage ${stage}/4`,
            "Your plant is thriving! It's time for a break!"
        );
    }

    // Flower unlocked notification
    showFlowerUnlocked(flowerName) {
        return this.show(
            '🌸 New Flower Unlocked!',
            `Congratulations! You've grown a ${flowerName}!`
        );
    }

    // Toggle notifications on/off
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Global notifications instance
const notifications = new PomodoroNotifications();

