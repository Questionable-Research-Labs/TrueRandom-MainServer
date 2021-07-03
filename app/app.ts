import {createServer, Server} from "http";
import {web} from "./web"
import DiceInterface from "./interface";

const PORT: number = 8080; // The port to listen on

export const server: Server = createServer(web);
server.listen(PORT);
server.on('listening', () => console.log(`Server listening on http://localhost:${PORT}`));
export const diceInterface: DiceInterface = new DiceInterface(server);
