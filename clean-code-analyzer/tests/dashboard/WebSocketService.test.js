"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocketService_1 = require("../../src/dashboard/services/WebSocketService");
// Mock WebSocket
class MockWebSocket {
    constructor(url) {
        this.url = url;
        this.readyState = MockWebSocket.CLOSED;
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;
        // Simulate async connection
        setTimeout(() => {
            this.readyState = MockWebSocket.OPEN;
            if (this.onopen) {
                this.onopen(new Event('open'));
            }
        }, 10);
    }
    send(data) {
        if (this.readyState !== MockWebSocket.OPEN) {
            throw new Error('WebSocket is not open');
        }
    }
    close() {
        this.readyState = MockWebSocket.CLOSED;
        if (this.onclose) {
            this.onclose(new CloseEvent('close'));
        }
    }
    // Helper method to simulate receiving messages
    simulateMessage(data) {
        if (this.onmessage) {
            this.onmessage(new MessageEvent('message', {
                data: JSON.stringify(data)
            }));
        }
    }
    // Helper method to simulate errors
    simulateError() {
        if (this.onerror) {
            this.onerror(new Event('error'));
        }
    }
}
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSED = 3;
// Replace global WebSocket with mock
global.WebSocket = MockWebSocket;
describe('WebSocketService', () => {
    let service;
    let mockWebSocket;
    beforeEach(() => {
        service = new WebSocketService_1.WebSocketService();
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(console, 'error').mockImplementation();
        jest.spyOn(console, 'warn').mockImplementation();
    });
    afterEach(() => {
        service.disconnect();
        jest.restoreAllMocks();
    });
    it('connects to WebSocket server', async () => {
        service.connect('ws://localhost:8080');
        // Wait for connection to establish
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(service.isConnected()).toBe(true);
    });
    it('handles connection errors gracefully', () => {
        const errorHandler = jest.fn();
        service.onError(errorHandler);
        service.connect('ws://invalid-url');
        // Simulate connection error
        const ws = service.ws;
        ws.simulateError();
        expect(errorHandler).toHaveBeenCalled();
    });
    it('receives and parses messages correctly', async () => {
        const messageHandler = jest.fn();
        service.onMessage(messageHandler);
        service.connect('ws://localhost:8080');
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 20));
        const testMessage = { type: 'test', data: 'hello' };
        const ws = service.ws;
        ws.simulateMessage(testMessage);
        expect(messageHandler).toHaveBeenCalledWith(testMessage);
    });
    it('handles malformed JSON messages', async () => {
        const messageHandler = jest.fn();
        service.onMessage(messageHandler);
        service.connect('ws://localhost:8080');
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 20));
        const ws = service.ws;
        if (ws.onmessage) {
            ws.onmessage(new MessageEvent('message', { data: 'invalid json' }));
        }
        // Should not call message handler for invalid JSON
        expect(messageHandler).not.toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Failed to parse WebSocket message:', expect.any(Error));
    });
    it('sends messages when connected', async () => {
        service.connect('ws://localhost:8080');
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 20));
        const ws = service.ws;
        const sendSpy = jest.spyOn(ws, 'send');
        const testMessage = { type: 'test', data: 'hello' };
        service.send(testMessage);
        expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(testMessage));
    });
    it('does not send messages when disconnected', () => {
        const testMessage = { type: 'test', data: 'hello' };
        service.send(testMessage);
        expect(console.warn).toHaveBeenCalledWith('WebSocket is not connected. Message not sent:', testMessage);
    });
    it('attempts reconnection on connection loss', async () => {
        service.connect('ws://localhost:8080');
        // Wait for initial connection
        await new Promise(resolve => setTimeout(resolve, 20));
        const ws = service.ws;
        // Simulate connection loss
        ws.close();
        expect(console.log).toHaveBeenCalledWith('Attempting to reconnect (1/5)...');
    });
    it('stops reconnecting after max attempts', async () => {
        const errorHandler = jest.fn();
        service.onError(errorHandler);
        // Set a very short reconnect interval for testing
        service.reconnectInterval = 10;
        service.connect('ws://localhost:8080');
        // Simulate multiple connection failures
        for (let i = 0; i < 6; i++) {
            const ws = service.ws;
            if (ws) {
                ws.simulateError();
                ws.close();
            }
            await new Promise(resolve => setTimeout(resolve, 15));
        }
        expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({
            type: 'Max reconnection attempts reached'
        }));
    });
    it('disconnects cleanly', async () => {
        service.connect('ws://localhost:8080');
        // Wait for connection
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(service.isConnected()).toBe(true);
        service.disconnect();
        expect(service.isConnected()).toBe(false);
    });
    it('clears handlers on disconnect', async () => {
        const messageHandler = jest.fn();
        const errorHandler = jest.fn();
        service.onMessage(messageHandler);
        service.onError(errorHandler);
        service.connect('ws://localhost:8080');
        await new Promise(resolve => setTimeout(resolve, 20));
        service.disconnect();
        // Handlers should be cleared
        expect(service.messageHandlers).toHaveLength(0);
        expect(service.errorHandlers).toHaveLength(0);
    });
    it('supports multiple message handlers', async () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        service.onMessage(handler1);
        service.onMessage(handler2);
        service.connect('ws://localhost:8080');
        await new Promise(resolve => setTimeout(resolve, 20));
        const testMessage = { type: 'test', data: 'hello' };
        const ws = service.ws;
        ws.simulateMessage(testMessage);
        expect(handler1).toHaveBeenCalledWith(testMessage);
        expect(handler2).toHaveBeenCalledWith(testMessage);
    });
    it('supports multiple error handlers', async () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        service.onError(handler1);
        service.onError(handler2);
        service.connect('ws://localhost:8080');
        const ws = service.ws;
        ws.simulateError();
        expect(handler1).toHaveBeenCalled();
        expect(handler2).toHaveBeenCalled();
    });
});
//# sourceMappingURL=WebSocketService.test.js.map