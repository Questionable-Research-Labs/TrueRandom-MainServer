import express, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import * as path from "path";
import morgan from "morgan";
import {createServer, Server} from "http";
import sassMiddleware from "node-sass-middleware"
import indexRouter from "../routes/index";
import apiRouter from "../routes/api";
import createError, {HttpError} from "http-errors";

const ROOT_PATH = path.join(__dirname, '../')

const PORT: number = 8080; // The port to listen on

const app: Express = express();
const logger = morgan('dev');
const viewsDir: string = path.join(ROOT_PATH, 'views');

app.set('views', viewsDir);
app.set('view engine', 'hbs');

app.use(sassMiddleware({
    src: path.join(ROOT_PATH, 'public'),
    dest: path.join(ROOT_PATH, 'public'),
    indentedSyntax: true,
    sourceMap: true,
    debug: true,
    includePaths: [path.join(ROOT_PATH, 'node_modules')],
    outputStyle: 'compressed'
}));
app.use(express.static(path.join(ROOT_PATH, 'public')));
app.use(logger);
app.use('/', indexRouter);
app.use('/api', rateLimit({
    windowMs: 60 * 1000,
    max: 1000
}))
app.use('/api', apiRouter);


app.use((req: Request, res: Response, next: NextFunction) => next(createError(404)));

app.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});


const server: Server = createServer(app);
server.listen(PORT);
server.on('listening', () => console.log(`Server listening on http://localhost:${PORT}`));