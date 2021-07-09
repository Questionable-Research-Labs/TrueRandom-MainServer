import rateLimit, {RateLimit} from "express-rate-limit";

require('dotenv').config();

import {createServer, Server} from "http";
import express, {Express, Handler, Request, RequestHandler, Response} from "express"
import * as path from "path";
import morgan from "morgan";
import sassMiddleware from "node-sass-middleware"
import api from "./routes/api";
import DiceController from "./controller";

const PORT: number = parseInt(process.env.PORT ?? '8080'); // The port to listen on
const ROOT_PATH: string = path.join(__dirname, '../'); // The path to the root of the server
const PUBLIC_PATH: string = path.join(ROOT_PATH, 'public'); // The path to the publicly served directory
const ERROR_FILE_PATH: string = path.join(PUBLIC_PATH, 'error.html')

// The value that if specified in the authorization header will bypass rate limiting
const RATE_BYPASS_KEY: string = process.env.RATE_BYPASS_KEY ?? 'RateBypass';
// The number of minutes before the rate limit resets
const RATE_LIMIT_MINUTES: number = parseInt(process.env.RATE_LIMIT_MINUTES ?? '1');
// The total number of requests before rate limiting
const RATE_LIMIT_TOTAL: number = parseInt(process.env.RATE_LIMIT_TOTAL ?? '10');

const app: Express = express(); // Create a new express application
const server: Server = createServer(app); // Create a new http server
const logger: Handler = morgan('common'); // Create a request logger (logs

const sass: RequestHandler = sassMiddleware({
    src: PUBLIC_PATH, // The source location of the sass files
    dest: PUBLIC_PATH, // The path to store the compiled css files
    indentedSyntax: true, // Use the indented SASS syntax instead of SCSS
    outputStyle: 'compressed' // Compress/minify the output file
});

// Create a new dice controller
const diceController: DiceController = new DiceController(server);

app.use(logger); // Use the morgan logger to log requests
app.use(sass); // Use the sass middleware for compiling sass files
app.use(express.static(PUBLIC_PATH)); // Statically serve the public directory

// Creates a new rate limit
const limit: RateLimit = rateLimit({
    windowMs: RATE_LIMIT_MINUTES * 60 * 1000, // The number of ms to count requests in
    max: RATE_LIMIT_TOTAL, // The maximum requests per rate limiting window
    skip: (req: Request) => req.headers.authorization === RATE_BYPASS_KEY // Skip requests that match the bypass key
});

app.use('/api', limit); // Use the rate limiter
app.use('/api', api(diceController)); // Add the router from the api

app.use((req: Request, res: Response) => res.sendFile(ERROR_FILE_PATH)); // As a final resort display the error page

// Listen for requests on the port
server.listen(PORT, () => { // Callback for when the server is listening
    console.log('[HTTP] Server started listening at http://localhost:' + PORT); // Print a debug message to say we have started
});