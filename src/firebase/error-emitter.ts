import { EventEmitter } from 'events';

// A simple event emitter to broadcast errors globally.
export const errorEmitter = new EventEmitter();
