import WebSocket, {Data, Server} from "ws";

const SECURE_KEY: string = process.env.SECURE_KEY ?? ''
if (SECURE_KEY.length == 0) {
    console.error('NO SECURE_KEY');
    process.exit(1)
}
const BUFFER_SIZE: number = 5;

interface Queue {
    [uuid: string]: Function
}


export default class DiceInterface {

    server: Server;
    client: WebSocket | null = null;
    authenticated: boolean = false;
    sendQueue: Queue = {}
    buffer: number[] = []

    requestBuffer() {
        if (this.client != null) {
            this.client.send(`!${BUFFER_SIZE}`)
        }
    }

    constructor(httpServer: any) {
        this.server = new Server({server: httpServer});
        this.server.on('listening', () => {
            console.log('Listening for websockets')
        })
        this.server.on('connection', client => {
            if (this.client != null) {
                // We already have a client connected get rid of them
                client.close();
            } else {
                client.on('message', (data: Data) => {
                    const value = data.toString()
                    if (value == "pong") {
                        return
                    }
                    if (!this.authenticated) {
                        if (data === SECURE_KEY) {
                            this.authenticated = true;
                            this.client = client
                            this.requestBuffer()
                        } else {
                            client.close();
                            this.reset();
                        }
                    } else {
                        if (value.startsWith("!")) {
                            // Buffer value
                            try {
                                this.buffer.push(parseInt(value.substring(1)))
                            } catch (_) {
                            }
                        } else {
                            const parts: string[] = value.split('|');
                            if (parts.length == 2) {
                                const uuid: string = parts[0];
                                const value: string = parts[1];
                                if (uuid in this.sendQueue) {
                                    this.sendQueue[uuid](value);
                                    delete this.sendQueue[uuid];
                                }
                            }
                        }
                    }
                });
                client.on('error', () => client.close())
                client.on('close', () => this.reset())
            }
        });
        setInterval(() => {
            if (this.client != null) {
                this.client.send("ping")
            }
        }, 4000);

    }

    reset() {
        this.client = null;
        this.authenticated = false;
    }

    queue(uuid: string, callback: Function, twitch: boolean = false) {
        if (!twitch && this.buffer.length > 0) {
            const value = this.buffer.pop()
            callback(value);
        } else {
            this.sendQueue[uuid] = callback;
            if (this.client != null) {
                this.client.send(uuid)
            }
            if (!twitch) this.requestBuffer()
        }
    }


}
