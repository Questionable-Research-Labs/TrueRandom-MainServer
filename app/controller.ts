import WebSocket, {Data, Server} from "ws";
import {Server as HttpServer} from "http"

const SECURE_KEY: string = process.env.SECURE_KEY ?? ''; // The secure key for the client to connect with
if (SECURE_KEY.length == 0) { // If the secure key is empty
    // Inform the user they are missing the variable
    console.error('Missing `SECURE_KEY` environment variable. This is required to communicate via websockets... Exiting.');
    process.exit(1); // Exit the process
}
const BUFFER_SIZE: number = parseInt(process.env.BUFFER_SIZE ?? '5'); // The buffer size to request
const KEEP_ALIVE_DELAY: number = parseInt(process.env.KEEP_ALIVE_DELAY ?? '4000'); // The time in ms to wait before sending a keep alive
const DEBUG: boolean = (process.env.DEBUG ?? 'false') === 'true'

interface RequestQueue {
    /**
     *  Requests are placed into a queue based on a uuid
     *  and then called once the value is resolved using
     *  the provided callback
     */
    [uuid: string]: ResultFunction
}

type ResultFunction = (result: number) => any
type BufferFunction = (value: number) => any
type ResolvedFunction = (uuid: string, value: number) => any

class DiceNode {

    ws: WebSocket;
    authenticated: boolean = false;
    aliveTimeout: NodeJS.Timeout;
    connected: boolean = true;

    constructor(ws: WebSocket, onAuth: Function, onBuffer: BufferFunction, onResolved: ResolvedFunction) {
        this.ws = ws;
        this.aliveTimeout = setInterval(() => this.ws.send('ping'), KEEP_ALIVE_DELAY);
        this.ws.on('error', (_: number, reason: string) => { // If encountered an error
            this.ws.close(); // Close the bad connection
            console.error('[WebSocket] Error on dice rolling node code: ' + reason); // Warn the console
        });
        this.ws.on('close', () => { // When the node connection is closed
            this.connected = false; // Mark as no longer connected
            console.log('[WebSocket] Rolling node has disconnected from the server'); // Print the information to the console
        });
        this.ws.on('message', (data: Data) => { // When we receive messages from the node
            const message: string = data.toString(); // Convert the incoming data to a string
            if (DEBUG) console.log('[WebSocketDebug] IN: ' + message)
            if (message == 'pong') return; // If the node is just responding to a ping we can ignore it
            if (!this.authenticated) { // If the node is not authenticated
                if (message == SECURE_KEY) { // If the secure key matches
                    this.authenticated = true; // Mark as authenticated
                    console.log('[WebSocket] Node authenticated successfully.')
                    onAuth(); // Run auth callback
                    this.getBuffer(); // Retrieve the buffer
                } else { // If the key did not match
                    this.ws.close(); // Close the connection
                    console.error('[WebSocket] Node provided an incorrect secure key: ' + SECURE_KEY); // Warn the console
                }
            } else {
                if (message.startsWith("!")) { // If it is a buffer object response
                    const value: number = parseInt(message.substring(1)); // Parse the provided value
                    if (isNaN(value)) { // If an error occurred while parsing the number
                        // Warn the console
                        console.error('[WebSocket] Node provided malformed or invalid return value: ' + message.substring(1))
                    } else {
                        if (DEBUG) console.log('[WebSocketDebug] Filled buffer with new value: ' + value)
                        onBuffer(value); // Run the buffer callback
                    }
                } else { // This is a UUID|VALUE response
                    const parts: string[] = message.split('|'); // Split the message by the pipe char
                    if (parts.length == 2) { // If we have a valid response
                        console.log(parts)
                        const uuid: string = parts[0]; // The uuid for the response
                        const value: number = parseInt(parts[1]); // Parse the provided value
                        if (isNaN(value)) { // If an error occurred while parsing the number
                            // Warn the console
                            console.error('[WebSocket] Node provided malformed or invalid uuid return value: ' + parts[1]);
                        } else {
                            if (DEBUG) console.log('[WebSocketDebug] Resolved for ' + uuid + ': ' + value)
                            onResolved(uuid, value); // Run the resolved callback
                        }
                    } else { // If we dont have a valid response
                        // Warn the console
                        console.error('[WebSocket] Expected uuid|value from node but got the following instead: ' + message);
                    }
                }
            }
        })
    }

    request(uuid: string) {
        try {
            this.ws.send(uuid); // Send the buffer request packet to the client
        } catch (e) {
            console.error('[WebSocket] Unable to send uuid request: ' + e);
        }
    }

    getBuffer() {
        try {
            this.ws.send('!' + BUFFER_SIZE); // Send the buffer request packet to the client
        } catch (e) {
            console.error('[WebSocket] Unable to send buffer request: ' + e);
        }
    }

}

export default class DiceController {

    wsServer: Server; // The web socket server
    node: DiceNode | null = null; // The current dice node or null if not set
    buffer: number[] = []; // The buffer of preloaded values
    queue: RequestQueue = {}; // The queue of requests

    constructor(server: HttpServer) {
        this.wsServer = new Server({server}); // Create a websocket server on the http server
        this.wsServer.on('listening', () => {
            console.log('[WebSocket] Server started and listening for connections.'); // Print a debug message to say we have started
        });
        this.wsServer.on('connection', wsClient => {
            if (this.node !== null) { // If we already have an active node
                wsClient.close(); // Close the connection
                // Warn the console
                console.log('[WebSocket] Another node attempted to connect while there is already a node connected.');
            } else {
                const node: DiceNode = new DiceNode(wsClient,
                    () => this.node = node, // If authenticated set as node
                    (value: number) => this.buffer.push(value), // Add the new buffer value
                    (uuid: string, value: number) => { // When data is resolved
                        if (uuid in this.queue) { // Check that the uuid is still in the queue
                            this.queue[uuid](value); // Resolve the queued function with the value
                            delete this.queue[uuid]; // Remove the resolved item from the queue
                        }
                    }
                );
            }
        })
    }

    request(uuid: string, callback: ResultFunction, buffer: boolean = true) {
        if (buffer && this.buffer.length > 0) { // If we can use the buffer and its not empty
            const value: number = this.buffer.pop() as number; // Pop the value from the array
            callback(value); // Run the callback
        } else {
            this.queue[uuid] = callback; // Add the callback to the queue
            if (this.node !== null) { // If we have an active node
                this.node.request(uuid); // Request a new value
                if (buffer && this.buffer.length == 0) { // If we have no buffer
                    this.node.getBuffer(); // Request the buffer to be filled
                }
            }
        }
    }

}