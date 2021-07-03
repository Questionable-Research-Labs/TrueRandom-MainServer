import express, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import * as path from "path";
import morgan from "morgan";
import sassMiddleware from "node-sass-middleware"
import indexRouter from "../routes/index";
import apiRouter from "../routes/api";
import createError, {HttpError} from "http-errors";

const ROOT_PATH = path.join(__dirname, '../')

export const web: Express = express();
const logger = morgan('dev');
const viewsDir: string = path.join(ROOT_PATH, 'views');

web.set('views', viewsDir);
web.set('view engine', 'hbs');

web.use(sassMiddleware({
    src: path.join(ROOT_PATH, 'public'),
    dest: path.join(ROOT_PATH, 'public'),
    indentedSyntax: true,
    sourceMap: true,
    debug: true,
    includePaths: [path.join(ROOT_PATH, 'node_modules')],
    outputStyle: 'compressed'
}));
web.use(express.static(path.join(ROOT_PATH, 'public')));
web.use(logger);
web.use('/', indexRouter);
web.use('/api', rateLimit({
    windowMs: 60 * 1000,
    max: 1000
}))
web.use('/api', apiRouter);


web.use((req: Request, res: Response, next: NextFunction) => next(createError(404)));

web.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});



